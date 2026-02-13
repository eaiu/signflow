from fastapi import APIRouter, Depends
from app.core.config import get_settings
from app.core.security import require_admin_token
from app.plugins.manifest import list_plugins
from app.schemas.config import ConfigResponse, ConfigUpdate, ConfigUpdateResponse
from app.services.settings_store import load_ui_settings, load_app_settings, update_ui_settings, update_app_settings

router = APIRouter()


@router.get("/", response_model=ConfigResponse)
def get_config():
    app_settings = get_settings()
    settings = app_settings.masked
    app_local = load_app_settings()
    settings["cookiecloud_url"] = app_local.get("cookiecloud_url") or settings["cookiecloud_url"]
    settings["cookiecloud_uuid"] = app_local.get("cookiecloud_uuid") or app_settings.get_cookiecloud_uuid()
    settings["cookiecloud_password"] = app_local.get("cookiecloud_password") or settings["cookiecloud_password"]
    settings["plugins"] = list_plugins()
    settings["ui_settings"] = load_ui_settings()
    return settings


@router.patch("/", response_model=ConfigUpdateResponse, dependencies=[Depends(require_admin_token)])
def update_config(payload: ConfigUpdate):
    data = payload.dict(exclude_unset=True)
    ui = {k: v for k, v in data.items() if k in {"theme", "timezone", "notifications"}}
    app = {k: v for k, v in data.items() if k in {"cookiecloud_url", "cookiecloud_uuid", "cookiecloud_password"}}
    if ui:
        ui_settings = update_ui_settings(ui)
    else:
        ui_settings = load_ui_settings()
    if app:
        update_app_settings(app)
    return {"ok": True, "settings": ui_settings}
