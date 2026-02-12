from fastapi import APIRouter
from app.core.config import get_settings
from app.plugins.manifest import list_plugins

router = APIRouter()


@router.get("/")
def get_config():
    settings = get_settings().masked
    settings["plugins"] = list_plugins()
    return settings
