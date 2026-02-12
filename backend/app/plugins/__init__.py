"""SignFlow site plugin system."""
from app.plugins.base import SitePlugin, PluginContext, PluginResult, PluginConfigField
from app.plugins.decorators import register_plugin
from app.plugins.registry import get_registry

__all__ = [
    "SitePlugin",
    "PluginContext",
    "PluginResult",
    "PluginConfigField",
    "register_plugin",
    "get_registry",
]
