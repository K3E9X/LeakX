"""Vérifie la normalisation du collecteur NVD (hors réseau)."""
import json
import pathlib

from app.sources.nvd import NvdCollector

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "nvd_sample.json"


def _collect() -> list:
    return NvdCollector().collect(payload=json.loads(FIXTURE.read_text("utf-8")))


def test_collect_normalizes_fixture() -> None:
    findings = _collect()
    assert len(findings) == 2

    first = findings[0]
    assert first.category == "vuln"
    assert first.entity == "CVE-2026-20001"
    assert first.entity_kind == "cve"
    assert first.title.startswith("CVE-2026-20001 — ")
    assert first.published_at is not None


def test_severity_follows_cvss_base_score() -> None:
    critical, low = _collect()
    assert critical.severity == "high"  # baseScore 9.8
    assert low.severity == "low"        # baseScore 3.1


def test_every_finding_cites_an_official_reference() -> None:
    findings = _collect()
    assert all(f.source_ref.startswith("https://nvd.nist.gov/vuln/detail/") for f in findings)
