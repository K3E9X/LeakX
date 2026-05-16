"""Authentification par clé API (Bearer token).

Format de clé : lkx_<type>_<public_id><secret>
  - type      : live | test | readonly
  - public_id : identifiant non secret, indexé en base pour une recherche O(1)
  - secret    : partie secrète, stockée hachée en Argon2id (jamais en clair)

Le public_id permet de retrouver la ligne sans déhacher ; on vérifie ensuite
le secret avec Argon2id. La clé complète n'est montrée qu'à la création.
"""
from __future__ import annotations

import secrets
import string

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

KEY_TYPES = ("live", "test", "readonly")

_PREFIX = "lkx_"
_PUBLIC_ID_LEN = 12
_SECRET_LEN = 36
_ALPHABET = string.ascii_letters + string.digits

_hasher = PasswordHasher()


def generate_api_key(key_type: str) -> tuple[str, str, str]:
    """Retourne (token_complet, public_id, secret).

    Le token complet n'est jamais reconstituable ensuite : à afficher une fois.
    """
    if key_type not in KEY_TYPES:
        raise ValueError(f"Type de clé inconnu : {key_type!r}")
    public_id = "".join(secrets.choice(_ALPHABET) for _ in range(_PUBLIC_ID_LEN))
    secret = "".join(secrets.choice(_ALPHABET) for _ in range(_SECRET_LEN))
    token = f"{_PREFIX}{key_type}_{public_id}{secret}"
    return token, public_id, secret


def hash_secret(secret: str) -> str:
    """Hache le secret en Argon2id (cf. CLAUDE.md §5 / §9)."""
    return _hasher.hash(secret)


def verify_secret(secret: str, hashed: str) -> bool:
    try:
        return _hasher.verify(hashed, secret)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def parse_token(token: str) -> tuple[str, str, str] | None:
    """Découpe un token en (type, public_id, secret), ou None si malformé."""
    if not token.startswith(_PREFIX):
        return None
    key_type, sep, body = token[len(_PREFIX):].partition("_")
    if not sep or key_type not in KEY_TYPES:
        return None
    if len(body) <= _PUBLIC_ID_LEN:
        return None
    return key_type, body[:_PUBLIC_ID_LEN], body[_PUBLIC_ID_LEN:]
