"""Connexion base, initialisation du schéma et purge de rétention."""
from __future__ import annotations

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine, select

from .config import settings
from .models import Leak
from .util import utcnow

_connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, connect_args=_connect_args)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def purge_expired(session: Session) -> int:
    """Supprime les enregistrements dont la rétention de 30 jours est dépassée.

    Aucune exception (cf. CLAUDE.md §5). Renvoie le nombre de lignes purgées.
    """
    expired = session.exec(select(Leak).where(Leak.expires_at < utcnow())).all()
    for leak in expired:
        session.delete(leak)
    session.commit()
    return len(expired)
