"""Plugin manifest helper."""
from __future__ import annotations

from dataclasses import asdict, is_dataclass
from typing import Dict, List

from app.plugins.registry import get_registry


def _field_payload(field) -> dict:
    data = asdict(field) if is_dataclass(field) else dict(field)
    return {
        "key": data.get("key"),
        "label": data.get("label"),
        "field_type": data.get("field_type", "text"),
        "required": bool(data.get("required", False)),
        "placeholder": data.get("placeholder"),
        "description": data.get("description"),
        "options": data.get("options") or [],
    }


def list_plugins() -> List[Dict[str, object]]:
    return [
        {
            "key": plugin.key,
            "name": plugin.name,
            "description": plugin.description,
            "version": getattr(plugin, "version", "1.0"),
            "category": getattr(plugin, "category", "general"),
            "config_schema": [_field_payload(field) for field in getattr(plugin, "config_schema", [])],
        }
        for plugin in get_registry().list()
    ]
