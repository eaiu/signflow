from fastapi import APIRouter, Depends
from app.core.config import get_settings
from app.core.security import require_admin_token
from app.plugins.manifest import list_plugins
from app.schemas.config import ConfigResponse, ConfigUpdate, ConfigUpdateResponse
from app.services.settings_store import load_settings, update_settings

router = APIRouter()


@router.get("/", response_model=ConfigResponse)
def get_config():
    settings = get_settings().masked
    settings["plugins"] = list_plugins()
    settings["ui_settings"] = load_settings()
    return settings


@router.patch("/", response_model=ConfigUpdateResponse, dependencies=[Depends(require_admin_token)])
def update_config(payload: ConfigUpdate):
    data = update_settings(payload.dict(exclude_unset=True))
    return {"ok": True, "settings": data}
