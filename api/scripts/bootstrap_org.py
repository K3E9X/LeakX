"""Crée une organisation et sa première clé API (genèse, hors tunnel signup).

Usage :
    python scripts/bootstrap_org.py --name "Veridata SAS"
    python scripts/bootstrap_org.py --name "Veridata SAS" --plan pro

La clé API complète n'est affichée qu'ici, une seule fois.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from sqlmodel import Session  # noqa: E402

from app.auth import generate_api_key, hash_secret  # noqa: E402
from app.db import engine, init_db  # noqa: E402
from app.models import ApiKey, Org  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap d'une organisation LeakX")
    parser.add_argument("--name", required=True, help="Nom de l'organisation")
    parser.add_argument(
        "--plan",
        default="community",
        choices=["community", "pro", "enterprise"],
    )
    args = parser.parse_args()

    init_db()
    with Session(engine) as session:
        org = Org(name=args.name, plan=args.plan)
        session.add(org)
        token, public_id, secret = generate_api_key("live")
        session.add(
            ApiKey(
                org_id=org.id,
                public_id=public_id,
                type="live",
                secret_hash=hash_secret(secret),
                label="clé initiale",
            )
        )
        session.commit()
        org_id = org.id

    print(f"Organisation créée : {org_id}")
    print("Clé API (à conserver — affichée une seule fois) :")
    print(f"  {token}")


if __name__ == "__main__":
    main()
