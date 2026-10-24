from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response
from psycopg import Error
from psycopg.errors import InvalidSchemaName, UndefinedTable
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.features.demo.schemas import DemoOverview
from app.features.demo.service import read_overview

router = APIRouter(prefix="/demo", tags=["Synthetic demo"])


@router.get("/overview", response_model=DemoOverview)
def demo_overview(
    response: Response,
    settings: Annotated[Settings, Depends(get_settings)],
) -> DemoOverview:
    response.headers["Cache-Control"] = "no-store"
    if not settings.demo_enabled:
        raise HTTPException(503, detail={"code": "demo_disabled"}, headers={"Cache-Control": "no-store"})
    if settings.supabase_db_url is None:
        raise HTTPException(503, detail={"code": "database_unconfigured"}, headers={"Cache-Control": "no-store"})
    try:
        return read_overview(settings)
    except (UndefinedTable, InvalidSchemaName):
        code = "migration_required"
    except ValidationError:
        code = "data_invalid"
    except (Error, OSError, TimeoutError):
        code = "database_unavailable"
    # Never expose SQL, connection strings, credentials or raw driver errors.
    raise HTTPException(503, detail={"code": code}, headers={"Cache-Control": "no-store"})
