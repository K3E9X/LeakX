"""API REST LeakX — endpoints de lecture sur les observations collectées.

Les réponses suivent l'enveloppe standard décrite dans CLAUDE.md §6 :
    succès -> {"data": ..., "meta": {"request_id", "duration_ms"}}
    erreur -> {"error": {"code", "message", "request_id"}}
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlmodel import Session, select

from .db import engine, get_session, init_db
from .kyb import expected_txt_record, new_verification_token, verify_domain
from .models import Leak, Monitor, Source
from .schemas import MonitorCreate, SearchRequest
from .util import new_id, utcnow

MONITOR_TYPES = {"domain", "email", "ip", "vip", "brand", "repo"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="LeakX API", version="0.1.0", lifespan=lifespan)


# --------------------------------------------------------------------------
# Gestion d'erreurs : on respecte le format d'erreur métier de CLAUDE.md §6.
# --------------------------------------------------------------------------
class LeakXError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        self.status = status
        self.code = code
        self.message = message


@app.exception_handler(LeakXError)
async def _leakx_error_handler(request: Request, exc: LeakXError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status,
        content={"error": {"code": exc.code, "message": exc.message, "request_id": new_id("req")}},
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
# Endpoints
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


@app.get("/v1/leaks")
def list_leaks(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
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
) -> dict:
    value = body.value.strip()
    if not value:
        raise LeakXError(422, "validation_error", "Le champ `value` ne peut pas être vide.")

    leaks = session.exec(
        select(Leak)
        .where(Leak.entity.ilike(f"%{value}%"))
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
) -> dict:
    monitor_type = body.type.strip().lower()
    if monitor_type not in MONITOR_TYPES:
        raise LeakXError(422, "validation_error", f"Type de monitor inconnu : {body.type!r}.")
    value = body.value.strip().lower()
    if not value:
        raise LeakXError(422, "validation_error", "Le champ `value` est requis.")

    monitor = Monitor(org_id=body.org_id, type=monitor_type, value=value)

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
                Monitor.org_id == body.org_id,
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
    org_id: Optional[str] = None,
    status: Optional[str] = None,
    type_filter: Optional[str] = Query(default=None, alias="type"),
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
) -> dict:
    query = select(Monitor)
    if org_id:
        query = query.where(Monitor.org_id == org_id)
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
) -> dict:
    monitor = session.get(Monitor, monitor_id)
    if monitor is None:
        raise LeakXError(404, "not_found", f"Aucun monitor avec l'identifiant {monitor_id}.")
    return envelope({"monitor": monitor}, ctx)


@app.post("/v1/monitors/{monitor_id}/verify")
def verify_monitor(
    monitor_id: str,
    ctx: Ctx = Depends(get_ctx),
    session: Session = Depends(get_session),
) -> dict:
    monitor = session.get(Monitor, monitor_id)
    if monitor is None:
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
    return envelope({"monitor": monitor, "verified": verified}, ctx)


@app.delete("/v1/monitors/{monitor_id}", status_code=204)
def delete_monitor(
    monitor_id: str,
    session: Session = Depends(get_session),
) -> Response:
    monitor = session.get(Monitor, monitor_id)
    if monitor is None:
        raise LeakXError(404, "not_found", f"Aucun monitor avec l'identifiant {monitor_id}.")
    session.delete(monitor)
    session.commit()
    return Response(status_code=204)
