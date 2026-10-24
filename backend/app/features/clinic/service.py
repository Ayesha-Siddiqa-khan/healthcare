from typing import Any
from uuid import UUID

from psycopg import Connection

from app.features.clinic.schemas import AppointmentIn, PatientIn

Row = dict[str, Any] | None

APPOINTMENT_SELECT = (
    "select a.id, a.patient_id, p.name as patient_name, a.starts_at, a.visit_type, a.status "
    "from public.appointments as a join public.patients as p on p.id = a.patient_id "
)


def list_patients(conn: Connection, search: str | None) -> list[dict[str, Any]]:
    pattern = f"%{search}%" if search else None
    return conn.execute(
        "select id, name, age, gender, phone from public.patients "
        "where %(pattern)s::text is null or name ilike %(pattern)s or phone ilike %(pattern)s "
        "order by name",
        {"pattern": pattern},
    ).fetchall()


def create_patient(conn: Connection, data: PatientIn) -> Row:
    return conn.execute(
        "insert into public.patients (name, age, gender, phone) "
        "values (%(name)s, %(age)s, %(gender)s, %(phone)s) "
        "returning id, name, age, gender, phone",
        data.model_dump(),
    ).fetchone()


def update_patient(conn: Connection, patient_id: UUID, data: PatientIn) -> Row:
    return conn.execute(
        "update public.patients set name = %(name)s, age = %(age)s, gender = %(gender)s, phone = %(phone)s "
        "where id = %(id)s returning id, name, age, gender, phone",
        {**data.model_dump(), "id": patient_id},
    ).fetchone()


def delete_patient(conn: Connection, patient_id: UUID) -> bool:
    return conn.execute(
        "delete from public.patients where id = %s returning id", (patient_id,)
    ).fetchone() is not None


def list_appointments(conn: Connection) -> list[dict[str, Any]]:
    return conn.execute(APPOINTMENT_SELECT + "order by a.starts_at, a.id").fetchall()


def get_appointment(conn: Connection, appointment_id: UUID) -> Row:
    return conn.execute(APPOINTMENT_SELECT + "where a.id = %s", (appointment_id,)).fetchone()


def create_appointment(conn: Connection, data: AppointmentIn) -> Row:
    created = conn.execute(
        "insert into public.appointments (patient_id, starts_at, visit_type) "
        "select id, %(starts_at)s, %(visit_type)s from public.patients where id = %(patient_id)s "
        "returning id",
        data.model_dump(),
    ).fetchone()
    return get_appointment(conn, created["id"]) if created else None


def update_appointment(conn: Connection, appointment_id: UUID, data: AppointmentIn) -> Row:
    updated = conn.execute(
        "update public.appointments set patient_id = %(patient_id)s, starts_at = %(starts_at)s, visit_type = %(visit_type)s "
        "where id = %(id)s and exists (select 1 from public.patients where id = %(patient_id)s) returning id",
        {**data.model_dump(), "id": appointment_id},
    ).fetchone()
    return get_appointment(conn, appointment_id) if updated else None


def delete_appointment(conn: Connection, appointment_id: UUID) -> bool:
    return conn.execute(
        "delete from public.appointments where id = %s returning id", (appointment_id,)
    ).fetchone() is not None


def update_appointment_status(conn: Connection, appointment_id: UUID, status: str) -> Row:
    updated = conn.execute(
        "update public.appointments set status = %s where id = %s returning id",
        (status, appointment_id),
    ).fetchone()
    return get_appointment(conn, appointment_id) if updated else None


def read_stats(conn: Connection) -> dict[str, Any]:
    return conn.execute(
        "select (select count(*) from public.patients) as patients, "
        "(select count(*) from public.appointments) as appointments, "
        "(select count(*) from public.appointments where status = 'scheduled') as scheduled"
    ).fetchone()
