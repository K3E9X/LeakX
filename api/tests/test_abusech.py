"""Vérifie la normalisation des 4 collecteurs abuse.ch (hors réseau)."""
import json
import pathlib

from app.sources.abusech import (
    FeodoCollector,
    MalwareBazaarCollector,
    ThreatFoxCollector,
    UrlhausCollector,
)

FIXTURES = pathlib.Path(__file__).parent / "fixtures"


def _load(name: str) -> object:
    return json.loads((FIXTURES / name).read_text("utf-8"))


def test_threatfox_normalizes_and_scores_by_confidence() -> None:
    findings = ThreatFoxCollector().collect(payload=_load("abusech_threatfox_sample.json"))
    assert len(findings) == 2
    high, low = findings
    assert high.category == "cti"
    assert high.entity == "198.51.100.30:443"
    assert high.entity_kind == "ip"
    assert high.severity == "high"  # confidence 90
    assert low.severity == "low"    # confidence 40
    assert low.entity_kind == "domain"


def test_urlhaus_normalizes_fixture() -> None:
    findings = UrlhausCollector().collect(payload=_load("abusech_urlhaus_sample.json"))
    assert len(findings) == 1
    assert findings[0].entity == "exemple-malveillant.test"
    assert findings[0].source_ref.startswith("https://urlhaus.abuse.ch/")


def test_malwarebazaar_normalizes_fixture() -> None:
    findings = MalwareBazaarCollector().collect(
        payload=_load("abusech_malwarebazaar_sample.json")
    )
    assert len(findings) == 1
    assert findings[0].entity_kind == "hash"
    assert "Lumma" in findings[0].title


def test_feodo_normalizes_c2_list() -> None:
    findings = FeodoCollector().collect(payload=_load("abusech_feodo_sample.json"))
    assert len(findings) == 1
    assert findings[0].entity == "203.0.113.55"
    assert findings[0].entity_kind == "ip"
    assert findings[0].severity == "high"


def test_every_abusech_finding_is_citable() -> None:
    for collector, fixture in (
        (ThreatFoxCollector(), "abusech_threatfox_sample.json"),
        (UrlhausCollector(), "abusech_urlhaus_sample.json"),
        (MalwareBazaarCollector(), "abusech_malwarebazaar_sample.json"),
        (FeodoCollector(), "abusech_feodo_sample.json"),
    ):
        findings = collector.collect(payload=_load(fixture))
        assert findings and all(f.source_ref.startswith("http") for f in findings)
