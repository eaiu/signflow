"""Plugin interface for site automation."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional, Any


@dataclass
class PluginResult:
    ok: bool
    message: str = ""
    data: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def success(cls, message: str = "", **data: Any) -> "PluginResult":
        return cls(ok=True, message=message, data=data)

    @classmethod
    def failure(cls, message: str, **data: Any) -> "PluginResult":
        return cls(ok=False, message=message, data=data)


@dataclass
class PluginContext:
    run_id: int
    site_id: int
    site_name: str
    site_url: str
    cookie_domain: Optional[str]
    cookiecloud_profile: Optional[str]
    started_at: datetime
    notes: Optional[str]


class SitePlugin:
    """Base class for site plugins."""

    key: str = "base"
    name: str = "Base Plugin"
    description: str = ""

    def before_run(self, context: PluginContext) -> Optional[PluginResult]:
        return None

    def run(self, context: PluginContext) -> PluginResult:
        raise NotImplementedError

    def after_run(self, context: PluginContext, result: PluginResult) -> Optional[PluginResult]:
        return None
