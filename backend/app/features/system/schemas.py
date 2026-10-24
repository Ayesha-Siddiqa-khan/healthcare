from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ServiceCheck(BaseModel):
    status: Literal["healthy", "unconfigured", "unavailable", "unknown"]
    message: str


class SystemStatus(BaseModel):
    status: Literal["healthy", "setup_required", "degraded"]
    api: ServiceCheck
    database: ServiceCheck
    checked_at: datetime
