"""Exécute tous les collecteurs et écrit les observations en base.

Usage :
    python scripts/run_collectors.py
    python scripts/run_collectors.py \\
        --fixture cert_fr=tests/fixtures/cert_fr_sample.xml \\
        --fixture ransomware_live=tests/fixtures/ransomware_live_sample.json

`--fixture ID=CHEMIN` (répétable) rejoue une réponse locale pour le collecteur
`ID` — utile hors-ligne, ou quand la politique réseau bloque les appels
sortants. Les collecteurs sans fixture déclenchent un appel réseau réel.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from sqlmodel import Session, select  # noqa: E402

from app.db import engine, init_db, purge_expired  # noqa: E402
from app.kyb import is_in_scope  # noqa: E402
from app.models import Leak, Monitor, Org  # noqa: E402
from app.sources import ALL_COLLECTORS  # noqa: E402
from app.sources.base import dedup_hash  # noqa: E402
from app.webhooks import dispatch  # noqa: E402


def _load_fixtures(specs: list[str], parser: argparse.ArgumentParser) -> dict[str, object]:
    fixtures: dict[str, object] = {}
    for spec in specs:
        collector_id, sep, path = spec.partition("=")
        if not sep or not path:
            parser.error(f"--fixture attend le format ID=CHEMIN (reçu : {spec!r})")
        raw = pathlib.Path(path).read_text("utf-8")
        try:
            fixtures[collector_id] = json.loads(raw)  # réponse API JSON
        except json.JSONDecodeError:
            fixtures[collector_id] = raw  # flux RSS / texte brut
    return fixtures


def main() -> None:
    parser = argparse.ArgumentParser(description="Collecteurs LeakX")
    parser.add_argument(
        "--fixture",
        action="append",
        default=[],
        metavar="ID=CHEMIN",
        help="Rejoue une réponse locale pour un collecteur donné (répétable).",
    )
    args = parser.parse_args()
    fixtures = _load_fixtures(args.fixture, parser)

    init_db()
    inserted = skipped = notified = 0
    new_leaks: list[Leak] = []

    with Session(engine) as session:
        purged = purge_expired(session)

        for collector_cls in ALL_COLLECTORS:
            collector = collector_cls()
            session.merge(collector.source)  # upsert du registre des sources
            findings = collector.collect(payload=fixtures.get(collector.source.id))

            for finding in findings:
                digest = dedup_hash(collector.source.id, finding)
                already_known = session.exec(
                    select(Leak.id).where(Leak.dedup_hash == digest)
                ).first()
                if already_known:
                    skipped += 1
                    continue
                leak = Leak(
                    source_id=collector.source.id,
                    dedup_hash=digest,
                    **finding.model_dump(),
                )
                session.add(leak)
                new_leaks.append(leak)
                inserted += 1

        session.commit()

        # Fan-out : notifie chaque organisation dont le périmètre vérifié est
        # touché par une nouvelle observation (événement webhook leak.detected).
        for org in session.exec(select(Org)).all():
            monitors = session.exec(select(Monitor).where(Monitor.org_id == org.id)).all()
            for leak in new_leaks:
                if is_in_scope(monitors, leak.entity_kind, leak.entity):
                    notified += dispatch(
                        session,
                        org.id,
                        "leak.detected",
                        {
                            "leak": {
                                "id": leak.id,
                                "title": leak.title,
                                "severity": leak.severity,
                                "entity": leak.entity,
                                "category": leak.category,
                            }
                        },
                    )

    print(
        f"Collecte terminée : {inserted} nouvelle(s), "
        f"{skipped} déjà connue(s), {purged} purgée(s) (rétention 30 j). "
        f"{notified} notification(s) webhook leak.detected."
    )


if __name__ == "__main__":
    main()
