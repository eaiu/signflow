from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Site(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    url: str
    enabled: bool = True
    cookie_domain: Optional[str] = None
    cookiecloud_uuid: Optional[str] = None
    plugin_key: Optional[str] = None
    plugin_config: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Run(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    site_id: int = Field(foreign_key="site.id")
    status: str = "queued"
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    plugin_key: Optional[str] = None
    plugin_config: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LogEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: Optional[int] = Field(default=None, foreign_key="run.id")
    level: str = "info"
    message: str
    event: Optional[str] = None
    payload: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})
    created_at: datetime = Field(default_factory=datetime.utcnow)
