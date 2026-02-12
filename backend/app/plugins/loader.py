"""Plugin loader helpers."""
from __future__ import annotations

from typing import List

from app.core.config import get_settings
from app.plugins.registry import load_plugins, reload_plugins


def parse_plugin_paths(raw: str) -> List[str]:
    if not raw:
        return []
    return [item.strip() for item in raw.split(",") if item.strip()]


def load_configured_plugins():
    settings = get_settings()
    paths = parse_plugin_paths(settings.plugin_paths)
    return load_plugins(paths)


def reload_configured_plugins():
    settings = get_settings()
    paths = parse_plugin_paths(settings.plugin_paths)
    return reload_plugins(paths)
