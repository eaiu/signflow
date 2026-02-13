from fastapi import APIRouter
from app.services.cookiecloud import CookieCloudClient

router = APIRouter()


@router.post("/sync")
def sync_cookiecloud(uuid: str | None = None):
    client = CookieCloudClient()
    return client.sync(uuid)
