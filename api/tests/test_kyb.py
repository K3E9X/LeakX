"""Vérifie la logique KYB de vérification de domaine par DNS TXT (hors réseau)."""
from app.kyb import expected_txt_record, new_verification_token, verify_domain


def test_token_and_record_format() -> None:
    token = new_verification_token()
    assert len(token) == 32  # secrets.token_hex(16)
    assert expected_txt_record(token) == f"leakx-verification={token}"


def test_verify_succeeds_when_quorum_sees_token() -> None:
    token = "abc123"
    record = expected_txt_record(token)
    # Tous les résolveurs voient le bon enregistrement, parmi d'autres TXT.
    lookup = lambda domain, resolver: [record, "v=spf1 -all"]  # noqa: E731
    assert verify_domain("client.fr", token, lookup=lookup) is True


def test_verify_fails_without_record() -> None:
    lookup = lambda domain, resolver: ["v=spf1 -all"]  # noqa: E731
    assert verify_domain("client.fr", "abc123", lookup=lookup) is False


def test_verify_fails_below_quorum() -> None:
    """Un seul résolveur voit le jeton : sous le quorum (2) -> échec."""
    token = "abc123"
    record = expected_txt_record(token)

    def lookup(domain: str, resolver: str) -> list[str]:
        return [record] if resolver == "1.1.1.1" else []

    assert verify_domain("client.fr", token, lookup=lookup) is False


def test_verify_rejects_wrong_token() -> None:
    """Un enregistrement LeakX existe mais porte un autre jeton -> échec."""
    lookup = lambda domain, resolver: [expected_txt_record("autre_jeton")]  # noqa: E731
    assert verify_domain("client.fr", "abc123", lookup=lookup) is False
