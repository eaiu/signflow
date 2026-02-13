"""CookieCloud sync service."""
from __future__ import annotations

import hashlib
import json
from typing import Dict, Any, List, Optional
import requests

from app.core.config import get_settings
from app.services.settings_store import load_app_settings
from app.services.crypto import decrypt_cryptojs


class CookieCloudClient:
    def __init__(self):
        self.settings = get_settings()
        self.local = load_app_settings()

    def sync(self, uuid: Optional[str] = None) -> Dict[str, Any]:
        """Fetch CookieCloud payload(s), decrypt, and return cookie/localStorage data."""
        if not (self.local.get("cookiecloud_url") or self.settings.cookiecloud_url):
            return {"ok": False, "message": "CookieCloud not configured"}

        uuid_list = self._uuid_list(uuid)
        if not uuid_list:
            return {"ok": False, "message": "CookieCloud uuid missing"}

        if not (self.local.get("cookiecloud_password") or self.settings.cookiecloud_password):
            return {"ok": False, "message": "CookieCloud password missing"}

        all_payloads = []
        for item in uuid_list:
            payload = self._fetch_payload(item)
            if not payload:
                continue
            all_payloads.append({"uuid": item, **payload})

        if not all_payloads:
            return {"ok": False, "message": "CookieCloud payload empty"}

        results = []
        for payload in all_payloads:
            decrypted = self._decrypt_payload(payload["uuid"], payload.get("encrypted"))
            if not decrypted:
                results.append({"uuid": payload["uuid"], "ok": False, "message": "decrypt failed"})
                continue
            try:
                parsed = json.loads(decrypted)
            except json.JSONDecodeError:
                results.append({"uuid": payload["uuid"], "ok": False, "message": "invalid json"})
                continue
            results.append({
                "uuid": payload["uuid"],
                "ok": True,
                "cookie_data": parsed.get("cookie_data") or {},
                "local_storage_data": parsed.get("local_storage_data") or {},
            })

        return {"ok": True, "count": len(results), "results": results}

    def _uuid_list(self, uuid: Optional[str]) -> List[str]:
        if uuid:
            return [uuid]
        setting = (self.settings.get_cookiecloud_uuid() or "").strip()
        if not setting:
            return []
        return [item.strip() for item in setting.split(",") if item.strip()]

    def _fetch_payload(self, uuid: str) -> Dict[str, Any] | None:
        base = self.local.get("cookiecloud_url") or self.settings.cookiecloud_url
        url = base.rstrip("/") + f"/get/{uuid}"
        try:
            response = requests.get(
                url,
                timeout=self.settings.cookiecloud_timeout,
                verify=self.settings.cookiecloud_verify_ssl,
            )
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, dict):
                return None
            return data
        except requests.RequestException:
            return None

    def _decrypt_payload(self, uuid: str, encrypted: str | None) -> str | None:
        if not encrypted:
            return None
        password = self.local.get("cookiecloud_password") or self.settings.cookiecloud_password
        for use_dash in (True, False):
            key = self._crypt_key(uuid, password, use_dash)
            try:
                return decrypt_cryptojs(encrypted, key).decode("utf-8")
            except Exception:
                continue
        return None

    @staticmethod
    def _crypt_key(uuid: str, password: str, use_dash: bool = True) -> bytes:
        md5 = hashlib.md5()
        sep = "-" if use_dash else ""
        md5.update(f"{uuid}{sep}{password}".encode("utf-8"))
        return md5.hexdigest()[:16].encode("utf-8")
