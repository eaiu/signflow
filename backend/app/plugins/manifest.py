"""Plugin manifest helper."""
from __future__ import annotations

from typing import Dict, List

from app.plugins.registry import get_registry


def list_plugins() -> List[Dict[str, str]]:
    return [
        {
            "key": plugin.key,
            "name": plugin.name,
            "description": plugin.description,
        }
        for plugin in get_registry().list()
    ]
