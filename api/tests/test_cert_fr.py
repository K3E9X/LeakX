"""Vérifie la normalisation du collecteur CERT-FR (hors réseau)."""
import pathlib

from app.sources.cert_fr import CertFrCollector

FIXTURE = pathlib.Path(__file__).parent / "fixtures" / "cert_fr_sample.xml"


def _collect() -> list:
    return CertFrCollector().collect(payload=FIXTURE.read_text("utf-8"))


def test_skips_actualite_bulletins() -> None:
    """Les bulletins d'actualité (ACT) ne sont pas des observations actionnables."""
    findings = _collect()
    assert len(findings) == 2
    assert all(f.raw["ref_type"] != "ACT" for f in findings)


def test_avis_and_alerte_mapping() -> None:
    avis, alerte = _collect()

    assert avis.category == "vuln"
    assert avis.severity == "med"
    assert avis.entity == "Google Chrome"
    assert avis.entity_kind == "product"
    assert avis.published_at is not None

    # Une alerte = menace activement exploitée -> sévérité haute.
    assert alerte.severity == "high"
    assert alerte.entity == "Microsoft Exchange Server"


def test_every_finding_is_citable() -> None:
    """Règle de marque : aucune observation sans référence de source."""
    findings = _collect()
    assert all(f.source_ref.startswith("https://www.cert.ssi.gouv.fr") for f in findings)
