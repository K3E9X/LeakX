"""Vérifie la génération/validation des clés API et le contrôle de périmètre."""
from app.auth import generate_api_key, hash_secret, parse_token, verify_secret
from app.kyb import is_in_scope
from app.models import Monitor


def test_generate_and_parse_roundtrip() -> None:
    token, public_id, secret = generate_api_key("live")
    assert token.startswith("lkx_live_")
    assert parse_token(token) == ("live", public_id, secret)


def test_parse_rejects_malformed_tokens() -> None:
    assert parse_token("nope") is None
    assert parse_token("lkx_unknown_abcdef") is None
    assert parse_token("lkx_live_") is None


def test_secret_hash_is_argon2_and_verifiable() -> None:
    _, _, secret = generate_api_key("readonly")
    hashed = hash_secret(secret)
    assert hashed.startswith("$argon2")  # jamais le secret en clair
    assert verify_secret(secret, hashed) is True
    assert verify_secret("mauvais-secret", hashed) is False


def test_scope_allows_verified_domain_and_subdomain() -> None:
    monitors = [Monitor(org_id="o", type="domain", value="client.fr", status="active")]
    assert is_in_scope(monitors, "domain", "client.fr") is True
    assert is_in_scope(monitors, "domain", "mail.client.fr") is True
    assert is_in_scope(monitors, "email", "rssi@client.fr") is True


def test_scope_rejects_entity_outside_perimeter() -> None:
    monitors = [Monitor(org_id="o", type="domain", value="client.fr", status="active")]
    assert is_in_scope(monitors, "domain", "autre-societe.fr") is False


def test_scope_ignores_unverified_monitor() -> None:
    """Un domaine non encore vérifié ne donne aucun droit de recherche."""
    monitors = [Monitor(org_id="o", type="domain", value="client.fr", status="verifying")]
    assert is_in_scope(monitors, "domain", "client.fr") is False
