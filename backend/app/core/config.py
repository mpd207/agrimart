from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./agrimart.db"
    SECRET_KEY: str = "supersecretkey-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    OTP_EXPIRE_SECONDS: int = 300
    PRICE_REFRESH_INTERVAL_SECONDS: int = 30
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"


settings = Settings()
