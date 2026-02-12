"""Plugin registration helpers."""
from __future__ import annotations

from typing import Type

from app.plugins.base import SitePlugin
from app.plugins.registry import get_registry


def register_plugin(plugin_cls: Type[SitePlugin]) -> Type[SitePlugin]:
    get_registry().register(plugin_cls)
    return plugin_cls
