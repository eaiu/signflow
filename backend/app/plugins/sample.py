"""Sample plugins."""
from __future__ import annotations

from datetime import datetime

from app.plugins.base import SitePlugin, PluginContext, PluginResult
from app.plugins.decorators import register_plugin


@register_plugin
class EchoPlugin(SitePlugin):
    key = "echo"
    name = "Echo"
    description = "Return a quick echo response for testing."

    def run(self, context: PluginContext) -> PluginResult:
        return PluginResult.success(
            message=f"Echoed {context.site_name}",
            site=context.site_name,
            url=context.site_url,
            at=datetime.utcnow().isoformat(),
        )


@register_plugin
class CookieCloudPlugin(SitePlugin):
    key = "cookiecloud-sync"
    name = "CookieCloud Sync"
    description = "Trigger CookieCloud sync when profile is provided."

    def run(self, context: PluginContext) -> PluginResult:
        if not context.cookiecloud_profile:
            return PluginResult.failure("No CookieCloud profile configured.")
        return PluginResult.success(
            message=f"CookieCloud sync scheduled for {context.cookiecloud_profile}.",
            profile=context.cookiecloud_profile,
        )
