"""Config storage helpers for plugins."""
from __future__ import annotations

import json
from typing import Dict, Optional


def serialize_config(payload: Optional[Dict[str, object]]) -> Optional[str]:
    if payload is None:
        return None
    return json.dumps(payload)


def deserialize_config(raw: Optional[str]) -> Optional[Dict[str, object]]:
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
