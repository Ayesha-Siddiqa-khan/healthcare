from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from psycopg import OperationalError
from psycopg.errors import InvalidSchemaName, UndefinedTable

from app.core.config import Settings, get_settings
from app.features.demo.schemas import DemoOverview
from app.features.demo.service import read_overview
from app.main import app


def demo_data():
    return DemoOverview(
        fetched_at=datetime(2026, 10, 24, tzinfo=UTC),
        patients=[{"id": "DEMO-P001", "display_name": "Demo Patient 01", "age": 32, "care_status": "stable"}],
        clinicians=[{"id": "DEMO-C001", "display_name": "Demo Clinician A", "specialty": "General medicine"}],
        appointments=[{
            "id": "DEMO-A001", "patient_name": "Demo Patient 01", "clinician_name": "Demo Clinician A",
            "starts_at": "2026-10-25T04:00:00Z", "visit_type": "Routine review", "status": "scheduled",
        }],
    )


@pytest.fixture
def client():
    app.dependency_overrides[get_settings] = lambda: Settings(
        _env_file=None, supabase_db_url="postgresql://user:private-password@example/postgres", demo_enabled=True,
    )
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.mark.parametrize("enabled,url,expected", [
    (False, None, "demo_disabled"),
    (True, None, "database_unconfigured"),
])
def test_setup_required_never_connects(client, monkeypatch, enabled, url, expected):
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, supabase_db_url=url, demo_enabled=enabled)
    read = MagicMock(side_effect=AssertionError("Must not query"))
    monkeypatch.setattr("app.features.demo.router.read_overview", read)
    response = client.get("/api/v1/demo/overview")
    assert response.status_code == 503
    assert response.json() == {"detail": {"code": expected}}
    assert response.headers["cache-control"] == "no-store"
    read.assert_not_called()


def test_returns_only_database_response(client, monkeypatch):
    monkeypatch.setattr("app.features.demo.router.read_overview", lambda _: demo_data())
    response = client.get("/api/v1/demo/overview")
    assert response.status_code == 200
    assert response.json()["source"] == "supabase_postgres"
    assert response.json()["patients"][0]["id"] == "DEMO-P001"
    assert response.headers["cache-control"] == "no-store"


@pytest.mark.parametrize("error,expected", [
    (UndefinedTable("private SQL"), "migration_required"),
    (InvalidSchemaName("private schema"), "migration_required"),
    (OperationalError("private-password@example"), "database_unavailable"),
    (TimeoutError("private host"), "database_unavailable"),
])
def test_driver_failures_do_not_leak_details(client, monkeypatch, error, expected):
    monkeypatch.setattr("app.features.demo.router.read_overview", MagicMock(side_effect=error))
    response = client.get("/api/v1/demo/overview")
    assert response.status_code == 503
    assert response.json() == {"detail": {"code": expected}}
    assert "private" not in response.text


def test_invalid_database_rows_are_not_returned(client, monkeypatch):
    def invalid(_):
        return DemoOverview(fetched_at=datetime.now(UTC), patients=[{}], clinicians=[], appointments=[])
    monkeypatch.setattr("app.features.demo.router.read_overview", invalid)
    response = client.get("/api/v1/demo/overview")
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "data_invalid"


def test_service_uses_only_bounded_selects_and_read_only_connection(monkeypatch):
    connect = MagicMock()
    cursor = connect.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value
    sample = demo_data().model_dump()
    cursor.fetchall.side_effect = [sample["patients"], sample["clinicians"], sample["appointments"]]
    monkeypatch.setattr("app.features.demo.service.Connection.connect", connect)
    settings = Settings(_env_file=None, supabase_db_url="postgresql://unused", demo_enabled=True)
    result = read_overview(settings)
    assert len(result.patients) == 1
    assert len(result.appointments) == 1
    options = connect.call_args.kwargs
    assert options["sslmode"] == "require"
    assert options["connect_timeout"] == 3
    assert "default_transaction_read_only=on" in options["options"]
    assert "statement_timeout=5000" in options["options"]
    assert cursor.execute.call_count == 3
    for call in cursor.execute.call_args_list:
        query = call.args[0]
        assert query.startswith("SELECT ")
        assert "healthcare_demo." in query
        assert "LIMIT 100" in query
    connect.return_value.__exit__.assert_called_once()


def test_demo_has_no_write_endpoints(client):
    assert client.post("/api/v1/demo/overview", json={}).status_code == 405
