"""Collecteur CISA KEV — vulnérabilités activement exploitées.

Le catalogue Known Exploited Vulnerabilities de la CISA (agence cyber du
gouvernement américain) recense les failles dont l'exploitation est avérée
« dans la nature ». Source officielle, `trust_tier` 1, publiée en JSON stable.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from ..config import settings
from ..models import Source
from ..schemas import NormalizedFinding
from .base import Collector

KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

SOURCE = Source(
    id="cisa_kev",
    name="CISA KEV",
    category="officiel",
    trust_tier=1,
    url="https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    description=(
        "Catalogue CISA des vulnérabilités dont l'exploitation active est "
        "avérée (Known Exploited Vulnerabilities)."
    ),
)


def _parse_date(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.strptime(value.strip(), "%Y-%m-%d")
    except ValueError:
        return None


class CisaKevCollector(Collector):
    source = SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            response = httpx.get(
                KEV_URL,
                timeout=settings.http_timeout,
                headers={"User-Agent": settings.user_agent},
            )
            response.raise_for_status()
            payload = response.json()

        if not isinstance(payload, dict):
            raise ValueError("Réponse CISA KEV inattendue : objet JSON attendu.")

        findings: list[NormalizedFinding] = []
        for item in payload.get("vulnerabilities", []):
            if not isinstance(item, dict):
                continue
            cve = str(item.get("cveID") or "").strip()
            if not cve:
                continue
            name = item.get("vulnerabilityName") or "Vulnérabilité activement exploitée"
            vendor = str(item.get("vendorProject") or "").strip()
            product = str(item.get("product") or "").strip()
            entity = " ".join(part for part in (vendor, product) if part) or cve
            ransomware = str(item.get("knownRansomwareCampaignUse") or "").strip().lower()

            findings.append(
                NormalizedFinding(
                    category="vuln",
                    title=f"{cve} — {name}",
                    # Toute entrée KEV est exploitée ; l'usage ransomware avéré
                    # fait monter la sévérité au plus haut.
                    severity="high" if ransomware == "known" else "med",
                    entity=entity,
                    entity_kind="product",
                    source_ref=f"https://nvd.nist.gov/vuln/detail/{cve}",
                    published_at=_parse_date(item.get("dateAdded")),
                    raw=item,
                )
            )
        return findings
