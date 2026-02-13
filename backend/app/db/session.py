from sqlmodel import SQLModel, create_engine, Session
from app.core.config import get_settings
from app.db.models import Site, Run, LogEntry
from app.migrations import migrate_logs_payload

settings = get_settings()
engine = create_engine(settings.database_url, echo=False)


def init_db():
    SQLModel.metadata.create_all(engine)
    if settings.database_url.startswith("sqlite:///"):
        db_path = settings.database_url.replace("sqlite:///", "")
        migrate_logs_payload(db_path)
    _ensure_cookiecloud_uuid(engine)


def get_session():
    with Session(engine) as session:
        yield session


# lightweight migration: add cookiecloud_uuid column if missing
def _ensure_cookiecloud_uuid(engine):
    try:
        with engine.connect() as conn:
            res = conn.exec_driver_sql("PRAGMA table_info(site)").fetchall()
            cols = [row[1] for row in res]
            if "cookiecloud_uuid" not in cols and "cookiecloud_profile" in cols:
                # add new column, copy data
                conn.exec_driver_sql("ALTER TABLE site ADD COLUMN cookiecloud_uuid TEXT")
                conn.exec_driver_sql("UPDATE site SET cookiecloud_uuid = cookiecloud_profile WHERE cookiecloud_uuid IS NULL")
    except Exception:
        return

