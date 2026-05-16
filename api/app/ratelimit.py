"""Limitation de débit par clé API et quota mensuel par organisation.

Deux mécanismes (cf. CLAUDE.md §5) :
  - débit court terme : token bucket en mémoire, par clé API (RPM + burst) ;
  - quota mensuel : compteur persistant en base, par organisation.

Le token bucket en mémoire suffit pour un déploiement mono-processus ; il
faudra passer à Redis le jour où l'API tournera sur plusieurs workers.
"""
from __future__ import annotations

import time
from dataclasses import dataclass

from sqlmodel import Session

from .models import UsageCounter
from .util import utcnow


@dataclass(frozen=True)
class Tier:
    rpm: int | None            # requêtes / minute (None = illimité)
    burst: int | None          # capacité de pointe du bucket
    monthly_quota: int | None  # requêtes / mois (None = illimité)


# Tarification des limites — alignée sur le tableau de CLAUDE.md §5.
TIERS: dict[str, Tier] = {
    "community": Tier(rpm=10, burst=20, monthly_quota=100),
    "pro": Tier(rpm=60, burst=300, monthly_quota=10_000),
    "enterprise": Tier(rpm=None, burst=None, monthly_quota=None),
}


@dataclass
class RpmResult:
    allowed: bool
    remaining: int    # jetons restants (-1 si illimité)
    reset: int        # epoch (s) de fin de fenêtre
    retry_after: int  # s avant un nouveau jeton (si refusé)


@dataclass
class _Bucket:
    tokens: float
    updated: float


_buckets: dict[str, _Bucket] = {}


def consume_token(key_id: str, tier: Tier) -> RpmResult:
    """Consomme un jeton du bucket de la clé. Tier illimité -> toujours permis."""
    if tier.rpm is None or tier.burst is None:
        return RpmResult(allowed=True, remaining=-1, reset=int(time.time()) + 60, retry_after=0)

    now = time.monotonic()
    rate = tier.rpm / 60.0
    bucket = _buckets.get(key_id)
    if bucket is None:
        bucket = _Bucket(tokens=float(tier.burst), updated=now)
        _buckets[key_id] = bucket
    else:
        bucket.tokens = min(float(tier.burst), bucket.tokens + (now - bucket.updated) * rate)
        bucket.updated = now

    window_reset = int(time.time()) + 60
    if bucket.tokens >= 1.0:
        bucket.tokens -= 1.0
        return RpmResult(True, int(bucket.tokens), window_reset, 0)

    retry_after = max(1, int((1.0 - bucket.tokens) / rate) + 1)
    return RpmResult(False, 0, window_reset, retry_after)


def _period() -> str:
    return utcnow().strftime("%Y-%m")


def _usage_id(org_id: str, period: str) -> str:
    return f"{org_id}|{period}"


def current_usage(session: Session, org_id: str) -> int:
    """Nombre de requêtes facturées à l'organisation pour le mois en cours."""
    row = session.get(UsageCounter, _usage_id(org_id, _period()))
    return row.count if row else 0


def increment_usage(session: Session, org_id: str) -> int:
    """Incrémente le compteur mensuel et renvoie la nouvelle valeur."""
    period = _period()
    row = session.get(UsageCounter, _usage_id(org_id, period))
    if row is None:
        row = UsageCounter(id=_usage_id(org_id, period), org_id=org_id, period=period, count=0)
    row.count += 1
    session.add(row)
    session.commit()
    return row.count
