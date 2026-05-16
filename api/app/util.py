"""Petits utilitaires partagés : identifiants préfixés et horodatage UTC."""
from __future__ import annotations

import secrets
import string
from datetime import datetime, timezone

_ALPHABET = string.ascii_letters + string.digits


def new_id(prefix: str, length: int = 16) -> str:
    """Identifiant préfixé par ressource, ex. `lk_2tQv7nE4mAxC9bRy`."""
    body = "".join(secrets.choice(_ALPHABET) for _ in range(length))
    return f"{prefix}_{body}"


def utcnow() -> datetime:
    """Horodatage UTC naïf, cohérent entre SQLite (dev) et PostgreSQL (prod)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
