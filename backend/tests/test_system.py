from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from psycopg import OperationalError

from app.core.config import Settings, get_settings
from app.core.database import check_database
from app.main import app


@pytest.fixture
def client():
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, supabase_db_url=None)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_liveness_does_not_require_database(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "healthcare-api"}


def test_missing_database_is_reported_honestly(client):
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "setup_required"
    assert data["api"]["status"] == "healthy"
    assert data["database"]["status"] == "unconfigured"
    assert "checked_at" in data


@pytest.mark.parametrize("connected,expected", [(True, "healthy"), (False, "degraded")])
def test_database_connection_results(client, monkeypatch, connected, expected):
    secret = "postgresql://user:private-password@localhost/postgres"
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None, supabase_db_url=secret)
    monkeypatch.setattr("app.features.system.router.check_database", lambda _: connected)
    response = client.get("/api/v1/system/status")
    assert response.json()["status"] == expected
    assert "private-password" not in response.text
    assert "localhost" not in response.text


def test_blank_connection_string_is_unconfigured():
    assert Settings(_env_file=None, supabase_db_url="  ").supabase_db_url is None


def test_database_probe_is_encrypted_read_only_and_closes_connection(monkeypatch):
    connect = MagicMock()
    connection = connect.return_value.__enter__.return_value
    cursor = connection.cursor.return_value.__enter__.return_value
    cursor.fetchone.return_value = (1,)
    monkeypatch.setattr("app.core.database.Connection.connect", connect)
    settings = Settings(_env_file=None, supabase_db_url="postgresql://example/postgres")
    assert check_database(settings) is True
    assert connect.call_args.kwargs["sslmode"] == "require"
    assert "default_transaction_read_only=on" in connect.call_args.kwargs["options"]
    assert connect.call_args.kwargs["connect_timeout"] == 3
    cursor.execute.assert_called_once_with("SELECT 1")
    connect.return_value.__exit__.assert_called_once()


def test_connection_error_does_not_escape_probe(monkeypatch):
    connect = MagicMock(side_effect=OperationalError("private connection details"))
    monkeypatch.setattr("app.core.database.Connection.connect", connect)
    settings = Settings(_env_file=None, supabase_db_url="postgresql://example/postgres")
    assert check_database(settings) is False
