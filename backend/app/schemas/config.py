from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ConfigResponse(BaseModel):
    project_name: str
    api_v1_prefix: str
    environment: str
    database_url: str
    cookiecloud_url: str
    cookiecloud_key: str
    cookiecloud_password: str
    cookiecloud_timeout: int
    cookiecloud_verify_ssl: bool
    cookiecloud_send_json: bool
    scheduler_enabled: bool
    api_token: str
    plugin_paths: str
    admin_token: str
    plugins: List[Dict[str, Any]]
    ui_settings: Dict[str, Any]


class ConfigUpdate(BaseModel):
    theme: Optional[str] = None
    timezone: Optional[str] = None
    notifications: Optional[Dict[str, Any]] = None


class ConfigUpdateResponse(BaseModel):
    ok: bool
    settings: Dict[str, Any]
