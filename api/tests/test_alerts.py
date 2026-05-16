"""Vérifie le suivi des alertes par organisation (multi-tenant)."""
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.alerts import ALERT_STATUSES, get_status, get_statuses, set_status


def _session() -> Session:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    return Session(engine)


def test_statuses_constant() -> None:
    assert ALERT_STATUSES == ("open", "progress", "resolved")


def test_default_status_is_open() -> None:
    with _session() as session:
        assert get_status(session, "org_a", "lk_1") == "open"


def test_set_status_is_an_idempotent_upsert() -> None:
    with _session() as session:
        set_status(session, "org_a", "lk_1", "progress")
        assert get_status(session, "org_a", "lk_1") == "progress"
        set_status(session, "org_a", "lk_1", "resolved")
        assert get_status(session, "org_a", "lk_1") == "resolved"


def test_status_is_isolated_per_organisation() -> None:
    """Résoudre une observation pour une org n'affecte pas les autres."""
    with _session() as session:
        set_status(session, "org_a", "lk_1", "resolved")
        assert get_status(session, "org_a", "lk_1") == "resolved"
        assert get_status(session, "org_b", "lk_1") == "open"


def test_get_statuses_bulk() -> None:
    with _session() as session:
        set_status(session, "org_a", "lk_1", "progress")
        set_status(session, "org_a", "lk_2", "resolved")
        result = get_statuses(session, "org_a", ["lk_1", "lk_2", "lk_3"])
        assert result == {"lk_1": "progress", "lk_2": "resolved"}
