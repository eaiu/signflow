"""Inject CookieCloud cookies/localStorage into PluginContext.

Executor calls this before running a plugin.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.plugins.base import PluginContext
from app.services.cookiecloud_cache import CookieCloudCacheStore


def inject_cookiecloud_context(
    context: PluginContext,
    *,
    uuid: Optional[str],
    cookie_domain: Optional[str],
    cache: Optional[CookieCloudCacheStore] = None,
) -> PluginContext:
    if not uuid or not cookie_domain:
        return context
    store = cache or CookieCloudCacheStore()
    cookies: List[Dict[str, Any]] = store.get_domain_cookies(uuid, cookie_domain)
    local_storage: Dict[str, Any] = store.get_domain_local_storage(uuid, cookie_domain)
    context.cookiecloud_cookies = cookies
    context.cookiecloud_local_storage = local_storage
    return context
