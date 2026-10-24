from datetime import UTC, datetime

from psycopg import Connection
from psycopg.rows import dict_row

from app.core.config import Settings
from app.features.demo.schemas import DemoOverview


def read_overview(settings: Settings) -> DemoOverview:
    """Read only the dedicated synthetic schema; never seed or migrate on request."""
    if settings.supabase_db_url is None:
        raise ValueError("Database configuration is required")

    with Connection.connect(
        settings.supabase_db_url.get_secret_value(),
        sslmode="require",
        connect_timeout=3,
        row_factory=dict_row,
        options="-c default_transaction_read_only=on -c statement_timeout=5000",
    ) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, display_name, age, care_status "
                "FROM healthcare_demo.patients ORDER BY id LIMIT 100"
            )
            patients = cursor.fetchall()
            cursor.execute(
                "SELECT id, display_name, specialty "
                "FROM healthcare_demo.clinicians ORDER BY id LIMIT 100"
            )
            clinicians = cursor.fetchall()
            cursor.execute(
                "SELECT a.id, p.display_name AS patient_name, "
                "c.display_name AS clinician_name, a.starts_at, a.visit_type, a.status "
                "FROM healthcare_demo.appointments AS a "
                "JOIN healthcare_demo.patients AS p ON p.id = a.patient_id "
                "JOIN healthcare_demo.clinicians AS c ON c.id = a.clinician_id "
                "ORDER BY a.starts_at, a.id LIMIT 100"
            )
            appointments = cursor.fetchall()

    return DemoOverview(
        fetched_at=datetime.now(UTC),
        patients=patients,
        clinicians=clinicians,
        appointments=appointments,
    )
