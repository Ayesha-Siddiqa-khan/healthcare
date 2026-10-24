from collections.abc import Iterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg import Connection, Error
from psycopg.errors import UndefinedTable
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.core.config import Settings, get_settings
from app.features.clinic import service
from app.features.clinic.schemas import (
    Appointment,
    AppointmentIn,
    AppointmentStatusIn,
    ClinicStats,
    Patient,
    PatientIn,
)

router = APIRouter(prefix="/clinic", tags=["Clinic"])


_pool: ConnectionPool | None = None


def get_pool(settings: Settings) -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            settings.supabase_db_url.get_secret_value(),
            min_size=1,
            max_size=5,
            timeout=5,
            kwargs={"sslmode": "require", "row_factory": dict_row, "options": "-c statement_timeout=8000"},
        )
    return _pool


def get_connection(settings: Annotated[Settings, Depends(get_settings)]) -> Iterator[Connection]:
    if settings.supabase_db_url is None:
        raise HTTPException(503, detail={"code": "database_unconfigured"})
    try:
        # Exiting the block commits on success and rolls back when an error is raised.
        with get_pool(settings).connection() as connection:
            try:
                yield connection
            except UndefinedTable:
                raise HTTPException(503, detail={"code": "migration_required"})
            except Error:
                raise HTTPException(503, detail={"code": "database_unavailable"})
    except (Error, OSError, TimeoutError):
        raise HTTPException(503, detail={"code": "database_unavailable"})


Conn = Annotated[Connection, Depends(get_connection)]


@router.get("/patients", response_model=list[Patient])
def list_patients(conn: Conn, search: str | None = Query(default=None, max_length=80)):
    return service.list_patients(conn, search.strip() if search else None)


@router.post("/patients", response_model=Patient, status_code=201)
def create_patient(data: PatientIn, conn: Conn):
    return service.create_patient(conn, data)


@router.put("/patients/{patient_id}", response_model=Patient)
def update_patient(patient_id: UUID, data: PatientIn, conn: Conn):
    row = service.update_patient(conn, patient_id, data)
    if row is None:
        raise HTTPException(404, detail={"code": "patient_not_found"})
    return row


@router.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: UUID, conn: Conn) -> None:
    if not service.delete_patient(conn, patient_id):
        raise HTTPException(404, detail={"code": "patient_not_found"})


@router.get("/appointments", response_model=list[Appointment])
def list_appointments(conn: Conn):
    return service.list_appointments(conn)


@router.post("/appointments", response_model=Appointment, status_code=201)
def create_appointment(data: AppointmentIn, conn: Conn):
    row = service.create_appointment(conn, data)
    if row is None:
        raise HTTPException(404, detail={"code": "patient_not_found"})
    return row


@router.put("/appointments/{appointment_id}", response_model=Appointment)
def update_appointment(appointment_id: UUID, data: AppointmentIn, conn: Conn):
    row = service.update_appointment(conn, appointment_id, data)
    if row is None:
        raise HTTPException(404, detail={"code": "appointment_not_found"})
    return row


@router.delete("/appointments/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: UUID, conn: Conn) -> None:
    if not service.delete_appointment(conn, appointment_id):
        raise HTTPException(404, detail={"code": "appointment_not_found"})


@router.patch("/appointments/{appointment_id}/status", response_model=Appointment)
def update_appointment_status(appointment_id: UUID, data: AppointmentStatusIn, conn: Conn):
    row = service.update_appointment_status(conn, appointment_id, data.status)
    if row is None:
        raise HTTPException(404, detail={"code": "appointment_not_found"})
    return row


@router.get("/stats", response_model=ClinicStats)
def clinic_stats(conn: Conn):
    return service.read_stats(conn)
