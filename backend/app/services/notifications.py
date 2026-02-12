"""Notification hooks."""
from __future__ import annotations

from typing import Any, Dict, List, Optional


class NotificationService:
    def __init__(self) -> None:
        self.enabled = True
        self.buffer: List[Dict[str, Any]] = []

    def notify(self, event: str, payload: Optional[Dict[str, Any]] = None) -> bool:
        if not self.enabled:
            return False
        self.buffer.append({"event": event, "payload": payload or {}})
        if len(self.buffer) > 200:
            self.buffer = self.buffer[-200:]
        return True

    def drain(self) -> List[Dict[str, Any]]:
        items = list(self.buffer)
        self.buffer = []
        return items


service = NotificationService()
