from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DemoPatient(BaseModel):
    id: str
    display_name: str
    age: int = Field(ge=0, le=120)
    care_status: Literal["stable", "follow_up", "new"]


class DemoClinician(BaseModel):
    id: str
    display_name: str
    specialty: str


class DemoAppointment(BaseModel):
    id: str
    patient_name: str
    clinician_name: str
    starts_at: datetime
    visit_type: str
    status: Literal["scheduled", "completed", "cancelled"]


class DemoOverview(BaseModel):
    source: Literal["supabase_postgres"] = "supabase_postgres"
    fetched_at: datetime
    patients: list[DemoPatient]
    clinicians: list[DemoClinician]
    appointments: list[DemoAppointment]
