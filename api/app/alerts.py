"""Suivi des alertes par organisation.

Une « alerte » est une observation (`Leak`) qui touche le périmètre vérifié
d'une organisation. Son statut de traitement est propre à chaque organisation
et stocké dans `AlertState` — il ne modifie jamais l'observation partagée.
"""
from __future__ import annotations

from collections.abc import Iterable

from sqlmodel import Session, select

from .models import AlertState
from .util import utcnow

ALERT_STATUSES = ("open", "progress", "resolved")


def _state_id(org_id: str, leak_id: str) -> str:
    return f"{org_id}|{leak_id}"


def get_status(session: Session, org_id: str, leak_id: str) -> str:
    """Statut de traitement d'une observation pour une organisation (défaut: open)."""
    state = session.get(AlertState, _state_id(org_id, leak_id))
    return state.status if state else "open"


def get_statuses(session: Session, org_id: str, leak_ids: Iterable[str]) -> dict[str, str]:
    """Statuts pour un lot d'observations (les absents valent implicitement `open`)."""
    ids = list(leak_ids)
    if not ids:
        return {}
    rows = session.exec(
        select(AlertState).where(
            AlertState.org_id == org_id,
            AlertState.leak_id.in_(ids),
        )
    ).all()
    return {row.leak_id: row.status for row in rows}


def set_status(session: Session, org_id: str, leak_id: str, status: str) -> AlertState:
    """Crée ou met à jour le statut de traitement (upsert idempotent)."""
    state_id = _state_id(org_id, leak_id)
    state = session.get(AlertState, state_id)
    if state is None:
        state = AlertState(id=state_id, org_id=org_id, leak_id=leak_id)
    state.status = status
    state.updated_at = utcnow()
    session.add(state)
    session.commit()
    session.refresh(state)
    return state
