"""Vérifie la normalisation du collecteur ransomware.live (hors réseau)."""
import json
import pathlib

from app.sources.base import dedup_hash
from app.sources.ransomware_live import RansomwareLiveCollector

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "ransomware_live_sample.json"


def _load() -> list:
    return json.loads(FIXTURE.read_text("utf-8"))


def test_collect_normalizes_fixture() -> None:
    findings = RansomwareLiveCollector().collect(payload=_load())

    assert len(findings) == 2
    first = findings[0]
    assert first.category == "ransom"
    assert first.severity == "high"
    assert first.entity == "exemple-cible.fr"
    assert first.entity_kind == "domain"
    assert first.published_at is not None

    # Domaine vide -> on retombe sur le nom de la victime.
    second = findings[1]
    assert second.entity == "Demo Industries"
    assert second.entity_kind == "company"


def test_every_finding_is_citable() -> None:
    """Règle de marque : aucune observation sans référence de source."""
    findings = RansomwareLiveCollector().collect(payload=_load())
    assert all(f.source_ref.startswith("http") for f in findings)


def test_dedup_hash_is_stable() -> None:
    findings = RansomwareLiveCollector().collect(payload=_load())
    first_pass = [dedup_hash("ransomware_live", f) for f in findings]
    second_pass = [dedup_hash("ransomware_live", f) for f in findings]
    assert first_pass == second_pass
    assert len(set(first_pass)) == 2  # deux observations distinctes
