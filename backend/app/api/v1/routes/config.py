from fastapi import APIRouter
from app.core.config import get_settings

router = APIRouter()


@router.get("/")
def get_config():
    settings = get_settings()
    return settings.masked
