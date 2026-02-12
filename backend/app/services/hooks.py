"""Hook helpers for logging + notifications."""
from __future__ import annotations

from typing import Any, Dict, Optional
from sqlmodel import Session

from app.services.logs import create_log
from app.services.notifications import service as notification_service


LEVELS = {"debug", "info", "warning", "error"}


def log_event(
    session: Session,
    message: str,
    *,
    level: str = "info",
    run_id: Optional[int] = None,
    event: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
) -> None:
    safe_level = level if level in LEVELS else "info"
    entry = create_log(session, message, level=safe_level, run_id=run_id, event=event, payload=payload)
    notification_service.notify(
        event or f"log.{safe_level}",
        {
            "log_id": entry.id,
            "run_id": run_id,
            "message": message,
            "level": safe_level,
            "payload": payload or {},
        },
    )
