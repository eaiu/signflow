# Site Plugins

SignFlow uses a simple plugin system to execute site-specific automation.

## How it works

- Each **Site** can reference a plugin via `plugin_key`.
- Each **Run** can override the site plugin by sending `plugin_key` in `POST /runs`.
- Plugins are discovered at startup from `PLUGIN_PATHS` (comma-separated module paths).
- Plugin hooks:
  - `before_run(context)` → optional pre-flight check
  - `run(context)` → required; returns `PluginResult`
  - `after_run(context, result)` → optional post-processing

## Configuration

`.env`:

```
PLUGIN_PATHS=app.plugins
```

## Creating a plugin

```python
from app.plugins.base import SitePlugin, PluginContext, PluginResult
from app.plugins.decorators import register_plugin

@register_plugin
class MyPlugin(SitePlugin):
    key = "my-plugin"
    name = "My Plugin"
    description = "Example plugin"

    def run(self, context: PluginContext) -> PluginResult:
        return PluginResult.success("All good")
```

## Sample plugins

- `echo` → returns site metadata for quick testing
- `cookiecloud-sync` → validates that CookieCloud profile exists

## Execution logs

Executor writes logs for:
- plugin start
- before_run / run / after_run messages
- success/failure status
