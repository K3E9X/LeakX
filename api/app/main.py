"""API REST LeakX — endpoints de lecture sur les observations collectées.

Les réponses suivent l'enveloppe standard décrite dans CLAUDE.md §6 :
    succès -> {"data": ..., "meta": {"request_id", "duration_ms"}}
    erreur -> {"error": {"code", "message", "request_id"}}
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlmodel import Session, select

from .db import engine, get_session, init_db
from .models import Leak, Source
from .schemas import SearchRequest
from .util import new_id


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
