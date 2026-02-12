from fastapi import APIRouter
from app.services.cookiecloud import CookieCloudClient

router = APIRouter()


@router.post("/sync")
def sync_cookiecloud(profile: str = "default"):
    client = CookieCloudClient()
    return client.sync(profile)
