"""Configuration de l'API LeakX (surcharge via variables d'env `LEAKX_*`)."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="LEAKX_", env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./leakx.db"
    # Rétention RGPD : tout enregistrement est purgé après ce délai (cf. CLAUDE.md §5).
    retention_days: int = 30
    http_timeout: float = 20.0
    user_agent: str = "LeakX-collector/0.1 (+https://leakx.fr)"
    # KYB : nombre de résolveurs DNS devant voir l'enregistrement de vérification.
    kyb_min_resolvers: int = 2


settings = Settings()
