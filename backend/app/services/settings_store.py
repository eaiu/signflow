"""JSON-based settings storage."""
from __future__ import annotations

import json
import os
from typing import Any, Dict

from app.core.config import get_settings


DEFAULT_SETTINGS: Dict[str, Any] = {
    "theme": "system",
    "timezone": "Asia/Shanghai",
    "notifications": {
        "enabled": True,
        "level": "info",
    },
}


def _settings_path() -> str:
    settings = get_settings()
    base_dir = os.path.dirname(settings.database_url.replace("sqlite:///", ""))
    if not base_dir:
        base_dir = "."
    return os.path.join(base_dir, "settings.json")


def load_settings() -> Dict[str, Any]:
    path = _settings_path()
    if not os.path.exists(path):
        return DEFAULT_SETTINGS.copy()
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict):
            return DEFAULT_SETTINGS.copy()
        merged = DEFAULT_SETTINGS.copy()
        merged.update(data)
        return merged
    except (json.JSONDecodeError, OSError):
        return DEFAULT_SETTINGS.copy()


def update_settings(payload: Dict[str, Any]) -> Dict[str, Any]:
    path = _settings_path()
    data = load_settings()
    data.update(payload)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
    return data
