import os

class Settings:
    PROJECT_NAME: str = "AEGIS — AI-Driven Telecom Security Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("AEGIS_DATABASE_URL", "sqlite:///./aegis.db")
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    ENVIRONMENT: str = os.getenv("AEGIS_ENV", "Demonstration / Local")

settings = Settings()
