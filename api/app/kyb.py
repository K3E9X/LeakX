"""Vérification KYB d'un domaine via enregistrement DNS TXT.

KYB = Know Your Business. C'est le garde-fou qui empêche LeakX de devenir un
outil de doxxing : un client ne peut surveiller un domaine que s'il prouve
qu'il le contrôle, en publiant un enregistrement TXT dédié (cf. CLAUDE.md §5).
"""
from __future__ import annotations

import secrets
from collections.abc import Callable

from .config import settings

TXT_PREFIX = "leakx-verification="

# Résolveurs DNS publics interrogés en parallèle : on exige qu'un quorum voie
# l'enregistrement, pour ne pas dépendre d'un résolveur isolé ou empoisonné.
DEFAULT_RESOLVERS = ("1.1.1.1", "9.9.9.9", "8.8.8.8")

# Signature : (domaine, ip_du_résolveur) -> liste des valeurs TXT trouvées.
TxtLookup = Callable[[str, str], list[str]]


def new_verification_token() -> str:
    """Jeton aléatoire à publier dans la zone DNS du domaine à vérifier."""
    return secrets.token_hex(16)


def expected_txt_record(token: str) -> str:
    """Valeur TXT complète attendue dans la zone DNS."""
    return f"{TXT_PREFIX}{token}"


def _resolve_txt(domain: str, resolver_ip: str) -> list[str]:
    """Récupère les enregistrements TXT d'un domaine via un résolveur donné."""
    import dns.resolver  # import paresseux : utile seulement à l'exécution réelle

    resolver = dns.resolver.Resolver(configure=False)
    resolver.nameservers = [resolver_ip]
    resolver.lifetime = settings.http_timeout
    try:
        answers = resolver.resolve(domain, "TXT")
    except Exception:
        return []  # NXDOMAIN, timeout, absence de TXT -> simplement "non vu"
    values: list[str] = []
    for record in answers:
        # Une valeur TXT peut être découpée en plusieurs segments.
        values.append(
            "".join(
                part.decode() if isinstance(part, bytes) else str(part)
                for part in record.strings
            )
        )
    return values


def verify_domain(domain: str, token: str, lookup: TxtLookup | None = None) -> bool:
    """Vrai si l'enregistrement TXT attendu est vu par assez de résolveurs.

    `lookup` est injectable pour les tests (et l'exécution hors-ligne).
    """
    resolve = lookup or _resolve_txt
    expected = expected_txt_record(token)
    seen = sum(
        1
        for resolver_ip in DEFAULT_RESOLVERS
        if any(expected in record for record in resolve(domain, resolver_ip))
    )
    return seen >= settings.kyb_min_resolvers


def is_in_scope(monitors: list, search_type: str, value: str) -> bool:
    """Vrai si `value` relève du périmètre vérifié de l'organisation.

    `monitors` est la liste des monitors de l'organisation. Une recherche n'est
    autorisée que sur une entité couverte par un monitor actif (ou un
    sous-domaine d'un domaine vérifié) — cf. `403 outside_scope`, CLAUDE.md §5.
    """
    value = value.strip().lower()
    active = [m for m in monitors if m.status == "active"]
    verified_domains = {m.value for m in active if m.type == "domain"}

    if any(m.value == value for m in active):
        return True
    if any(value == d or value.endswith("." + d) for d in verified_domains):
        return True
    if "@" in value and value.rsplit("@", 1)[-1] in verified_domains:
        return True
    return False
