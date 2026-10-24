from fastapi import FastAPI

from app.api.router import router

app = FastAPI(title="Healthcare API", version="0.1.0")
app.include_router(router)


@app.get("/health", tags=["System"])
async def health() -> dict[str, str]:
    """API liveness; database readiness is reported separately."""
    return {"status": "healthy", "service": "healthcare-api"}
