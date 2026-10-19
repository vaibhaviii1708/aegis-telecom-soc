import os

class Settings:
    PROJECT_NAME: str = "AEGIS — AI-Driven Telecom Security Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("AEGIS_DATABASE_URL", "sqlite:///./aegis.db")
    
    # Comma-separated allowed origins from environment
    env_origins = os.getenv("ALLOWED_ORIGINS", "")
    CORS_ORIGINS: list = [o.strip() for o in env_origins.split(",") if o.strip()] if env_origins else [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    ENVIRONMENT: str = os.getenv("AEGIS_ENV", "Demonstration / Local")

settings = Settings()
