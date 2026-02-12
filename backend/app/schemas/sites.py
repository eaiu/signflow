from datetime import datetime
from typing import Optional
from pydantic import BaseModel, AnyHttpUrl


class SiteBase(BaseModel):
    name: str
    url: AnyHttpUrl
    enabled: bool = True
    cookie_domain: Optional[str] = None
    cookiecloud_profile: Optional[str] = None
    plugin_key: Optional[str] = None
    notes: Optional[str] = None


class SiteCreate(SiteBase):
    pass


class SiteUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[AnyHttpUrl] = None
    enabled: Optional[bool] = None
    cookie_domain: Optional[str] = None
    cookiecloud_profile: Optional[str] = None
    plugin_key: Optional[str] = None
    notes: Optional[str] = None


class SiteOut(SiteBase):
    id: int
    created_at: datetime
    updated_at: datetime
