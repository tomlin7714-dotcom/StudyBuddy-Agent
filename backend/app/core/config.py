from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import json


class Settings(BaseSettings):
    # DeepSeek
    deepseek_api_key: str = Field(..., env="DEEPSEEK_API_KEY")
    deepseek_api_base: str = Field("https://api.deepseek.com/v1", env="DEEPSEEK_API_BASE")
    deepseek_model: str = Field("deepseek-chat", env="DEEPSEEK_MODEL")

    # Embedding
    embedding_model: str = Field(
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        env="EMBEDDING_MODEL"
    )
    embedding_provider: str = Field("local", env="EMBEDDING_PROVIDER")

    # ChromaDB
    chroma_persist_dir: str = Field("./data/chroma", env="CHROMA_PERSIST_DIR")
    chroma_collection_name: str = Field("sb", env="CHROMA_COLLECTION_NAME")

    # Database
    database_url: str = Field("sqlite+aiosqlite:///./data/study_buddy.db", env="DATABASE_URL")

    # API
    api_host: str = Field("0.0.0.0", env="API_HOST")
    api_port: int = Field(8000, env="API_PORT")
    api_reload: bool = Field(True, env="API_RELOAD")

    # CORS
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        env="CORS_ORIGINS"
    )

    # Upload
    upload_dir: str = Field("./data/uploads", env="UPLOAD_DIR")
    max_upload_size: int = Field(10485760, env="MAX_UPLOAD_SIZE")

    # Hugging Face
    hf_hub_offline: bool = Field(True, env="HF_HUB_OFFLINE")

    # Auth
    jwt_secret: str = Field("study-buddy-secret-change-me", env="JWT_SECRET")

    # Logging
    log_level: str = Field("INFO", env="LOG_LEVEL")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def model_post_init(self, __context):
        import os
        os.makedirs(self.chroma_persist_dir, exist_ok=True)
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs("./data", exist_ok=True)
        if self.hf_hub_offline:
            os.environ["HF_HUB_OFFLINE"] = "1"


@lru_cache
def get_settings() -> Settings:
    return Settings()
