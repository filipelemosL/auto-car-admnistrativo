from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_prefix="AUTOCAR_",
    )

    app_name: str = "AutoCar Admin API"
    environment: str = "development"
    debug: bool = True
    api_prefix: str = "/api"
    use_mock_data: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    supabase_url: str | None = None
    supabase_key: str | None = None
    supabase_storage_bucket: str = "service-images"
    keepalive_enabled: bool = True
    keepalive_interval_days: int = 5
    keepalive_table: str = "clients"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)

    @property
    def database_mode(self) -> str:
        return "mock" if self.use_mock_data or not self.supabase_configured else "supabase"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
