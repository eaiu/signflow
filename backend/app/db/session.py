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


def get_session():
    with Session(engine) as session:
        yield session
