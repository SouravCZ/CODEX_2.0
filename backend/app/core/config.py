from pathlib import Path

from pydantic_settings import BaseSettings
from functools import lru_cache

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    APP_NAME: str = "AI Emotional Drift Journal"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/emotion_journal"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production-use-a-real-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Hugging Face Inference API (free tier) — replaces local DeepFace + transformers
    HF_API_KEY: str = ""
    HF_FACE_MODEL: str = "trpakov/vit-face-expression"
    HF_SENTIMENT_MODEL: str = "distilbert-base-uncased-finetuned-sst-2-english"
    HF_BASE_URL: str = "https://api-inference.huggingface.co"
    HF_TIMEOUT_S: int = 30

    # Local journal sentiment model (transformers pipeline in journal_analyzer)
    JOURNAL_MODEL: str = "distilbert/distilbert-base-uncased-finetuned-sst-2-english"

    # AI Narrative (OpenAI-compatible — OpenRouter by default)
    AI_API_KEY: str = ""
    AI_BASE_URL: str = "https://openrouter.ai/api/v1"
    AI_MODEL: str = "nvidia/nemotron-3-nano-30b-a3b:free"
    AI_TIMEOUT_S: int = 60

    class Config:
        env_file = str(ENV_FILE)
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
