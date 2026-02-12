from fastapi import APIRouter
from app.core.config import get_settings
from app.plugins.manifest import list_plugins
from app.schemas.config import ConfigResponse

router = APIRouter()


@router.get("/", response_model=ConfigResponse)
def get_config():
    settings = get_settings().masked
    settings["plugins"] = list_plugins()
    return settings
