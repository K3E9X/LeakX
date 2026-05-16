"""Vérifie la normalisation du collecteur CISA KEV (hors réseau)."""
import json
import pathlib

from app.sources.cisa_kev import CisaKevCollector

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "cisa_kev_sample.json"


def _collect() -> list:
    return CisaKevCollector().collect(payload=json.loads(FIXTURE.read_text("utf-8")))


def test_collect_normalizes_fixture() -> None:
    findings = _collect()
    assert len(findings) == 2

    first = findings[0]
    assert first.category == "vuln"
    assert first.entity == "Exemple AppServer"
    assert first.entity_kind == "product"
    assert first.title.startswith("CVE-2026-10001")
    assert first.published_at is not None


def test_ransomware_linked_entry_is_high_severity() -> None:
    high, medium = _collect()
    assert high.severity == "high"  # knownRansomwareCampaignUse = Known
    assert medium.severity == "med"


def test_every_finding_cites_an_official_reference() -> None:
    findings = _collect()
    assert all(f.source_ref.startswith("https://nvd.nist.gov/vuln/detail/") for f in findings)
