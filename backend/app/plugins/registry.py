"""Plugin registry and discovery."""
from __future__ import annotations

import importlib
import pkgutil
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional, Type

from app.plugins.base import SitePlugin


@dataclass
class PluginRegistry:
    plugins: Dict[str, SitePlugin] = field(default_factory=dict)

    def register(self, plugin_cls: Type[SitePlugin]) -> None:
        plugin = plugin_cls()
        self.plugins[plugin.key] = plugin

    def get(self, key: Optional[str]) -> Optional[SitePlugin]:
        if not key:
            return None
        return self.plugins.get(key)

    def list(self) -> List[SitePlugin]:
        return list(self.plugins.values())

    def reload(self, paths: Iterable[str]) -> "PluginRegistry":
        self.plugins = {}
        for path in paths:
            _import_all(path)
        return self


_registry: Optional[PluginRegistry] = None


def get_registry() -> PluginRegistry:
    global _registry
    if _registry is None:
        _registry = PluginRegistry()
    return _registry


def load_plugins(paths: Iterable[str]) -> PluginRegistry:
    registry = get_registry()
    for path in paths:
        _import_all(path)
    return registry


def reload_plugins(paths: Iterable[str]) -> PluginRegistry:
    registry = get_registry()
    return registry.reload(paths)


def _import_all(package_path: str) -> None:
    module = importlib.import_module(package_path)
    for _, name, is_pkg in pkgutil.iter_modules(module.__path__, module.__name__ + "."):
        importlib.import_module(name)
        if is_pkg:
            continue
