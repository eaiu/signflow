from fastapi import APIRouter, Depends

from app.core.security import require_admin_token
from app.services.notifications import service

router = APIRouter()


@router.get("/", dependencies=[Depends(require_admin_token)])
def list_notifications():
    return service.drain()
