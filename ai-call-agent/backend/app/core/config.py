"""Typed Application Settings using Pydantic Settings."""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Core Application
    APP_NAME: str = "ai-call-agent-backend"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    DEBUG: bool = False
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"

    # Security & CORS
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "dev-insecure-secret-key-change-in-production-min-32-chars"

    # Database
    DATABASE_URL: str = "postgresql://callagent:callagent_dev_pw@localhost:5432/callagent_db"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # Telephony Integration
    TELEPHONY_PROVIDER: str = Field(default="mock", description="mock | twilio | exotel | sip")
    TELEPHONY_WEBHOOK_SECRET: str = "mock-webhook-secret-dev-only"
    DEFAULT_FORWARD_NUMBER: str = "+919876543210"

    # Voice AI Integration
    VOICE_AI_PROVIDER: str = Field(default="mock", description="mock | openai_realtime | hybrid_local_cloud")
    LLM_PROVIDER: str = Field(default="ollama", description="ollama | openai | mock")
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"
    STT_PROVIDER: str = Field(default="faster_whisper", description="faster_whisper | mock")
    STT_DEVICE: str = Field(default="cpu", description="cpu | cuda")
    WHISPER_MODEL_SIZE: str = "tiny"
    TTS_PROVIDER: str = Field(default="local_tts", description="local_tts | elevenlabs | custom_xtts")
    HYBRID_VOICE_MODE: bool = Field(default=True, description="Enable local LLM/STT with cloud custom voice synthesis")
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_DEFAULT_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    OPENAI_API_KEY: str = "mock-openai-key-future-stage"

    # Spam Engine
    SPAM_ENGINE_PROVIDER: str = Field(default="mock", description="mock | hybrid_rules")
    SPAM_THRESHOLD_BLOCK: int = 70
    SPAM_THRESHOLD_UNCERTAIN: int = 40

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:3000"]


settings = Settings()
