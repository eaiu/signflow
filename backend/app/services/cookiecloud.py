"""CookieCloud sync service (stub)."""
from typing import Dict, Any
from app.core.config import get_settings


class CookieCloudClient:
    def __init__(self):
        self.settings = get_settings()

    def sync(self, profile: str) -> Dict[str, Any]:
        if not self.settings.cookiecloud_url:
            return {"ok": False, "message": "CookieCloud not configured"}
        return {
            "ok": True,
            "profile": profile,
            "message": "CookieCloud sync stub - implement network call",
        }
