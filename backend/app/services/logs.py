"""Log persistence helpers."""
from __future__ import annotations

import json
from typing import Optional, Dict, Any
from sqlmodel import Session

from app.db.models import LogEntry


def create_log(
    session: Session,
    message: str,
    level: str = "info",
    run_id: Optional[int] = None,
    event: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> LogEntry:
    entry = LogEntry(
        run_id=run_id,
        level=level,
        message=message,
        event=event,
        payload=json.dumps(payload) if payload is not None else None,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry
