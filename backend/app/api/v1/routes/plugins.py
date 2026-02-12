"""Plugin registry endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_admin_token
from app.plugins.loader import reload_configured_plugins
from app.plugins.manifest import list_plugins
from app.plugins.store import create_or_update_plugin, list_custom_plugins
from app.schemas.plugins import PluginList, PluginReloadResult, PluginSaveRequest, PluginSaveResult

router = APIRouter()


@router.get("/", response_model=PluginList)
def list_registered_plugins():
    plugins = list_plugins()
    plugins.extend(list_custom_plugins())
    return plugins


@router.post("/reload", response_model=PluginReloadResult)
def reload_registered_plugins():
    registry = reload_configured_plugins()
    return {
        "count": len(registry.list()),
        "plugins": list_plugins(),
    }


@router.post("/custom", response_model=PluginSaveResult, dependencies=[Depends(require_admin_token)])
def save_custom_plugin(payload: PluginSaveRequest):
    saved = create_or_update_plugin(payload)
    return {"ok": True, "plugin": saved}
