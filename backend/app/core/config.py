"""Application configuration."""
from functools import lru_cache
from pydantic import BaseModel
import os


class Settings(BaseModel):
    project_name: str = "SignFlow"
    api_v1_prefix: str = "/api/v1"
    environment: str = "local"
    database_url: str = "sqlite:///./data/signflow.db"
    cookiecloud_url: str = ""
    cookiecloud_key: str = ""
    cookiecloud_uuid: str = ""
    cookiecloud_password: str = ""
    cookiecloud_timeout: int = 8
    cookiecloud_verify_ssl: bool = True
    cookiecloud_send_json: bool = True
    scheduler_enabled: bool = True
    api_token: str = ""
    plugin_paths: str = "app.plugins"
    admin_token: str = ""

    class Config:
        frozen = True

    def get_cookiecloud_uuid(self) -> str | None:
        return self.cookiecloud_uuid or self.cookiecloud_key

    @property
    def masked(self) -> dict:
        def mask(value: str) -> str:
            if not value:
                return ""
            if len(value) <= 4:
                return "*" * len(value)
            return f"{value[:2]}***{value[-2:]}"

        return {
            "project_name": self.project_name,
            "api_v1_prefix": self.api_v1_prefix,
            "environment": self.environment,
            "database_url": self.database_url,
            "cookiecloud_url": self.cookiecloud_url,
            "cookiecloud_key": mask(self.cookiecloud_key),
            "cookiecloud_uuid": mask(self.cookiecloud_uuid),
            "cookiecloud_password": mask(self.cookiecloud_password),
            "cookiecloud_timeout": self.cookiecloud_timeout,
            "cookiecloud_verify_ssl": self.cookiecloud_verify_ssl,
            "cookiecloud_send_json": self.cookiecloud_send_json,
            "scheduler_enabled": self.scheduler_enabled,
            "api_token": mask(self.api_token),
            "plugin_paths": self.plugin_paths,
            "admin_token": mask(self.admin_token),
        }


@lru_cache
def get_settings() -> Settings:
    return Settings(
        project_name=os.getenv("PROJECT_NAME", "SignFlow"),
        api_v1_prefix=os.getenv("API_V1_PREFIX", "/api/v1"),
        environment=os.getenv("ENVIRONMENT", "local"),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./data/signflow.db"),
        cookiecloud_url=os.getenv("COOKIECLOUD_URL", ""),
        cookiecloud_key=os.getenv("COOKIECLOUD_KEY", ""),
        cookiecloud_uuid=os.getenv("COOKIECLOUD_UUID", ""),
        cookiecloud_password=os.getenv("COOKIECLOUD_PASSWORD", ""),
        cookiecloud_timeout=int(os.getenv("COOKIECLOUD_TIMEOUT", "8")),
        cookiecloud_verify_ssl=os.getenv("COOKIECLOUD_VERIFY_SSL", "true").lower() != "false",
        cookiecloud_send_json=os.getenv("COOKIECLOUD_SEND_JSON", "true").lower() != "false",
        scheduler_enabled=os.getenv("SCHEDULER_ENABLED", "true").lower() != "false",
        api_token=os.getenv("API_TOKEN", ""),
        plugin_paths=os.getenv("PLUGIN_PATHS", "app.plugins"),
        admin_token=os.getenv("ADMIN_TOKEN", ""),
    )
