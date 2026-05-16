"""Vérifie la signature HMAC des webhooks et la création des livraisons."""
import hashlib
import hmac

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from app.models import Webhook, WebhookDelivery
from app.webhooks import backoff_delay, dispatch, new_webhook_secret, sign_payload


def test_signature_header_format_and_verification() -> None:
    secret = "whsec_exemple"
    payload = '{"type":"monitor.verified"}'
    header = sign_payload(secret, payload, timestamp=1_700_000_000)

    assert header.startswith("t=1700000000,v1=")
    # Re-vérification côté récepteur (algorithme documenté dans Docs.html).
    parts = dict(piece.split("=", 1) for piece in header.split(","))
    expected = hmac.new(
        secret.encode(), f"{parts['t']}.{payload}".encode(), hashlib.sha256
    ).hexdigest()
    assert hmac.compare_digest(expected, parts["v1"])


def test_signature_depends_on_payload() -> None:
    secret = "whsec_exemple"
    assert sign_payload(secret, '{"a":1}', timestamp=1) != sign_payload(
        secret, '{"a":2}', timestamp=1
    )


def test_backoff_grows_and_is_capped() -> None:
    assert backoff_delay(1) < backoff_delay(5)
    assert backoff_delay(13).total_seconds() == 360 * 60


def test_new_secret_is_prefixed() -> None:
    assert new_webhook_secret().startswith("whsec_")


def test_dispatch_targets_only_subscribed_webhooks() -> None:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(
            Webhook(id="wh_all", org_id="org_x", url="https://a.test/h",
                    secret="whsec_a", events="*")
        )
        session.add(
            Webhook(id="wh_other", org_id="org_x", url="https://b.test/h",
                    secret="whsec_b", events="leak.resolved")
        )
        session.commit()

        created = dispatch(session, "org_x", "monitor.verified", {"monitor": {"id": "mon_1"}})
        assert created == 1  # seul le webhook « * » est concerné

        deliveries = session.exec(select(WebhookDelivery)).all()
        assert len(deliveries) == 1
        delivery = deliveries[0]
        assert delivery.status == "pending"
        assert delivery.payload["type"] == "monitor.verified"
        assert delivery.payload["id"] == delivery.id
        assert delivery.payload["data"]["monitor"]["id"] == "mon_1"
