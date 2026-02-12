from sqlmodel import SQLModel, create_engine, Session
from app.core.config import get_settings
from app.db.models import Site, Run, LogEntry

settings = get_settings()
engine = create_engine(settings.database_url, echo=False)


def init_db():
    SQLModel.metadata.create_all(engine)



def get_session():
    with Session(engine) as session:
        yield session
