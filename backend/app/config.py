from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Explainable Synthetic Media Analysis API'
    debug: bool = False
    model_path: str = 'artifacts/best_model.pth'
    class_names_path: str = 'artifacts/class_names.json'
    model_config_path: str = 'artifacts/model_config.json'
    upload_dir: str = 'uploads'
    max_video_frames: int = 16


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
