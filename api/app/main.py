"""API REST LeakX.

Les réponses suivent l'enveloppe standard décrite dans CLAUDE.md §6 :
    succès -> {"data": ..., "meta": {"request_id", "duration_ms"}}
    erreur -> {"error": {"code", "message", "request_id"}}

Toutes les routes `/v1` sont authentifiées par clé API (Bearer token) et
soumises au rate limiting, sauf `/v1/sources` (registre public) et `/health`.
"""
from __future__ import annotations

import asyncio
import json
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, FastAPI, Header, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import func
from sqlmodel import Session, select

from .alerts import ALERT_STATUSES, get_statuses, set_status
from .auth import KEY_TYPES, generate_api_key, hash_secret, parse_token, verify_secret
from .db import engine, get_session, init_db
from .kyb import expected_txt_record, is_in_scope, new_verification_token, verify_domain
from .models import AlertState, ApiKey, Leak, Monitor, Org, Source, Webhook
from .ratelimit import TIERS, consume_token, current_usage, increment_usage
from .schemas import AlertUpdate, ApiKeyCreate, MonitorCreate, SearchRequest, WebhookCreate
from .util import new_id, utcnow
from .webhooks import EVENT_TYPES, dispatch, new_webhook_secret

MONITOR_TYPES = {"domain", "email", "ip", "vip", "brand", "repo"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="LeakX API", version="0.1.0", lifespan=lifespan)


# --------------------------------------------------------------------------
# Gestion d'erreurs : format d'erreur métier de CLAUDE.md §6.
# --------------------------------------------------------------------------
class LeakXError(Exception):
    def __init__(
        self,
        status: int,
        code: str,
        message: str,
        headers: Optional[dict] = None,
    ) -> None:
        self.status = status
        self.code = code
        self.message = message
        self.headers = headers or {}


@app.exception_handler(LeakXError)
async def _leakx_error_handler(request: Request, exc: LeakXError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status,
        content={"error": {"code": exc.code, "message": exc.message, "request_id": new_id("req")}},
        headers=exc.headers or None,
    )


@app.exception_handler(RequestValidationError)
async def _validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Requête invalide.",
                "request_id": new_id("req"),
            }
        },
    )


# --------------------------------------------------------------------------
# Contexte de requête : identifiant + chronométrage pour le bloc `meta`.
# --------------------------------------------------------------------------
class Ctx:
    def __init__(self) -> None:
        self.request_id = new_id("req")
        self._t0 = time.perf_counter()

    @property
    def duration_ms(self) -> float:
        return round((time.perf_counter() - self._t0) * 1000, 1)


def get_ctx() -> Ctx:
    return Ctx()


def envelope(data: object, ctx: Ctx) -> dict:
    return {"data": data, "meta": {"request_id": ctx.request_id, "duration_ms": ctx.duration_ms}}


# --------------------------------------------------------------------------
# Authentification par clé API (Bearer token).
# --------------------------------------------------------------------------
@dataclass
class AuthContext:
    org_id: str
    key_id: str
    key_type: str  # live | test | readonly


def _authenticate(authorization: Optional[str], session: Session) -> AuthContext:
    """Résout un header `Authorization: Bearer …` en `AuthContext`."""
    if not authorization or not authorization.startswith("Bearer "):
        raise LeakXError(401, "unauthorized", "Clé API manquante (header Authorization).")

    parsed = parse_token(authorization[len("Bearer "):].strip())
    if parsed is None:
        raise LeakXError(401, "unauthorized", "Clé API malformée.")
    key_type, public_id, secret = parsed

    api_key = session.exec(select(ApiKey).where(ApiKey.public_id == public_id)).first()
    if (
        api_key is None
        or api_key.revoked_at is not None
        or api_key.type != key_type
        or not verify_secret(secret, api_key.secret_hash)
    ):
        raise LeakXError(401, "unauthorized", "Clé API invalide ou révoquée.")

    api_key.last_used_at = utcnow()
    session.add(api_key)
    session.commit()
    return AuthContext(org_id=api_key.org_id, key_id=api_key.id, key_type=api_key.type)


def require_auth(
    authorization: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
) -> AuthContext:
    return _authenticate(authorization, session)


def rate_limited(
    response: Response,
    auth: AuthContext = Depends(require_auth),
    session: Session = Depends(get_session),
) -> AuthContext:
    """Applique le débit par minute et le quota mensuel du tier (CLAUDE.md §5)."""
    org = session.get(Org, auth.org_id)
    tier = TIERS.get(org.plan if org else "community", TIERS["community"])

    if tier.rpm is not None:
        rpm = consume_token(auth.key_id, tier)
        headers = {
            "X-RateLimit-Limit": str(tier.rpm),
            "X-RateLimit-Remaining": str(max(0, rpm.remaining)),
            "X-RateLimit-Reset": str(rpm.reset),
        }
        for name, value in headers.items():
            response.headers[name] = value
        if not rpm.allowed:
            raise LeakXError(
                429,
                "rate_limited",
                "Limite de requêtes par minute atteinte.",
                headers={**headers, "Retry-After": str(rpm.retry_after)},
            )

    # Le quota mensuel ne s'applique pas aux clés de test (sandbox gratuite).
    if tier.monthly_quota is not None and auth.key_type != "test":
        if current_usage(session, auth.org_id) >= tier.monthly_quota:
            raise LeakXError(
                402,
                "payment_required",
                "Quota mensuel dépassé. Passez à un plan supérieur pour continuer.",
            )
        increment_usage(session, auth.org_id)

    return auth


def rate_limited_write(auth: AuthContext = Depends(rate_limited)) -> AuthContext:
    """Comme `rate_limited`, mais refuse les clés en lecture seule."""
    if auth.key_type == "readonly":
        raise LeakXError(403, "forbidden", "Cette clé est en lecture seule (lkx_readonly_).")
    return auth


def _api_key_public(key: ApiKey) -> dict:
    """Vue d'une clé API sans le secret haché."""
    return {
        "id": key.id,
        "public_id": key.public_id,
        "type": key.type,
        "label": key.label,
        "created_at": key.created_at,
        "last_used_at": key.last_used_at,
        "revoked_at": key.revoked_at,
    }


# --------------------------------------------------------------------------
# Endpoints publics
# --------------------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/v1/sources")
def list_sources(
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
) -> dict:
    """Registre public des sources — chaque observation est rattachée à l'une d'elles."""
    sources = session.exec(select(Source).order_by(Source.trust_tier, Source.name)).all()
    return envelope({"sources": sources}, ctx)


# --------------------------------------------------------------------------
# Observations (authentifié)
# --------------------------------------------------------------------------
@app.get("/v1/leaks")
def list_leaks(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    limit = max(1, min(limit, 100))
    offset = max(0, offset)

    query = select(Leak)
    count_query = select(func.count()).select_from(Leak)
    if category:
        query = query.where(Leak.category == category)
        count_query = count_query.where(Leak.category == category)
    if severity:
        query = query.where(Leak.severity == severity)
        count_query = count_query.where(Leak.severity == severity)

    total = session.exec(count_query).one()
    leaks = session.exec(
        query.order_by(Leak.collected_at.desc()).offset(offset).limit(limit)
    ).all()
    return envelope(
        {"leaks": leaks, "page": {"limit": limit, "offset": offset, "total": total}},
        ctx,
    )


@app.get("/v1/leaks/{leak_id}")
def get_leak(
    leak_id: str,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    leak = session.get(Leak, leak_id)
    if leak is None:
        raise LeakXError(404, "not_found", f"Aucune fuite avec l'identifiant {leak_id}.")
    source = session.get(Source, leak.source_id)
    return envelope({"leak": leak, "source": source}, ctx)


@app.post("/v1/search")
def search(
    body: SearchRequest,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    value = body.value.strip()
    if not value:
        raise LeakXError(422, "validation_error", "Le champ `value` ne peut pas être vide.")

    # KYB : la recherche est limitée au périmètre vérifié de l'organisation.
    monitors = session.exec(select(Monitor).where(Monitor.org_id == auth.org_id)).all()
    if not is_in_scope(monitors, (body.type or "").lower(), value):
        raise LeakXError(
            403,
            "outside_scope",
            "L'entité recherchée n'est pas dans votre périmètre vérifié.",
        )

    leaks = session.exec(
        select(Leak)
        .where(Leak.entity.ilike(f"%{value.lower()}%"))
        .order_by(Leak.collected_at.desc())
        .limit(100)
    ).all()

    by_severity = {"high": 0, "med": 0, "low": 0}
    for leak in leaks:
        by_severity[leak.severity] = by_severity.get(leak.severity, 0) + 1

    return envelope(
        {
            "query": {"type": body.type, "value": body.value},
            "summary": {"total": len(leaks), "by_severity": by_severity},
            "leaks": leaks,
        },
        ctx,
    )


# --------------------------------------------------------------------------
# Monitors & KYB — un domaine ne devient surveillable qu'après preuve de
# contrôle (vérification DNS TXT). Garde-fou anti-doxxing, cf. CLAUDE.md §5.
# --------------------------------------------------------------------------
@app.post("/v1/monitors", status_code=201)
def create_monitor(
    body: MonitorCreate,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> dict:
    monitor_type = body.type.strip().lower()
    if monitor_type not in MONITOR_TYPES:
        raise LeakXError(422, "validation_error", f"Type de monitor inconnu : {body.type!r}.")
    value = body.value.strip().lower()
    if not value:
        raise LeakXError(422, "validation_error", "Le champ `value` est requis.")

    monitor = Monitor(org_id=auth.org_id, type=monitor_type, value=value)

    if monitor_type == "domain":
        # KYB : preuve de contrôle exigée avant activation.
        monitor.verification_method = "dns_txt"
        monitor.verification_token = new_verification_token()
        monitor.status = "verifying"
    elif monitor_type == "email":
        # Doit relever d'un domaine déjà vérifié par la même organisation.
        domain = value.rsplit("@", 1)[-1] if "@" in value else ""
        verified_domain = session.exec(
            select(Monitor).where(
                Monitor.org_id == auth.org_id,
                Monitor.type == "domain",
                Monitor.value == domain,
                Monitor.status == "active",
            )
        ).first()
        if verified_domain is None:
            raise LeakXError(
                422,
                "validation_error",
                f"Un monitor `email` doit relever d'un domaine déjà vérifié "
                f"(domaine attendu : {domain or '—'}).",
            )
        monitor.verification_method = "domain_inherited"
        monitor.status = "active"
        monitor.verified_at = utcnow()
    else:
        # ip / vip / brand / repo : validation manuelle par l'équipe LeakX.
        monitor.verification_method = "manual"
        monitor.status = "verifying"

    session.add(monitor)
    session.commit()
    session.refresh(monitor)

    data: dict = {"monitor": monitor}
    if monitor.verification_method == "dns_txt":
        data["verification"] = {
            "method": "dns_txt",
            "record_name": monitor.value,
            "record_type": "TXT",
            "record_value": expected_txt_record(monitor.verification_token),
            "instructions": (
                "Publiez cet enregistrement TXT dans la zone DNS du domaine, "
                "puis appelez POST /v1/monitors/{id}/verify."
            ),
        }
    return envelope(data, ctx)


@app.get("/v1/monitors")
def list_monitors(
    status: Optional[str] = None,
    type_filter: Optional[str] = Query(default=None, alias="type"),
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    query = select(Monitor).where(Monitor.org_id == auth.org_id)
    if status:
        query = query.where(Monitor.status == status)
    if type_filter:
        query = query.where(Monitor.type == type_filter)
    monitors = session.exec(query.order_by(Monitor.created_at.desc())).all()
    return envelope({"monitors": monitors}, ctx)


@app.get("/v1/monitors/{monitor_id}")
def get_monitor(
    monitor_id: str,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    monitor = session.get(Monitor, monitor_id)
    if monitor is None or monitor.org_id != auth.org_id:
        raise LeakXError(404, "not_found", f"Aucun monitor avec l'identifiant {monitor_id}.")
    return envelope({"monitor": monitor}, ctx)


@app.post("/v1/monitors/{monitor_id}/verify")
def verify_monitor(
    monitor_id: str,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> dict:
    monitor = session.get(Monitor, monitor_id)
    if monitor is None or monitor.org_id != auth.org_id:
        raise LeakXError(404, "not_found", f"Aucun monitor avec l'identifiant {monitor_id}.")
    if monitor.verification_method != "dns_txt" or not monitor.verification_token:
        raise LeakXError(422, "validation_error", "Ce monitor ne se vérifie pas par DNS TXT.")
    if monitor.status == "active":
        return envelope({"monitor": monitor, "verified": True}, ctx)

    verified = verify_domain(monitor.value, monitor.verification_token)
    if verified:
        monitor.status = "active"
        monitor.verified_at = utcnow()
        session.add(monitor)
        session.commit()
        session.refresh(monitor)
        dispatch(
            session,
            auth.org_id,
            "monitor.verified",
            {"monitor": {"id": monitor.id, "type": monitor.type, "value": monitor.value}},
        )
    return envelope({"monitor": monitor, "verified": verified}, ctx)


@app.delete("/v1/monitors/{monitor_id}", status_code=204)
def delete_monitor(
    monitor_id: str,
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> Response:
    monitor = session.get(Monitor, monitor_id)
    if monitor is None or monitor.org_id != auth.org_id:
        raise LeakXError(404, "not_found", f"Aucun monitor avec l'identifiant {monitor_id}.")
    session.delete(monitor)
    session.commit()
    return Response(status_code=204)


# --------------------------------------------------------------------------
# Clés API
# --------------------------------------------------------------------------
@app.get("/v1/keys")
def list_keys(
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    keys = session.exec(
        select(ApiKey).where(ApiKey.org_id == auth.org_id).order_by(ApiKey.created_at.desc())
    ).all()
    return envelope({"keys": [_api_key_public(k) for k in keys]}, ctx)


@app.post("/v1/keys", status_code=201)
def create_key(
    body: ApiKeyCreate,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> dict:
    key_type = body.type.strip().lower()
    if key_type not in KEY_TYPES:
        raise LeakXError(422, "validation_error", f"Type de clé inconnu : {body.type!r}.")

    token, public_id, secret = generate_api_key(key_type)
    api_key = ApiKey(
        org_id=auth.org_id,
        public_id=public_id,
        type=key_type,
        secret_hash=hash_secret(secret),
        label=body.label.strip(),
    )
    session.add(api_key)
    session.commit()
    session.refresh(api_key)

    return envelope(
        {
            "key": _api_key_public(api_key),
            "token": token,
            "warning": "Cette clé n'est affichée qu'une seule fois — conservez-la maintenant.",
        },
        ctx,
    )


@app.delete("/v1/keys/{key_id}")
def revoke_key(
    key_id: str,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> dict:
    api_key = session.get(ApiKey, key_id)
    if api_key is None or api_key.org_id != auth.org_id:
        raise LeakXError(404, "not_found", f"Aucune clé avec l'identifiant {key_id}.")
    if api_key.revoked_at is None:
        api_key.revoked_at = utcnow()
        session.add(api_key)
        session.commit()
        session.refresh(api_key)
    return envelope({"key": _api_key_public(api_key)}, ctx)


# --------------------------------------------------------------------------
# Webhooks — notifications signées HMAC des événements (cf. CLAUDE.md §5).
# --------------------------------------------------------------------------
def _webhook_public(webhook: Webhook) -> dict:
    """Vue d'un webhook sans le secret de signature complet."""
    return {
        "id": webhook.id,
        "url": webhook.url,
        "events": webhook.events,
        "status": webhook.status,
        "secret_hint": webhook.secret[:11] + "…",
        "created_at": webhook.created_at,
    }


@app.post("/v1/webhooks", status_code=201)
def create_webhook(
    body: WebhookCreate,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> dict:
    url = body.url.strip()
    if not (url.startswith("https://") or url.startswith("http://")):
        raise LeakXError(422, "validation_error", "L'URL du webhook doit être en http(s).")

    events = "*"
    if body.events:
        unknown = [e for e in body.events if e not in EVENT_TYPES]
        if unknown:
            raise LeakXError(422, "validation_error", f"Types d'événement inconnus : {unknown}.")
        events = ",".join(body.events)

    webhook = Webhook(org_id=auth.org_id, url=url, secret=new_webhook_secret(), events=events)
    session.add(webhook)
    session.commit()
    session.refresh(webhook)

    return envelope(
        {
            "webhook": _webhook_public(webhook),
            "secret": webhook.secret,
            "warning": "Ce secret de signature n'est affiché qu'une seule fois.",
        },
        ctx,
    )


@app.get("/v1/webhooks")
def list_webhooks(
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    webhooks = session.exec(
        select(Webhook).where(Webhook.org_id == auth.org_id).order_by(Webhook.created_at.desc())
    ).all()
    return envelope({"webhooks": [_webhook_public(w) for w in webhooks]}, ctx)


@app.delete("/v1/webhooks/{webhook_id}", status_code=204)
def delete_webhook(
    webhook_id: str,
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> Response:
    webhook = session.get(Webhook, webhook_id)
    if webhook is None or webhook.org_id != auth.org_id:
        raise LeakXError(404, "not_found", f"Aucun webhook avec l'identifiant {webhook_id}.")
    session.delete(webhook)
    session.commit()
    return Response(status_code=204)


# --------------------------------------------------------------------------
# Quota d'usage
# --------------------------------------------------------------------------
@app.get("/v1/usage")
def get_usage(
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    org = session.get(Org, auth.org_id)
    plan = org.plan if org else "community"
    tier = TIERS.get(plan, TIERS["community"])
    used = current_usage(session, auth.org_id)
    quota = tier.monthly_quota
    return envelope(
        {
            "plan": plan,
            "period": utcnow().strftime("%Y-%m"),
            "requests_used": used,
            "monthly_quota": quota,
            "requests_remaining": None if quota is None else max(0, quota - used),
            "rpm_limit": tier.rpm,
        },
        ctx,
    )


# --------------------------------------------------------------------------
# Alertes — observations qui touchent le périmètre vérifié de l'organisation.
# Le statut de traitement est propre à chaque organisation (cf. alerts.py).
# --------------------------------------------------------------------------
def _leak_in_org_scope(session: Session, org_id: str, leak: Leak) -> bool:
    monitors = session.exec(select(Monitor).where(Monitor.org_id == org_id)).all()
    return is_in_scope(monitors, leak.entity_kind, leak.entity)


@app.get("/v1/alerts")
def list_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited),
) -> dict:
    limit = max(1, min(limit, 200))
    monitors = session.exec(select(Monitor).where(Monitor.org_id == auth.org_id)).all()
    recent = session.exec(select(Leak).order_by(Leak.collected_at.desc()).limit(500)).all()
    in_perimeter = [lk for lk in recent if is_in_scope(monitors, lk.entity_kind, lk.entity)]
    statuses = get_statuses(session, auth.org_id, [lk.id for lk in in_perimeter])

    alerts = []
    for leak in in_perimeter:
        state = statuses.get(leak.id, "open")
        if status and state != status:
            continue
        if severity and leak.severity != severity:
            continue
        alerts.append({"leak": leak, "status": state})
        if len(alerts) >= limit:
            break
    return envelope({"alerts": alerts, "total": len(alerts)}, ctx)


@app.patch("/v1/alerts/{leak_id}")
def update_alert(
    leak_id: str,
    body: AlertUpdate,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> dict:
    new_status = body.status.strip().lower()
    if new_status not in ALERT_STATUSES:
        raise LeakXError(422, "validation_error", f"Statut inconnu : {body.status!r}.")
    leak = session.get(Leak, leak_id)
    if leak is None:
        raise LeakXError(404, "not_found", f"Aucune observation avec l'identifiant {leak_id}.")
    if not _leak_in_org_scope(session, auth.org_id, leak):
        raise LeakXError(403, "outside_scope", "Cette observation n'est pas dans votre périmètre.")
    state = set_status(session, auth.org_id, leak_id, new_status)
    return envelope({"alert": {"leak": leak, "status": state.status}}, ctx)


@app.post("/v1/leaks/{leak_id}/resolve")
def resolve_leak(
    leak_id: str,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
    auth: AuthContext = Depends(rate_limited_write),
) -> dict:
    leak = session.get(Leak, leak_id)
    if leak is None:
        raise LeakXError(404, "not_found", f"Aucune observation avec l'identifiant {leak_id}.")
    if not _leak_in_org_scope(session, auth.org_id, leak):
        raise LeakXError(403, "outside_scope", "Cette observation n'est pas dans votre périmètre.")
    state = set_status(session, auth.org_id, leak_id, "resolved")
    dispatch(
        session,
        auth.org_id,
        "leak.resolved",
        {"leak": {"id": leak.id, "entity": leak.entity, "severity": leak.severity}},
    )
    return envelope({"alert": {"leak": leak, "status": state.status}}, ctx)


# --------------------------------------------------------------------------
# Flux d'événements temps réel (Server-Sent Events).
# Implémentation par sondage (15 s) ; passera à PostgreSQL LISTEN/NOTIFY en
# production pour de l'événementiel pur.
# --------------------------------------------------------------------------
@app.get("/v1/events")
async def stream_events(
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> StreamingResponse:
    with Session(engine) as session:
        auth = _authenticate(authorization, session)

    async def event_stream():
        last_check = utcnow()
        yield ": flux LeakX ouvert\n\n"
        while True:
            if await request.is_disconnected():
                break
            with Session(engine) as session:
                monitors = session.exec(
                    select(Monitor).where(Monitor.org_id == auth.org_id)
                ).all()
                new_leaks = session.exec(
                    select(Leak)
                    .where(Leak.collected_at > last_check)
                    .order_by(Leak.collected_at)
                ).all()
                for leak in new_leaks:
                    if not is_in_scope(monitors, leak.entity_kind, leak.entity):
                        continue
                    event = {
                        "id": new_id("evt"),
                        "type": "leak.detected",
                        "data": {
                            "leak": {
                                "id": leak.id,
                                "title": leak.title,
                                "severity": leak.severity,
                                "entity": leak.entity,
                            }
                        },
                    }
                    yield f"event: leak.detected\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"
            last_check = utcnow()
            yield ": keep-alive\n\n"
            await asyncio.sleep(15)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
