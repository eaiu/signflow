from datetime import datetime
from pydantic import BaseModel


class LogBase(BaseModel):
    run_id: int | None = None
    level: str = "info"
    message: str


class LogCreate(LogBase):
    pass


class LogOut(LogBase):
    id: int
    created_at: datetime
