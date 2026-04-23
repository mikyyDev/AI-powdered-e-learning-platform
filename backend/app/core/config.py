import json
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Web Learning Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./learnpath.db"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # Chapa (Ethiopia payments)
    CHAPA_SECRET_KEY: str
    CHAPA_PUBLIC_KEY: str
    CHAPA_BASE_URL: str
    CHAPA_CALLBACK_URL: str
    CHAPA_RETURN_URL: str

    # AI (Groq)
    GROQ_API_KEY: str
    GROQ_BASE_URL: str = "https://api.groq.com"
    GROQ_MODEL: str = "llama-3.1-70b-versatile"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def allowed_origins(self) -> List[str]:
        value = self.ALLOWED_ORIGINS.strip()
        if not value:
            return []

        if value.startswith("["):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError:
                parsed = None

            if isinstance(parsed, list):
                return [origin.strip() for origin in parsed if str(origin).strip()]

        return [origin.strip() for origin in value.split(",") if origin.strip()]


settings = Settings()
