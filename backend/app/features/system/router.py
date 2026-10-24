from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.core.database import check_database
from app.features.system.schemas import ServiceCheck, SystemStatus

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/status", response_model=SystemStatus)
def system_status(
    settings: Annotated[Settings, Depends(get_settings)],
) -> SystemStatus:
    if settings.supabase_db_url is None:
        database = ServiceCheck(
            status="unconfigured",
            message="Add SUPABASE_DB_URL to backend/.env, then restart the API.",
        )
        status = "setup_required"
    elif check_database(settings):
        database = ServiceCheck(
            status="healthy", message="Supabase PostgreSQL accepted a read-only connection check."
        )
        status = "healthy"
    else:
        database = ServiceCheck(
            status="unavailable",
            message="Could not connect. Check the Supabase connection string and project availability.",
        )
        status = "degraded"

    return SystemStatus(
        status=status,
        api=ServiceCheck(status="healthy", message="FastAPI is responding to requests."),
        database=database,
        checked_at=datetime.now(UTC),
    )
