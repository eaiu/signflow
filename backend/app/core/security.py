from fastapi import Depends, Header, HTTPException, Query, status
from app.core.config import get_settings


def require_api_token(
    x_api_token: str | None = Header(default=None, alias="X-API-Token"),
    authorization: str | None = Header(default=None, alias="Authorization"),
    api_token: str | None = Query(default=None, alias="api_token"),
    settings=Depends(get_settings),
):
    expected = settings.api_token
    if not expected:
        return

    token = x_api_token or api_token
    if not token and authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API token",
        )


def require_admin_token(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
    authorization: str | None = Header(default=None, alias="Authorization"),
    admin_token: str | None = Query(default=None, alias="admin_token"),
    settings=Depends(get_settings),
):
    expected = settings.admin_token
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin token not configured",
        )

    token = x_admin_token or admin_token
    if not token and authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

    if token != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
        )
