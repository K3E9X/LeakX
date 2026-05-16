"""Exécute tous les collecteurs et écrit les observations en base.

Usage :
    python scripts/run_collectors.py
    python scripts/run_collectors.py --fixture tests/fixtures/ransomware_live_sample.json

L'option `--fixture` rejoue une réponse JSON locale (utile hors-ligne, ou quand
la politique réseau de l'environnement bloque les appels sortants).
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from sqlmodel import Session, select  # noqa: E402

from app.db import engine, init_db, purge_expired  # noqa: E402
from app.models import Leak  # noqa: E402
from app.sources import ALL_COLLECTORS  # noqa: E402
from app.sources.base import dedup_hash  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Collecteurs LeakX")
    parser.add_argument("--fixture", help="Chemin d'une réponse JSON locale à rejouer")
    args = parser.parse_args()

    fixture_payload = None
    if args.fixture:
        fixture_payload = json.loads(pathlib.Path(args.fixture).read_text("utf-8"))

    init_db()
    inserted = skipped = 0

    with Session(engine) as session:
        purged = purge_expired(session)

        for collector_cls in ALL_COLLECTORS:
            collector = collector_cls()
            session.merge(collector.source)  # upsert du registre des sources
            findings = collector.collect(payload=fixture_payload)

            for finding in findings:
                digest = dedup_hash(collector.source.id, finding)
                already_known = session.exec(
                    select(Leak.id).where(Leak.dedup_hash == digest)
                ).first()
                if already_known:
                    skipped += 1
                    continue
                session.add(
                    Leak(
                        source_id=collector.source.id,
                        dedup_hash=digest,
                        **finding.model_dump(),
                    )
                )
                inserted += 1

        session.commit()

    print(
        f"Collecte terminée : {inserted} nouvelle(s), "
        f"{skipped} déjà connue(s), {purged} purgée(s) (rétention 30 j)."
    )


if __name__ == "__main__":
    main()
