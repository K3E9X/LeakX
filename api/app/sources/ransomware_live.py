"""Collecteur ransomware.live — revendications publiques de victimes ransomware.

Source semi-publique : ce sont les groupes ransomware eux-mêmes qui publient
leurs victimes sur leurs leak sites ; ransomware.live ne fait que les agréger.
Chaque observation reste donc citable et vérifiable.

API v2 documentée sur https://www.ransomware.live/api — le mapping des champs
ci-dessous est tolérant aux variations et doit être confirmé lors de la
première collecte réelle.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from ..config import settings
from ..models import Source
from ..schemas import NormalizedFinding
from .base import Collector

API_URL = "https://api.ransomware.live/v2/recentvictims"

SOURCE = Source(
    id="ransomware_live",
    name="ransomware.live",
    category="semi_public",
    trust_tier=2,
    url="https://www.ransomware.live",
    description=(
        "Agrégateur public des revendications de victimes publiées sur les "
        "leak sites des groupes ransomware (LockBit, Akira, etc.)."
    ),
)


def _parse_date(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip().replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text).replace(tzinfo=None)
    except ValueError:
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


class RansomwareLiveCollector(Collector):
    source = SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            response = httpx.get(
                API_URL,
                timeout=settings.http_timeout,
                headers={"User-Agent": settings.user_agent},
            )
            response.raise_for_status()
            payload = response.json()

        if not isinstance(payload, list):
            raise ValueError("Réponse ransomware.live inattendue : une liste est attendue.")

        findings: list[NormalizedFinding] = []
        for item in payload:
            if not isinstance(item, dict):
                continue
            victim = item.get("victim") or item.get("post_title") or "victime inconnue"
            group = item.get("group") or item.get("group_name") or "groupe inconnu"
            domain = str(item.get("domain") or "").strip().lower()
            claim_url = (
                item.get("claim_url")
                or item.get("url")
                or item.get("screenshot")
                or SOURCE.url
            )
            published = _parse_date(
                item.get("discovered")
                or item.get("attackdate")
                or item.get("published")
            )
            findings.append(
                NormalizedFinding(
                    category="ransom",
                    title=f"Revendication {group} — victime « {victim} »",
                    severity="high",
                    entity=domain or str(victim),
                    entity_kind="domain" if domain else "company",
                    source_ref=str(claim_url),
                    published_at=published,
                    raw=item,
                )
            )
        return findings
