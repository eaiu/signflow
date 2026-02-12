"""Custom plugin storage and registration."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List

from app.core.config import get_settings
from app.plugins.base import SitePlugin, PluginConfigField, PluginResult
from app.plugins.registry import get_registry
from app.services.notifications import service as notification_service


DATA_ROOT = Path("./data")
PLUGIN_DIR = "plugins"


def _plugin_root() -> Path:
    settings = get_settings()
    base_dir = settings.database_url.replace("sqlite:///", "")
    base_path = Path(base_dir).parent if base_dir else DATA_ROOT
    return base_path / PLUGIN_DIR


def _plugin_path(key: str) -> Path:
    return _plugin_root() / f"{key}.json"


def list_custom_plugins() -> List[Dict[str, object]]:
    root = _plugin_root()
    if not root.exists():
        return []
    plugins = []
    for file in root.glob("*.json"):
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not data:
            continue
        plugins.append(_to_meta(data))
    return plugins


def create_or_update_plugin(payload) -> Dict[str, object]:
    root = _plugin_root()
    root.mkdir(parents=True, exist_ok=True)
    data = payload.dict()
    path = _plugin_path(data["key"])
    path.write_text(_serialize(payload), encoding="utf-8")
    _register_plugin(payload)
    notification_service.notify("plugin.saved", {"plugin": data["key"]})
    return _to_meta(data)


def load_plugin_payloads() -> List[Dict[str, object]]:
    root = _plugin_root()
    if not root.exists():
        return []
    payloads = []
    for file in root.glob("*.json"):
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not data:
            continue
        payloads.append(data)
    return payloads


def _serialize(payload) -> str:
    return json.dumps(payload.dict(), ensure_ascii=False, indent=2)


def _register_plugin(payload) -> None:
    plugin_cls = _build_plugin_class(payload)
    get_registry().register(plugin_cls)


def _build_plugin_class(payload):
    class CustomPlugin(SitePlugin):
        key = payload.key
        name = payload.name
        description = payload.description or ""
        version = payload.version or "1.0"
        category = payload.category or "custom"
        config_schema = [PluginConfigField(**field.dict()) for field in payload.config_schema]
        run_code = payload.run_code or ""

        def run(self, context):
            namespace = {
                "context": context,
                "PluginResult": PluginResult,
            }
            try:
                exec(self.run_code, namespace)
                if "run" in namespace and callable(namespace["run"]):
                    return namespace["run"](context)
                return PluginResult.failure("run() not defined in plugin code")
            except Exception as exc:  # noqa: BLE001
                return PluginResult.failure(f"Plugin error: {exc}")

    return CustomPlugin


def _to_meta(data: Dict[str, object]) -> Dict[str, object]:
    return {
        "key": data.get("key"),
        "name": data.get("name"),
        "description": data.get("description", ""),
        "version": data.get("version", "1.0"),
        "category": data.get("category", "custom"),
        "config_schema": data.get("config_schema") or [],
    }

__all__ = ["list_custom_plugins", "create_or_update_plugin", "load_plugin_payloads", "_register_plugin"]
