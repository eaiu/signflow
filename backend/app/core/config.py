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
    cookiecloud_password: str = ""
    scheduler_enabled: bool = True

    class Config:
        frozen = True

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
            "cookiecloud_password": mask(self.cookiecloud_password),
            "scheduler_enabled": self.scheduler_enabled,
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
        cookiecloud_password=os.getenv("COOKIECLOUD_PASSWORD", ""),
        scheduler_enabled=os.getenv("SCHEDULER_ENABLED", "true").lower() != "false",
    )
