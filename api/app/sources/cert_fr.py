"""Collecteur CERT-FR — avis, alertes et rapports CTI du CERT national français.

Source officielle (ANSSI), `trust_tier` 1 : c'est la source la plus
« officielle » du périmètre LeakX. Flux RSS public du CERT-FR.

L'URL du flux doit être confirmée lors de la première collecte réelle ;
le parsing ci-dessous est tolérant aux variations de structure RSS.
"""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import httpx

from ..config import settings
from ..models import Source
from ..schemas import NormalizedFinding
from .base import Collector

FEED_URL = "https://www.cert.ssi.gouv.fr/feed/"

SOURCE = Source(
    id="cert_fr",
    name="CERT-FR",
    category="officiel",
    trust_tier=1,
    url="https://www.cert.ssi.gouv.fr",
    description=(
        "Centre gouvernemental de veille, d'alerte et de réponse aux attaques "
        "informatiques (ANSSI). Avis de vulnérabilité, alertes et rapports CTI."
    ),
)

_REF_RE = re.compile(r"CERTFR-\d{4}-(AVI|ALE|ACT|CTI|DUR|REC|IOC)-\d+", re.IGNORECASE)

# Type de publication CERT-FR -> (catégorie LeakX, sévérité par défaut).
_TYPE_MAP = {
    "ALE": ("vuln", "high"),  # alerte : menace activement exploitée
    "AVI": ("vuln", "med"),   # avis de vulnérabilité
    "DUR": ("vuln", "low"),   # guide de durcissement
    "REC": ("vuln", "med"),
    "CTI": ("cti", "med"),    # rapport de threat intelligence
    "IOC": ("cti", "med"),
}
# Les bulletins d'actualité (ACT) sont des revues de presse hebdomadaires,
# pas des observations actionnables : on ne les ingère pas.
_SKIP_TYPES = {"ACT"}

_ARTICLES = ("les ", "le ", "la ", "l'", "des ", "du ", "de ", "un ", "une ")


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(timezone.utc).replace(tzinfo=None)
    except (TypeError, ValueError):
        return None


def _extract_entity(title: str, ref: str) -> tuple[str, str]:
    """Best-effort : produit affecté extrait du titre, sinon la référence d'avis."""
    marker = " dans "
    if marker in title:
        product = title.split(marker, 1)[1].strip(" .")
        lowered = product.lower()
        for article in _ARTICLES:
            if lowered.startswith(article):
                product = product[len(article):].strip()
                break
        if product:
            return product, "product"
    return (ref or title), "advisory"


class CertFrCollector(Collector):
    source = SOURCE

    def collect(self, payload: object | None = None) -> list[NormalizedFinding]:
        if payload is None:
            response = httpx.get(
                FEED_URL,
                timeout=settings.http_timeout,
                headers={"User-Agent": settings.user_agent},
            )
            response.raise_for_status()
            payload = response.text

        if not isinstance(payload, str):
            raise ValueError("Réponse CERT-FR inattendue : un flux RSS (texte) est attendu.")

        # Encodage en octets : ET refuse une `str` portant une déclaration d'encodage.
        root = ET.fromstring(payload.encode("utf-8"))

        findings: list[NormalizedFinding] = []
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            if not title or not link:
                continue

            ref_match = _REF_RE.search(link) or _REF_RE.search(title)
            ref = ref_match.group(0).upper() if ref_match else ""
            ref_type = ref_match.group(1).upper() if ref_match else ""
            if ref_type in _SKIP_TYPES:
                continue

            category, severity = _TYPE_MAP.get(ref_type, ("cti", "med"))
            entity, entity_kind = _extract_entity(title, ref)

            findings.append(
                NormalizedFinding(
                    category=category,
                    title=title,
                    severity=severity,
                    entity=entity,
                    entity_kind=entity_kind,
                    source_ref=link,
                    published_at=_parse_date(item.findtext("pubDate")),
                    raw={
                        "ref": ref,
                        "ref_type": ref_type,
                        "title": title,
                        "link": link,
                        "pubDate": item.findtext("pubDate"),
                    },
                )
            )
        return findings
