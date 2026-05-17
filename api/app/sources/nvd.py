"""Collecteur NVD — référentiel des vulnérabilités du NIST.

La National Vulnerability Database (NIST) est le référentiel officiel des CVE.
Le collecteur récupère les CVE récemment modifiées (fenêtre glissante).
Source officielle, `trust_tier` 1. API 2.0, sans clé requise à faible débit.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

import httpx

from ..config import settings
from ..models import Source
from ..schemas import NormalizedFinding
from ..util import utcnow
from .base import Collector

API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
WINDOW_DAYS = 7

SOURCE = Source(
    id="nvd",
    name="NVD (NIST)",
    category="officiel",
    trust_tier=1,
    url="https://nvd.nist.gov",
    description=(
        "National Vulnerability Database du NIST — référentiel officiel des "
        "vulnérabilités (CVE) et de leur scoring CVSS."
    ),
)


def _parse_date(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.strip().rstrip("Z")
    for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _severity(metrics: dict) -> str:
    """Sévérité LeakX dérivée du score CVSS (toutes versions confondues)."""
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        entries = metrics.get(key) or []
        if entries:
            score = entries[0].get("cvssData", {}).get("baseScore")
            if isinstance(score, (int, float)):
                if score >= 7.0:
                    return "high"
                if score >= 4.0:
                    return "med"
                return "low"
    return "med"


def _english_description(descriptions: list) -> str:
    for entry in descriptions:
        if isinstance(entry, dict) and entry.get("lang") == "en":
            return str(entry.get("value") or "").strip()
    return ""


class NvdCollector(Collector):
    source = SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            end = utcnow()
            start = end - timedelta(days=WINDOW_DAYS)
            response = httpx.get(
                API_URL,
                params={
                    "lastModStartDate": start.strftime("%Y-%m-%dT%H:%M:%S.000"),
                    "lastModEndDate": end.strftime("%Y-%m-%dT%H:%M:%S.000"),
                },
                timeout=settings.http_timeout,
                headers={"User-Agent": settings.user_agent},
            )
            response.raise_for_status()
            payload = response.json()

        if not isinstance(payload, dict):
            raise ValueError("Réponse NVD inattendue : objet JSON attendu.")

        findings: list[NormalizedFinding] = []
        for item in payload.get("vulnerabilities", []):
            cve = item.get("cve") if isinstance(item, dict) else None
            if not isinstance(cve, dict):
                continue
            cve_id = str(cve.get("id") or "").strip()
            if not cve_id:
                continue
            description = _english_description(cve.get("descriptions") or [])
            summary = description[:140] + "…" if len(description) > 140 else description
            findings.append(
                NormalizedFinding(
                    category="vuln",
                    title=f"{cve_id} — {summary}" if summary else cve_id,
                    severity=_severity(cve.get("metrics") or {}),
                    entity=cve_id,
                    entity_kind="cve",
                    source_ref=f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                    published_at=_parse_date(cve.get("published")),
                    raw=cve,
                )
            )
        return findings
