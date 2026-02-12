"""Plugin registry endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.plugins.loader import reload_configured_plugins
from app.plugins.manifest import list_plugins
from app.schemas.plugins import PluginList, PluginReloadResult

router = APIRouter()


@router.get("/", response_model=PluginList)
def list_registered_plugins():
    return list_plugins()


@router.post("/reload", response_model=PluginReloadResult)
def reload_registered_plugins():
    registry = reload_configured_plugins()
    return {
        "count": len(registry.list()),
        "plugins": list_plugins(),
    }
