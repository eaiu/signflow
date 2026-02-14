"""Sample plugins."""
from __future__ import annotations

from datetime import datetime

from app.plugins.base import SitePlugin, PluginContext, PluginResult, PluginConfigField
from app.plugins.decorators import register_plugin


@register_plugin
class EchoPlugin(SitePlugin):
    key = "echo"
    name = "Echo"
    description = "Return a quick echo response for testing."
    version = "1.1"
    category = "utility"
    config_schema = [
        PluginConfigField(
            key="greeting",
            label="Greeting",
            field_type="text",
            placeholder="Hello",
            description="Prefix appended to the echo response.",
        )
    ]

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
    category = "integration"
    config_schema = [
        PluginConfigField(
            key="uuid",
            label="Override profile",
            field_type="text",
            placeholder="Profile name",
            description="Optional CookieCloud profile override.",
        )
    ]

    def run(self, context: PluginContext) -> PluginResult:
        profile_override = None
        if context.plugin_config:
            profile_override = context.plugin_config.get("uuid")
        uuid = profile_override or context.cookiecloud_uuid
        if not uuid:
            return PluginResult.failure("No CookieCloud UUID configured.")
        # This is just a sample plugin. Actual CookieCloud sync happens in executor before run.
        return PluginResult.success(
            message=f"CookieCloud UUID detected: {uuid}.",
            uuid=uuid,
            cookie_count=len(context.cookiecloud_cookies or []),
        )
