"""Webhooks sortants : signature HMAC SHA-256 et livraison avec backoff.

Format de signature (cf. CLAUDE.md §5, Docs.html#verify-signature) :
    X-LeakX-Signature: t=<timestamp>,v1=<hmac_sha256_hex>
Le HMAC est calculé sur la chaîne `<timestamp>.<payload_brut>`.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
from datetime import timedelta

import httpx
from sqlmodel import Session, select

from .config import settings
from .models import Webhook, WebhookDelivery
from .util import utcnow

EVENT_TYPES = (
    "leak.detected",
    "leak.resolved",
    "monitor.verified",
    "actor.observed",
    "quota.warning",
)
SIGNATURE_HEADER = "X-LeakX-Signature"
MAX_ATTEMPTS = 12
_BACKOFF_CAP_MINUTES = 360


def new_webhook_secret() -> str:
    """Secret de signature partagé avec le client (affiché une seule fois)."""
    return "whsec_" + secrets.token_urlsafe(32)


def sign_payload(secret: str, payload: str, timestamp: int | None = None) -> str:
    """Valeur du header X-LeakX-Signature pour un corps de requête donné."""
    ts = int(time.time()) if timestamp is None else timestamp
    digest = hmac.new(
        secret.encode("utf-8"),
        f"{ts}.{payload}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"t={ts},v1={digest}"


def backoff_delay(attempt: int) -> timedelta:
    """Délai avant la prochaine tentative (backoff exponentiel plafonné à 6 h)."""
    minutes = min(_BACKOFF_CAP_MINUTES, 2 ** max(0, attempt - 1))
    return timedelta(minutes=minutes)


def _subscribed(webhook: Webhook, event_type: str) -> bool:
    if webhook.events.strip() == "*":
        return True
    return event_type in {e.strip() for e in webhook.events.split(",") if e.strip()}


def dispatch(session: Session, org_id: str, event_type: str, data: dict) -> int:
    """Enregistre une livraison en attente pour chaque webhook souscrit.

    La livraison HTTP est faite ensuite par le worker `deliver_pending`.
    Renvoie le nombre de livraisons créées.
    """
    webhooks = session.exec(
        select(Webhook).where(Webhook.org_id == org_id, Webhook.status == "active")
    ).all()
    created = 0
    for webhook in webhooks:
        if not _subscribed(webhook, event_type):
            continue
        delivery = WebhookDelivery(webhook_id=webhook.id, org_id=org_id, event_type=event_type)
        delivery.payload = {
            "id": delivery.id,
            "type": event_type,
            "created_at": utcnow().replace(microsecond=0).isoformat() + "Z",
            "data": data,
        }
        session.add(delivery)
        created += 1
    session.commit()
    return created


def deliver_one(session: Session, delivery: WebhookDelivery, webhook: Webhook) -> bool:
    """Effectue une tentative de livraison HTTP signée et met à jour la livraison."""
    body = json.dumps(delivery.payload, separators=(",", ":"), ensure_ascii=False)
    signature = sign_payload(webhook.secret, body)
    delivery.attempts += 1

    ok = False
    try:
        response = httpx.post(
            webhook.url,
            content=body,
            headers={
                "Content-Type": "application/json",
                SIGNATURE_HEADER: signature,
                "User-Agent": settings.user_agent,
            },
            timeout=settings.http_timeout,
        )
        ok = 200 <= response.status_code < 300
        delivery.last_error = None if ok else f"HTTP {response.status_code}"
    except Exception as exc:  # erreur réseau, DNS, timeout…
        delivery.last_error = str(exc)[:300]

    if ok:
        delivery.status = "delivered"
        delivery.delivered_at = utcnow()
    elif delivery.attempts >= MAX_ATTEMPTS:
        delivery.status = "failed"
    else:
        delivery.status = "pending"
        delivery.next_attempt_at = utcnow() + backoff_delay(delivery.attempts)

    session.add(delivery)
    session.commit()
    return ok


def deliver_pending(session: Session) -> tuple[int, int]:
    """Traite toutes les livraisons dues. Renvoie (livrées, en échec définitif)."""
    due = session.exec(
        select(WebhookDelivery).where(
            WebhookDelivery.status == "pending",
            WebhookDelivery.next_attempt_at <= utcnow(),
        )
    ).all()
    delivered = failed = 0
    for delivery in due:
        webhook = session.get(Webhook, delivery.webhook_id)
        if webhook is None or webhook.status != "active":
            delivery.status = "failed"
            delivery.last_error = "webhook supprimé ou désactivé"
            session.add(delivery)
            session.commit()
            failed += 1
            continue
        if deliver_one(session, delivery, webhook):
            delivered += 1
        elif delivery.status == "failed":
            failed += 1
    return delivered, failed
