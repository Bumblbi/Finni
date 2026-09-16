import secrets
from datetime import timedelta
from typing import Annotated
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

from app.db import get_db
from app.models import AdultGate, Balance, Content, Goal, Operation, Period, Pet, Profile, QuestAttempt, Transaction, utcnow
from app.schemas import (Advance, AnswerQuest, Appearance, Budget, CatalogItem, CommandResult, Customize,
                         Deposit, GateAnswer, Income, ProfileCreate, ProfileCreated, Purchase, Reset,
                         SelectGoal, State, SyncRequest, SyncResult, Withdraw)
from app.service import check_version, digest, execute, fail, initialize, state

app = FastAPI(title="Питомец Финни API", version="1.0.0", description="Игровая экономика. Все суммы — целые игровые монеты. Персональные данные не требуются.")
Db = Annotated[Session, Depends(get_db)]
security = HTTPBearer(auto_error=False)


def get_profile(db: Db, credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)]):
    if not credentials:
        raise HTTPException(401, "Требуется токен игрового профиля", headers={"WWW-Authenticate": "Bearer"})
    profile = db.scalar(select(Profile).where(Profile.token_hash == digest(credentials.credentials)).with_for_update())
    if profile is None:
        raise HTTPException(401, "Неверный токен", headers={"WWW-Authenticate": "Bearer"})
    return profile


Current = Annotated[Profile, Depends(get_profile)]


@app.exception_handler(StaleDataError)
@app.exception_handler(IntegrityError)
async def conflict_handler(request, exc):
    return JSONResponse(status_code=409, content={"detail": {"code": "concurrent_change", "message": "Прогресс изменился одновременно. Загрузите актуальное состояние."}})


@app.get("/health/live", tags=["health"])
def live() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
def ready(db: Db) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ready"}


@app.post("/api/v1/profiles", response_model=ProfileCreated, status_code=201, tags=["profile"])
def create_profile(payload: ProfileCreate, db: Db):
    token = secrets.token_urlsafe(32)
    profile = Profile(nickname=payload.nickname, token_hash=digest(token), demo=payload.demo)
    db.add(profile)
    db.flush()
    initialize(db, profile, payload.pet.model_dump())
    result = {"access_token": token, "state": state(db, profile)}
    db.commit()
    return result


@app.get("/api/v1/state", response_model=State, tags=["profile"])
def get_state(db: Db, profile: Current):
    return state(db, profile)


@app.get("/api/v1/catalog", response_model=list[CatalogItem], tags=["content"])
def catalog(db: Db):
    result = []
    for item in db.scalars(select(Content).where(Content.active.is_(True)).order_by(Content.kind, Content.id)):
        data = dict(item.data)
        if item.kind == "quest":
            data["choices"] = [{"id": c["id"], "text": c["text"]} for c in data["choices"]]
        result.append({"id": item.id, "kind": item.kind, "data": data})
    return result


def run(db, profile, command):
    result = execute(db, profile, command)
    db.commit()
    return result


@app.post("/api/v1/income", response_model=CommandResult, tags=["economy"])
def income(payload: Income, db: Db, profile: Current):
    return run(db, profile, payload)


@app.put("/api/v1/budget", response_model=CommandResult, tags=["economy"])
def budget(payload: Budget, db: Db, profile: Current):
    return run(db, profile, payload)


@app.post("/api/v1/purchases", response_model=CommandResult, tags=["economy"])
def purchase(payload: Purchase, db: Db, profile: Current):
    return run(db, profile, payload)


@app.post("/api/v1/savings/deposit", response_model=CommandResult, tags=["economy"])
def deposit(payload: Deposit, db: Db, profile: Current):
    return run(db, profile, payload)


@app.post("/api/v1/savings/withdraw", response_model=CommandResult, tags=["economy"])
def withdraw(payload: Withdraw, db: Db, profile: Current):
    return run(db, profile, payload)


@app.put("/api/v1/goal", response_model=CommandResult, tags=["economy"])
def select_goal(payload: SelectGoal, db: Db, profile: Current):
    return run(db, profile, payload)


@app.post("/api/v1/quests/answer", response_model=CommandResult, tags=["quests"])
def quest(payload: AnswerQuest, db: Db, profile: Current):
    return run(db, profile, payload)


@app.post("/api/v1/periods/advance", response_model=CommandResult, tags=["economy"])
def advance(payload: Advance, db: Db, profile: Current):
    return run(db, profile, payload)


@app.put("/api/v1/pet", response_model=CommandResult, tags=["profile"])
def customize(payload: Customize, db: Db, profile: Current):
    return run(db, profile, payload)


@app.post("/api/v1/sync", response_model=SyncResult, tags=["sync"])
def sync(payload: SyncRequest, db: Db, profile: Current):
    """Replay an ordered offline queue atomically. On any error, the whole batch rolls back."""
    results = [execute(db, profile, command) for command in payload.commands]
    result = {"results": results, "state": state(db, profile)}
    db.commit()
    return result


@app.get("/api/v1/transactions", tags=["economy"])
def transactions(db: Db, profile: Current, offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)) -> list[dict]:
    rows = db.scalars(select(Transaction).where(Transaction.profile_id == profile.id)
                      .order_by(Transaction.created_at.desc(), Transaction.id.desc()).offset(offset).limit(limit))
    return [{k: getattr(t, k) for k in ("id", "period_number", "kind", "wallet_delta", "savings_delta", "wallet_after", "savings_after", "details", "created_at")} for t in rows]


@app.post("/api/v1/adult/challenge", tags=["adult"])
def challenge(db: Db, profile: Current) -> dict:
    a, b = secrets.randbelow(30) + 20, secrets.randbelow(30) + 10
    gate = db.get(AdultGate, profile.id)
    if gate is None:
        gate = AdultGate(profile_id=profile.id)
        db.add(gate)
    gate.challenge_id = str(uuid4())
    gate.answer_hash = digest(gate.challenge_id + ":" + str(a + b))
    gate.grant_hash, gate.attempts = None, 0
    gate.expires_at = utcnow() + timedelta(minutes=5)
    result = {"challenge_id": gate.challenge_id, "question": f"{a} + {b} = ?", "expires_at": gate.expires_at}
    db.commit()
    return result


def unexpired(gate):
    expiry = gate.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=utcnow().tzinfo)
    return expiry > utcnow()


@app.post("/api/v1/adult/unlock", tags=["adult"])
def unlock(payload: GateAnswer, db: Db, profile: Current) -> dict:
    gate = db.get(AdultGate, profile.id)
    if not gate or gate.challenge_id != str(payload.challenge_id) or not unexpired(gate) or gate.attempts >= 3 or gate.grant_hash:
        fail("challenge_expired", "Получи новый пример для входа.", 403)
    gate.attempts += 1
    if not secrets.compare_digest(gate.answer_hash, digest(gate.challenge_id + ":" + str(payload.answer))):
        db.commit()
        fail("wrong_answer", "Ответ неверный. Попробуй ещё раз.", 403)
    token = secrets.token_urlsafe(32)
    gate.grant_hash, gate.expires_at = digest(token), utcnow() + timedelta(minutes=10)
    result = {"adult_token": token, "expires_at": gate.expires_at}
    db.commit()
    return result


def require_adult(db, profile, token):
    gate = db.get(AdultGate, profile.id)
    if not gate or not gate.grant_hash or not token or not unexpired(gate) or not secrets.compare_digest(gate.grant_hash, digest(token)):
        fail("adult_gate_required", "Сначала пройди проверку в разделе взрослого.", 403)


@app.get("/api/v1/adult/progress", tags=["adult"])
def progress(db: Db, profile: Current, x_adult_token: str | None = Header(None)) -> dict:
    require_adult(db, profile, x_adult_token)
    periods = list(db.scalars(select(Period).where(Period.profile_id == profile.id).order_by(Period.number)))
    attempts = list(db.scalars(select(QuestAttempt).where(QuestAttempt.profile_id == profile.id)))
    closed = [p for p in periods if p.closed]
    streak = 0
    for period in reversed(closed):
        if period.saved <= period.withdrawn:
            break
        streak += 1
    return {"state": state(db, profile), "periods_completed": len(closed),
            "successful_periods": sum(p.successful for p in closed), "savings_streak": streak,
            "quests_completed": len(attempts), "quests_correct": sum(a.correct for a in attempts),
            "quest_rewards": sum(a.reward for a in attempts),
            "periods": [{"number": p.number, "plan": p.plan, "required": p.spent_required,
                         "wanted": p.spent_wanted, "net_savings": p.saved - p.withdrawn, "successful": p.successful,
                         "closed": p.closed} for p in periods]}


@app.post("/api/v1/adult/reset", response_model=CommandResult, tags=["adult"])
def reset(payload: Reset, db: Db, profile: Current, x_adult_token: str | None = Header(None)):
    require_adult(db, profile, x_adult_token)
    check_version(profile, payload)
    # Removing old operation receipts and incrementing epoch prevents old offline actions from resurrecting progress.
    for model in (Operation, QuestAttempt, Transaction, Goal, Period, Pet, Balance, AdultGate):
        db.execute(delete(model).where(model.profile_id == profile.id))
    profile.period_number = 1
    profile.epoch += 1
    profile.revision += 1
    initialize(db, profile, Appearance().model_dump())
    result = {"operation_id": str(payload.operation_id), "feedback": "Прогресс сброшен. Очистите локальный кеш и очередь действий.", "state": state(db, profile)}
    db.commit()
    return result
