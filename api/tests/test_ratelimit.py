"""Vérifie le token bucket de débit et le compteur de quota mensuel."""
import uuid

from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.ratelimit import TIERS, consume_token, current_usage, increment_usage


def test_tiers_match_claude_md() -> None:
    assert TIERS["community"].rpm == 10
    assert TIERS["community"].monthly_quota == 100
    assert TIERS["pro"].rpm == 60
    assert TIERS["pro"].monthly_quota == 10_000
    assert TIERS["enterprise"].rpm is None
    assert TIERS["enterprise"].monthly_quota is None


def test_token_bucket_allows_burst_then_blocks() -> None:
    tier = TIERS["community"]  # burst = 20
    key = f"key_{uuid.uuid4().hex}"

    results = [consume_token(key, tier) for _ in range(tier.burst)]
    assert all(r.allowed for r in results)

    blocked = consume_token(key, tier)
    assert blocked.allowed is False
    assert blocked.retry_after >= 1


def test_enterprise_tier_is_never_limited() -> None:
    tier = TIERS["enterprise"]
    key = f"key_{uuid.uuid4().hex}"
    assert all(consume_token(key, tier).allowed for _ in range(1000))


def test_monthly_usage_counter_persists_and_increments() -> None:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        org = f"org_{uuid.uuid4().hex}"
        assert current_usage(session, org) == 0
        assert increment_usage(session, org) == 1
        assert increment_usage(session, org) == 2
        assert current_usage(session, org) == 2
