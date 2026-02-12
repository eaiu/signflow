"""Plugin loader helpers."""
from __future__ import annotations

from typing import List

from app.core.config import get_settings
from app.plugins.registry import load_plugins, reload_plugins
from app.plugins.store import load_plugin_payloads, _register_plugin
from app.schemas.plugins import PluginSaveRequest


def parse_plugin_paths(raw: str) -> List[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def load_configured_plugins():
    settings = get_settings()
    paths = parse_plugin_paths(settings.plugin_paths)
    registry = load_plugins(paths)
    _load_custom_plugins()
    return registry


def reload_configured_plugins():
    settings = get_settings()
    paths = parse_plugin_paths(settings.plugin_paths)
    registry = reload_plugins(paths)
    _load_custom_plugins()
    return registry


def _load_custom_plugins() -> None:
    for data in load_plugin_payloads():
        try:
            payload = PluginSaveRequest(
                key=data.get("key"),
                name=data.get("name"),
                description=data.get("description"),
                version=data.get("version"),
                category=data.get("category"),
                config_schema=data.get("config_schema") or [],
                run_code=data.get("run_code") or "",
            )
            _register_plugin(payload)
        except Exception:
            continue
