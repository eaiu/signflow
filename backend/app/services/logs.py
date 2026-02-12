"""Log persistence helpers."""
from __future__ import annotations

from typing import Optional
from sqlmodel import Session

from app.db.models import LogEntry


def create_log(session: Session, message: str, level: str = "info", run_id: Optional[int] = None) -> LogEntry:
    entry = LogEntry(run_id=run_id, level=level, message=message)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry
