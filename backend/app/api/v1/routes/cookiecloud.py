from fastapi import APIRouter

from app.services.cookiecloud_sync import CookieCloudSyncService

router = APIRouter()


@router.get("/status")
def cookiecloud_status():
    service = CookieCloudSyncService()
    return service.status()


@router.post("/sync")
def sync_cookiecloud(uuid: str | None = None):
    service = CookieCloudSyncService()
    return service.sync(uuid)
