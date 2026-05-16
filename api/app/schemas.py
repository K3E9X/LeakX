"""DTO d'échange : sortie normalisée des collecteurs + corps de requête API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class NormalizedFinding(BaseModel):
    """Ce qu'un collecteur produit, avant rattachement à une source en base."""

    category: str
    title: str
    severity: str = "med"
    status: str = "open"
    entity: str
    entity_kind: str
    source_ref: str  # toujours renseigné : règle « information sourcée, pas de bullshit »
    published_at: Optional[datetime] = None
    first_seen: Optional[datetime] = None
    raw: dict[str, Any] = Field(default_factory=dict)


class SearchRequest(BaseModel):
    """Corps de `POST /v1/search`."""

    type: Optional[str] = None
    value: str


class MonitorCreate(BaseModel):
    """Corps de `POST /v1/monitors`."""

    type: str
    value: str
    # Placeholder tant que l'authentification n'est pas en place.
    org_id: str = "org_dev"
