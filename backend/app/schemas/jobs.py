from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class JobOut(BaseModel):
    id: str
    name: str
    next_run_time: Optional[datetime] = None
