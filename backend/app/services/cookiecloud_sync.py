"""CookieCloud sync service with local cache + diff.

This layer:
- Calls CookieCloudClient.sync() to fetch decrypted cookie/localStorage data.
- Computes stable hash for each UUID payload.
- Updates local cache only when content changed.

Used by:
- API: POST /cookiecloud/sync (manual sync)
- Executor: before each run, if site.cookiecloud_uuid is set
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from app.services.cookiecloud import CookieCloudClient
from app.services.cookiecloud_cache import CookieCloudCacheStore, compute_uuid_hash


class CookieCloudSyncService:
    def __init__(self, cache: Optional[CookieCloudCacheStore] = None):
        self.client = CookieCloudClient()
        self.cache = cache or CookieCloudCacheStore()

    def status(self) -> Dict[str, Any]:
        return self.cache.get_status()

    def sync(self, uuid: str | None = None) -> Dict[str, Any]:
        """Sync CookieCloud and persist cache.

        Returns the original CookieCloudClient.sync response with additional fields:
        - cache_updated: bool
        - cache: status snapshot (no raw cookies)
        - results[].hash / changed
        """
        response = self.client.sync(uuid)
        if not response.get("ok"):
            return response

        status_before = self.cache.get_status()
        updated_any = False
        # Iterate results, compute hash per UUID and update cache.
        for res in response.get("results") or []:
            if not res.get("ok"):
                continue
            u = res.get("uuid")
            cookie_data = res.get("cookie_data") or {}
            local_storage_data = res.get("local_storage_data") or {}
            new_hash = compute_uuid_hash(cookie_data, local_storage_data)

            before_entry = (status_before.get("uuids") or {}).get(u) if isinstance(status_before.get("uuids"), dict) else None
            before_hash = before_entry.get("hash") if isinstance(before_entry, dict) else None
            changed = (before_hash != new_hash)
            if changed:
                updated_any = True

            # Always write last_checked_at; only write cookies when changed
            self.cache.upsert_uuid_snapshot(
                u,
                cookie_data=cookie_data,
                local_storage_data=local_storage_data,
                new_hash=new_hash,
                changed=changed,
            )
            res["hash"] = new_hash
            res["changed"] = changed

        status_after = self.cache.get_status()
        response["cache_updated"] = updated_any
        response["cache"] = status_after
        return response
