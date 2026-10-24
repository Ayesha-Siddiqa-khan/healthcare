from fastapi import APIRouter

from app.features.system.router import router as system_router
from app.features.demo.router import router as demo_router
from app.features.clinic.router import router as clinic_router

router = APIRouter(prefix="/api/v1")
router.include_router(system_router)
router.include_router(demo_router)
router.include_router(clinic_router)
