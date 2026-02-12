from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class JobOut(BaseModel):
    id: str
    name: str
    next_run_time: Optional[datetime] = None


class JobRunRequest(BaseModel):
    site_id: int
    cron: Optional[str] = None


class JobRunResponse(BaseModel):
    ok: bool
    run_id: int
    status: str
