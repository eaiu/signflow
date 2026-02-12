"""CookieCloud sync service."""
from __future__ import annotations

import hashlib
import json
from typing import Dict, Any
import requests

from app.core.config import get_settings
from app.services.crypto import encrypt_cryptojs


class CookieCloudClient:
    def __init__(self):
        self.settings = get_settings()

    def sync(self, profile: str) -> Dict[str, Any]:
        if not self.settings.cookiecloud_url:
            return {"ok": False, "message": "CookieCloud not configured"}

        payload = self._build_payload(profile)
        if not payload["ok"]:
            return payload

        try:
            url = self.settings.cookiecloud_url.rstrip("/") + "/update"
            if self.settings.cookiecloud_send_json:
                response = requests.post(
                    url,
                    json=payload["data"],
                    timeout=self.settings.cookiecloud_timeout,
                    verify=self.settings.cookiecloud_verify_ssl,
                )
            else:
                response = requests.post(
                    url,
                    data=payload["data"],
                    timeout=self.settings.cookiecloud_timeout,
                    verify=self.settings.cookiecloud_verify_ssl,
                )
            response.raise_for_status()
            data = response.json()
            ok = data.get("action") == "done"
            return {
                "ok": ok,
                "profile": profile,
                "message": data.get("message", "CookieCloud sync done" if ok else "CookieCloud sync failed"),
                "response": data,
            }
        except requests.RequestException as exc:
            return {"ok": False, "profile": profile, "message": f"CookieCloud request failed: {exc}"}

    def _build_payload(self, profile: str) -> Dict[str, Any]:
        if not self.settings.cookiecloud_key or not self.settings.cookiecloud_password:
            return {"ok": False, "message": "CookieCloud key/password missing"}

        cookie_data = {"_meta": {"profile": profile}}
        payload = json.dumps({"cookie_data": cookie_data}).encode("utf-8")
        encrypted = encrypt_cryptojs(payload, self._crypt_key())
        return {
            "ok": True,
            "data": {
                "uuid": self.settings.cookiecloud_key,
                "encrypted": encrypted,
            },
        }

    def _crypt_key(self) -> bytes:
        md5 = hashlib.md5()
        md5.update(f"{self.settings.cookiecloud_key}-{self.settings.cookiecloud_password}".encode("utf-8"))
        return md5.hexdigest()[:16].encode("utf-8")
