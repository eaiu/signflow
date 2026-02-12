from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class RunBase(BaseModel):
    site_id: int
    status: str = "queued"
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    plugin_key: Optional[str] = None
    plugin_config: Optional[Dict[str, Any]] = None


class RunCreate(BaseModel):
    site_id: int
    plugin_key: Optional[str] = None
    plugin_config: Optional[Dict[str, Any]] = None


class RunUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    plugin_key: Optional[str] = None
    plugin_config: Optional[Dict[str, Any]] = None


class RunOut(RunBase):
    id: int
    created_at: datetime
