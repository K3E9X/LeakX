"""Livre les webhooks en attente — à lancer périodiquement (ex. cron / minute).

Usage : python scripts/deliver_webhooks.py
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from sqlmodel import Session  # noqa: E402

from app.db import engine, init_db  # noqa: E402
from app.webhooks import deliver_pending  # noqa: E402


def main() -> None:
    init_db()
    with Session(engine) as session:
        delivered, failed = deliver_pending(session)
    print(f"Webhooks : {delivered} livré(s), {failed} en échec définitif.")


if __name__ == "__main__":
    main()
