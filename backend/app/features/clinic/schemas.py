from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

Gender = Literal["Female", "Male", "Other"]
AppointmentStatus = Literal["scheduled", "completed", "cancelled"]
PHONE_PATTERN = r"^\+?[0-9 ()\-]+$"


class PatientIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=120)
    age: int = Field(ge=0, le=120)
    gender: Gender
    phone: str = Field(min_length=3, max_length=30, pattern=PHONE_PATTERN)


class Patient(PatientIn):
    id: UUID


class AppointmentIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    patient_id: UUID
    starts_at: datetime
    visit_type: str = Field(default="Consultation", min_length=1, max_length=80)


class AppointmentStatusIn(BaseModel):
    status: AppointmentStatus


class Appointment(BaseModel):
    id: UUID
    patient_id: UUID
    patient_name: str
    starts_at: datetime
    visit_type: str
    status: AppointmentStatus


class ClinicStats(BaseModel):
    patients: int
    appointments: int
    scheduled: int
