"""JSON-based settings storage."""
from __future__ import annotations

import json
import os
from typing import Any, Dict


DEFAULT_UI_SETTINGS: Dict[str, Any] = {
    "theme": "system",
    "timezone": "Asia/Shanghai",
    "notifications": {
        "enabled": True,
        "level": "info",
    },
}

DEFAULT_APP_SETTINGS: Dict[str, Any] = {
    "cookiecloud_url": "",
    "cookiecloud_uuid": "",
    "cookiecloud_password": "",
}


def _settings_path() -> str:
    database_url = os.getenv("DATABASE_URL", "sqlite:///./data/signflow.db")
    base_dir = os.path.dirname(database_url.replace("sqlite:///", ""))
    if not base_dir:
        base_dir = "."
    return os.path.join(base_dir, "settings.json")


def _load_raw() -> Dict[str, Any]:
    path = _settings_path()
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict):
            return {}
        return data
    except (json.JSONDecodeError, OSError):
        return {}


def _merge_defaults(base: Dict[str, Any], defaults: Dict[str, Any]) -> Dict[str, Any]:
    merged = defaults.copy()
    merged.update({k: v for k, v in base.items() if k in defaults})
    return merged


def load_all_settings() -> Dict[str, Any]:
    raw = _load_raw()
    if "ui_settings" in raw or "cookiecloud" in raw:
        ui_settings = _merge_defaults(raw.get("ui_settings", {}), DEFAULT_UI_SETTINGS)
        app_settings = _merge_defaults(raw.get("cookiecloud", {}), DEFAULT_APP_SETTINGS)
        return {"ui_settings": ui_settings, "cookiecloud": app_settings}

    # legacy flat structure
    ui_settings = _merge_defaults(raw, DEFAULT_UI_SETTINGS)
    app_settings = _merge_defaults(raw, DEFAULT_APP_SETTINGS)
    return {"ui_settings": ui_settings, "cookiecloud": app_settings}


def load_ui_settings() -> Dict[str, Any]:
    return load_all_settings()["ui_settings"]


def load_app_settings() -> Dict[str, Any]:
    return load_all_settings()["cookiecloud"]


def update_ui_settings(payload: Dict[str, Any]) -> Dict[str, Any]:
    data = load_all_settings()
    data["ui_settings"].update(payload)
    _write_all(data)
    return data["ui_settings"]


def update_app_settings(payload: Dict[str, Any]) -> Dict[str, Any]:
    data = load_all_settings()
    data["cookiecloud"].update(payload)
    _write_all(data)
    return data["cookiecloud"]


def _write_all(payload: Dict[str, Any]) -> None:
    path = _settings_path()
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
