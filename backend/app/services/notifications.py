"""Notification hooks (placeholder)."""
from __future__ import annotations

from typing import Any, Dict, Optional


class NotificationService:
    def __init__(self) -> None:
        self.enabled = True

    def notify(self, event: str, payload: Optional[Dict[str, Any]] = None) -> bool:
        # Placeholder for future integrations (Slack, email, etc.)
        return True


service = NotificationService()
