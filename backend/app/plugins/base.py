"""Plugin interface for site automation."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional, Any, List


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
    cookiecloud_uuid: Optional[str]
    plugin_config: Optional[Dict[str, Any]]
    started_at: datetime
    notes: Optional[str]


@dataclass
class PluginConfigField:
    key: str
    label: str
    field_type: str = "text"
    required: bool = False
    placeholder: Optional[str] = None
    description: Optional[str] = None
    options: List[Dict[str, str]] = field(default_factory=list)


class SitePlugin:
    """Base class for site plugins."""

    key: str = "base"
    name: str = "Base Plugin"
    description: str = ""
    version: str = "1.0"
    category: str = "general"
    config_schema: List[PluginConfigField] = []

    def before_run(self, context: PluginContext) -> Optional[PluginResult]:
        return None

    def run(self, context: PluginContext) -> PluginResult:
        raise NotImplementedError

    def after_run(self, context: PluginContext, result: PluginResult) -> Optional[PluginResult]:
        return None
