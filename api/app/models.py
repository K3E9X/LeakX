"""Modèle de données « provenance-first ».

Règle de marque LeakX : aucune observation n'est stockée sans source citable.
`source_id` et `source_ref` sont donc obligatoires sur chaque `Leak`.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from .config import settings
from .util import new_id, utcnow

# Catégories de confiance d'une source.
SOURCE_CATEGORIES = ("officiel", "semi_public", "partenaire", "communautaire")


def _default_expiry() -> datetime:
    return utcnow() + timedelta(days=settings.retention_days)


class Source(SQLModel, table=True):
    """Une source de renseignement. Le registre est public (cf. `GET /v1/sources`)."""

    id: str = Field(primary_key=True)  # slug stable, ex. "ransomware_live"
    name: str
    category: str = "semi_public"  # cf. SOURCE_CATEGORIES
    trust_tier: int = 2  # 1 = officiel (CERT/gov), 2 = semi-public, 3 = communautaire
    url: str
    description: str = ""
    updated_at: datetime = Field(default_factory=utcnow)


class Leak(SQLModel, table=True):
    """Une observation rattachée à une entité surveillée et à une source."""

    id: str = Field(default_factory=lambda: new_id("lk"), primary_key=True)

    category: str  # ransom | stealer | dark | combo | paste | brand | telegram | vuln | cti
    title: str
    severity: str = "med"  # high | med | low
    status: str = "open"  # open | progress | resolved
    entity: str
    entity_kind: str  # domain | email | person | brand | ip | repo | company

    # --- Provenance (obligatoire) ---
    source_id: str = Field(foreign_key="source.id", index=True)
    source_ref: str  # URL / identifiant de bulletin citable

    # --- Horodatage & rétention ---
    published_at: Optional[datetime] = None  # date de publication côté source
    first_seen: Optional[datetime] = None
    collected_at: datetime = Field(default_factory=utcnow, index=True)
    expires_at: datetime = Field(default_factory=_default_expiry, index=True)

    # Empreinte d'idempotence : évite les doublons sur collectes répétées.
    dedup_hash: str = Field(index=True)

    raw: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class Monitor(SQLModel, table=True):
    """Une entité du périmètre de surveillance d'une organisation.

    KYB (cf. CLAUDE.md §5) : un monitor `domain` n'est actif qu'après
    vérification DNS TXT ; un monitor `email` doit relever d'un domaine déjà
    vérifié ; les autres types passent par une validation manuelle.
    """

    id: str = Field(default_factory=lambda: new_id("mon"), primary_key=True)
    org_id: str = Field(index=True)  # renseigné par l'authentification (à venir)
    type: str  # domain | email | ip | vip | brand | repo
    value: str
    status: str = "verifying"  # verifying | active | paused
    verification_method: Optional[str] = None  # dns_txt | domain_inherited | manual
    verification_token: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=utcnow, index=True)


class Org(SQLModel, table=True):
    """Une organisation cliente. Tout monitor et toute clé API lui sont rattachés."""

    id: str = Field(default_factory=lambda: new_id("org"), primary_key=True)
    name: str
    plan: str = "community"  # community | pro | enterprise
    created_at: datetime = Field(default_factory=utcnow)


class ApiKey(SQLModel, table=True):
    """Clé API d'une organisation. Le secret n'est jamais stocké en clair."""

    id: str = Field(default_factory=lambda: new_id("key"), primary_key=True)
    org_id: str = Field(foreign_key="org.id", index=True)
    public_id: str = Field(index=True, unique=True)  # partie non secrète de la clé
    type: str  # live | test | readonly
    secret_hash: str  # Argon2id — jamais en clair après création
    label: str = ""
    created_at: datetime = Field(default_factory=utcnow)
    last_used_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None


class UsageCounter(SQLModel, table=True):
    """Compteur de requêtes par organisation et par mois (quota mensuel)."""

    id: str = Field(primary_key=True)  # "{org_id}|{YYYY-MM}"
    org_id: str = Field(index=True)
    period: str  # "YYYY-MM"
    count: int = 0
