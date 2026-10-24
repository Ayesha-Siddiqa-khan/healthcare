from psycopg import Connection, Error

from app.core.config import Settings


def check_database(settings: Settings) -> bool:
    """Probe connectivity without touching application schemas or records."""
    if settings.supabase_db_url is None:
        return False

    try:
        with Connection.connect(
            settings.supabase_db_url.get_secret_value(),
            sslmode="require",
            connect_timeout=3,
            autocommit=True,
            options="-c default_transaction_read_only=on -c statement_timeout=3000",
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                return cursor.fetchone() == (1,)
    except (Error, OSError, TimeoutError):
        # Driver errors can contain credentials or host details; never return them.
        return False
