from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RunBase(BaseModel):
    site_id: int
    status: str = "queued"
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None


class RunCreate(BaseModel):
    site_id: int


class RunUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None


class RunOut(RunBase):
    id: int
    created_at: datetime
