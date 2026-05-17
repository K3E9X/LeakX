"""Collecteurs abuse.ch — flux d'IOC de qualité CERT (malware, C2, URLs).

Quatre flux partagent une même clé d'API (header `Auth-Key`, variable
d'environnement `LEAKX_ABUSECH_KEY`) :
  - ThreatFox      — IOC génériques associés à des malwares ;
  - URLhaus        — URLs distribuant des malwares ;
  - MalwareBazaar  — échantillons de malwares ;
  - Feodo Tracker  — serveurs Command & Control de botnets.

abuse.ch a fait évoluer son API : les endpoints ci-dessous sont à confirmer
dans la documentation du portail abuse.ch. Le parsing reste tolérant aux
variations de structure.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from ..config import settings
from ..models import Source
from ..schemas import NormalizedFinding
from .base import Collector

THREATFOX_URL = "https://threatfox-api.abuse.ch/api/v1/"
URLHAUS_URL = "https://urlhaus-api.abuse.ch/v1/urls/recent/"
MALWAREBAZAAR_URL = "https://mb-api.abuse.ch/api/v1/"
FEODO_URL = "https://feodotracker.abuse.ch/downloads/ipblocklist.json"


def _require_key() -> str:
    if not settings.abusech_key:
        raise ValueError("Clé abuse.ch manquante : définir la variable LEAKX_ABUSECH_KEY.")
    return settings.abusech_key


def _headers() -> dict:
    return {"Auth-Key": _require_key(), "User-Agent": settings.user_agent}


def _parse_date(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    text = value.replace("UTC", "").replace("T", " ").strip().rstrip("Z").strip()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


def _ioc_kind(ioc_type: str) -> str:
    t = (ioc_type or "").lower()
    if "ip" in t:
        return "ip"
    if "domain" in t:
        return "domain"
    if "url" in t:
        return "url"
    if "hash" in t or t in ("md5", "sha1", "sha256"):
        return "hash"
    return "ioc"


# --- ThreatFox -------------------------------------------------------------
THREATFOX_SOURCE = Source(
    id="abusech_threatfox",
    name="abuse.ch ThreatFox",
    category="semi_public",
    trust_tier=2,
    url="https://threatfox.abuse.ch",
    description="IOC associés à des malwares et infrastructures malveillantes (abuse.ch).",
)


class ThreatFoxCollector(Collector):
    source = THREATFOX_SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            response = httpx.post(
                THREATFOX_URL,
                json={"query": "get_iocs", "days": 1},
                headers=_headers(),
                timeout=settings.http_timeout,
            )
            response.raise_for_status()
            payload = response.json()

        rows = payload.get("data", []) if isinstance(payload, dict) else []
        findings: list[NormalizedFinding] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            ioc = str(row.get("ioc") or "").strip()
            if not ioc:
                continue
            malware = row.get("malware_printable") or row.get("malware") or "menace"
            ioc_type = str(row.get("ioc_type") or "ioc")
            confidence = row.get("confidence_level") or 0
            findings.append(
                NormalizedFinding(
                    category="cti",
                    title=f"IOC {malware} — {ioc_type} {ioc}",
                    severity="high" if confidence >= 75 else "med" if confidence >= 50 else "low",
                    entity=ioc,
                    entity_kind=_ioc_kind(ioc_type),
                    source_ref=row.get("reference")
                    or f"https://threatfox.abuse.ch/ioc/{row.get('id', '')}/",
                    published_at=_parse_date(row.get("first_seen")),
                    raw=row,
                )
            )
        return findings


# --- URLhaus ---------------------------------------------------------------
URLHAUS_SOURCE = Source(
    id="abusech_urlhaus",
    name="abuse.ch URLhaus",
    category="semi_public",
    trust_tier=2,
    url="https://urlhaus.abuse.ch",
    description="URLs distribuant des malwares, signalées par la communauté abuse.ch.",
)


class UrlhausCollector(Collector):
    source = URLHAUS_SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            response = httpx.post(URLHAUS_URL, headers=_headers(), timeout=settings.http_timeout)
            response.raise_for_status()
            payload = response.json()

        rows = []
        if isinstance(payload, dict):
            rows = payload.get("urls") or payload.get("data") or []
        findings: list[NormalizedFinding] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            url = str(row.get("url") or "").strip()
            if not url:
                continue
            host = str(row.get("host") or url)
            threat = row.get("threat") or "malware_download"
            findings.append(
                NormalizedFinding(
                    category="cti",
                    title=f"URL malveillante ({threat}) — {host}",
                    severity="med",
                    entity=host,
                    entity_kind="url",
                    source_ref=row.get("urlhaus_reference") or URLHAUS_SOURCE.url,
                    published_at=_parse_date(row.get("date_added")),
                    raw=row,
                )
            )
        return findings


# --- MalwareBazaar ---------------------------------------------------------
MALWAREBAZAAR_SOURCE = Source(
    id="abusech_malwarebazaar",
    name="abuse.ch MalwareBazaar",
    category="semi_public",
    trust_tier=2,
    url="https://bazaar.abuse.ch",
    description="Échantillons de malwares partagés par la communauté abuse.ch.",
)


class MalwareBazaarCollector(Collector):
    source = MALWAREBAZAAR_SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            response = httpx.post(
                MALWAREBAZAAR_URL,
                data={"query": "get_recent", "selector": "time"},
                headers=_headers(),
                timeout=settings.http_timeout,
            )
            response.raise_for_status()
            payload = response.json()

        rows = payload.get("data", []) if isinstance(payload, dict) else []
        findings: list[NormalizedFinding] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            sha256 = str(row.get("sha256_hash") or "").strip()
            if not sha256:
                continue
            signature = row.get("signature") or row.get("file_type") or "échantillon"
            file_name = row.get("file_name") or sha256[:16]
            findings.append(
                NormalizedFinding(
                    category="cti",
                    title=f"Échantillon {signature} — {file_name}",
                    severity="med",
                    entity=sha256,
                    entity_kind="hash",
                    source_ref=f"https://bazaar.abuse.ch/sample/{sha256}/",
                    published_at=_parse_date(row.get("first_seen")),
                    raw=row,
                )
            )
        return findings


# --- Feodo Tracker ---------------------------------------------------------
FEODO_SOURCE = Source(
    id="abusech_feodo",
    name="abuse.ch Feodo Tracker",
    category="semi_public",
    trust_tier=2,
    url="https://feodotracker.abuse.ch",
    description="Serveurs de Command & Control de botnets bancaires (abuse.ch).",
)


class FeodoCollector(Collector):
    source = FEODO_SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            response = httpx.get(FEODO_URL, headers=_headers(), timeout=settings.http_timeout)
            response.raise_for_status()
            payload = response.json()

        if isinstance(payload, list):
            rows = payload
        elif isinstance(payload, dict):
            rows = payload.get("data", [])
        else:
            rows = []
        findings: list[NormalizedFinding] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            ip = str(row.get("ip_address") or "").strip()
            if not ip:
                continue
            malware = row.get("malware") or "botnet"
            port = row.get("port")
            target = f"{ip}:{port}" if port else ip
            findings.append(
                NormalizedFinding(
                    category="cti",
                    title=f"C2 {malware} — {target}",
                    severity="high",
                    entity=ip,
                    entity_kind="ip",
                    source_ref="https://feodotracker.abuse.ch/browse/",
                    published_at=_parse_date(row.get("first_seen")),
                    raw=row,
                )
            )
        return findings
