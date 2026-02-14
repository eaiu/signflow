"""CookieCloud local cache/snapshot.

Cache is stored next to SQLite DB (same folder as settings.json).
This cache is used to:
- expose domain list per UUID for UI dropdowns
- avoid writing cookies when content unchanged
- provide cookies/localStorage to plugins at run time

NOTE: status API MUST NOT return raw cookies/localStorage.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


CACHE_VERSION = 1


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _data_dir() -> str:
    database_url = os.getenv("DATABASE_URL", "sqlite:///./data/signflow.db")
    base_dir = os.path.dirname(database_url.replace("sqlite:///", ""))
    if not base_dir:
        base_dir = "."
    return base_dir


def cache_path() -> str:
    return os.path.join(_data_dir(), "cookiecloud_cache.json")


def _safe_load_json(path: str) -> Dict[str, Any]:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _safe_write_json(path: str, payload: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)


def _normalize_domain(domain: str) -> str:
    return (domain or "").lstrip(".").strip().lower()


def _stable_hash_payload(payload: Any) -> str:
    """Compute a stable hash for cookie/localStorage payload.

    CookieCloud JSON ordering can vary; we normalize by:
    - sorting domains
    - sorting cookie lists by a stable key
    """

    def normalize(obj: Any) -> Any:
        if isinstance(obj, dict):
            # normalize cookie_data dict specially
            if set(obj.keys()) >= {"cookie_data", "local_storage_data"}:
                cd = obj.get("cookie_data") or {}
                ls = obj.get("local_storage_data") or {}
                return {
                    "cookie_data": normalize(cd),
                    "local_storage_data": normalize(ls),
                }
            return {k: normalize(obj[k]) for k in sorted(obj.keys())}
        if isinstance(obj, list):
            # try to sort list of dicts (cookies)
            if all(isinstance(x, dict) for x in obj):
                def sort_key(item: Dict[str, Any]) -> Tuple[str, str, str, str]:
                    return (
                        str(item.get("name") or ""),
                        str(item.get("domain") or ""),
                        str(item.get("path") or ""),
                        str(item.get("expires") or item.get("expirationDate") or ""),
                    )

                return [normalize(x) for x in sorted(obj, key=sort_key)]
            return [normalize(x) for x in obj]
        return obj

    normalized = normalize(payload)
    text = json.dumps(normalized, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    # use sha256 for lower collision risk
    import hashlib

    return hashlib.sha256(text.encode("utf-8")).hexdigest()


class CookieCloudCacheStore:
    def __init__(self, path: Optional[str] = None):
        self.path = path or cache_path()

    def load(self) -> Dict[str, Any]:
        raw = _safe_load_json(self.path)
        if not raw:
            return {"version": CACHE_VERSION, "updated_at": None, "uuids": {}}
        # basic shape guard
        uuids = raw.get("uuids") if isinstance(raw.get("uuids"), dict) else {}
        return {
            "version": raw.get("version") or CACHE_VERSION,
            "updated_at": raw.get("updated_at"),
            "uuids": uuids,
        }

    def save(self, data: Dict[str, Any]) -> None:
        payload = {
            "version": CACHE_VERSION,
            "updated_at": _utc_now_iso(),
            "uuids": data.get("uuids") or {},
        }
        _safe_write_json(self.path, payload)

    def upsert_uuid_snapshot(
        self,
        uuid: str,
        cookie_data: Dict[str, Any] | List[Any],
        local_storage_data: Dict[str, Any],
        new_hash: str,
        *,
        changed: bool,
    ) -> Dict[str, Any]:
        """Update cache for one UUID.

        If changed=False, we only update last_checked_at.
        """
        uuid = (uuid or "").strip()
        if not uuid:
            return self.load()

        current = self.load()
        uuids = current.get("uuids") or {}
        entry = uuids.get(uuid) if isinstance(uuids.get(uuid), dict) else {}

        now_iso = _utc_now_iso()
        entry["last_checked_at"] = now_iso

        if changed:
            # cookie_data can be dict(domain -> cookies) or list
            cookies_by_domain: Dict[str, List[Any]] = {}
            domain_summaries: List[Dict[str, Any]] = []

            if isinstance(cookie_data, dict):
                for domain, cookies in cookie_data.items():
                    d = _normalize_domain(str(domain))
                    if not d:
                        continue
                    cookie_list = cookies if isinstance(cookies, list) else [cookies]
                    cookies_by_domain[d] = cookie_list
                for d in sorted(cookies_by_domain.keys()):
                    domain_summaries.append({"domain": d, "cookie_count": len(cookies_by_domain[d])})
            elif isinstance(cookie_data, list):
                # best-effort group by cookie.domain
                for c in cookie_data:
                    if not isinstance(c, dict):
                        continue
                    d = _normalize_domain(str(c.get("domain") or "")) or "unknown"
                    cookies_by_domain.setdefault(d, []).append(c)
                for d in sorted(cookies_by_domain.keys()):
                    domain_summaries.append({"domain": d, "cookie_count": len(cookies_by_domain[d])})

            # normalize localStorage by domain key
            local_by_domain: Dict[str, Any] = {}
            if isinstance(local_storage_data, dict):
                for domain, v in local_storage_data.items():
                    d = _normalize_domain(str(domain))
                    if not d:
                        continue
                    local_by_domain[d] = v

            entry.update(
                {
                    "last_sync_at": now_iso,
                    "hash": new_hash,
                    "domain_count": len(domain_summaries),
                    "cookie_count": sum(item["cookie_count"] for item in domain_summaries),
                    "domains": domain_summaries,
                    # sensitive: kept locally only
                    "cookies": cookies_by_domain,
                    "local_storage": local_by_domain,
                }
            )

        uuids[uuid] = entry
        current["uuids"] = uuids
        self.save(current)
        return self.load()

    def get_status(self) -> Dict[str, Any]:
        data = self.load()
        uuids_in = data.get("uuids") or {}
        uuids_out: Dict[str, Any] = {}
        for uuid, entry in uuids_in.items():
            if not isinstance(entry, dict):
                continue
            uuids_out[uuid] = {
                "last_sync_at": entry.get("last_sync_at"),
                "last_checked_at": entry.get("last_checked_at"),
                "hash": entry.get("hash"),
                "domain_count": entry.get("domain_count") or (len(entry.get("domains") or []) if isinstance(entry.get("domains"), list) else 0),
                "cookie_count": entry.get("cookie_count"),
                "domains": entry.get("domains") or [],
            }
        return {
            "ok": True,
            "updated_at": data.get("updated_at"),
            "version": data.get("version"),
            "uuids": uuids_out,
        }

    def get_domain_cookies(self, uuid: str, domain: str) -> List[Dict[str, Any]]:
        data = self.load()
        entry = (data.get("uuids") or {}).get(uuid)
        if not isinstance(entry, dict):
            return []
        cookies = entry.get("cookies") or {}
        if not isinstance(cookies, dict):
            return []
        d = _normalize_domain(domain)
        value = cookies.get(d)
        if isinstance(value, list):
            return [c for c in value if isinstance(c, dict)]
        return []

    def get_domain_local_storage(self, uuid: str, domain: str) -> Dict[str, Any]:
        data = self.load()
        entry = (data.get("uuids") or {}).get(uuid)
        if not isinstance(entry, dict):
            return {}
        ls = entry.get("local_storage") or {}
        if not isinstance(ls, dict):
            return {}
        d = _normalize_domain(domain)
        value = ls.get(d)
        return value if isinstance(value, dict) else {}


def compute_uuid_hash(cookie_data: Any, local_storage_data: Any) -> str:
    return _stable_hash_payload({"cookie_data": cookie_data or {}, "local_storage_data": local_storage_data or {}})


def match_domain_by_url(url: str, domains: List[str]) -> Optional[str]:
    """Match best cookie domain for a given site URL hostname.

    Rule: hostname suffix match; choose the longest matched domain.
    """
    try:
        from urllib.parse import urlparse

        hostname = (urlparse(url).hostname or "").lower()
    except Exception:
        hostname = ""
    if not hostname:
        return None

    candidates: List[str] = []
    for d in domains:
        nd = _normalize_domain(d)
        if not nd:
            continue
        if hostname == nd or hostname.endswith("." + nd):
            candidates.append(nd)
    if not candidates:
        return None
    return sorted(candidates, key=len, reverse=True)[0]
