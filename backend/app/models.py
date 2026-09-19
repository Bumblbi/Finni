from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def new_id():
    return str(uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    nickname: Mapped[str] = mapped_column(String(32))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    revision: Mapped[int] = mapped_column(default=0)
    epoch: Mapped[int] = mapped_column(default=1)
    period_number: Mapped[int] = mapped_column(default=1)
    demo: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    __mapper_args__ = {"version_id_col": revision, "version_id_generator": False}


class Pet(Base):
    __tablename__ = "pets"
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    name: Mapped[str] = mapped_column(String(32))
    body: Mapped[str] = mapped_column(String(20))
    color: Mapped[str] = mapped_column(String(20))
    accessory: Mapped[str] = mapped_column(String(20))
    mood: Mapped[int] = mapped_column(default=70)
    satiety: Mapped[int] = mapped_column(default=70)
    stage: Mapped[int] = mapped_column(default=1)
    __table_args__ = (CheckConstraint("mood BETWEEN 0 AND 100 AND satiety BETWEEN 0 AND 100 AND stage BETWEEN 1 AND 3"),)


class Balance(Base):
    __tablename__ = "balances"
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    wallet: Mapped[int] = mapped_column(default=0)
    savings: Mapped[int] = mapped_column(default=0)
    __table_args__ = (CheckConstraint("wallet >= 0 AND savings >= 0"),)


class Period(Base):
    __tablename__ = "periods"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    number: Mapped[int]
    income_claimed: Mapped[bool] = mapped_column(default=False)
    plan: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    spent_required: Mapped[int] = mapped_column(default=0)
    spent_wanted: Mapped[int] = mapped_column(default=0)
    saved: Mapped[int] = mapped_column(default=0)
    withdrawn: Mapped[int] = mapped_column(default=0)
    successful: Mapped[bool] = mapped_column(default=False)
    closed: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    __table_args__ = (UniqueConstraint("profile_id", "number"),)


class Content(Base):
    __tablename__ = "content"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    kind: Mapped[str] = mapped_column(String(16), index=True)
    data: Mapped[dict] = mapped_column(JSON)
    active: Mapped[bool] = mapped_column(default=True)


class Goal(Base):
    __tablename__ = "goals"
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    content_id: Mapped[str] = mapped_column(ForeignKey("content.id"))
    title: Mapped[str] = mapped_column(String(100))
    target: Mapped[int]
    __table_args__ = (CheckConstraint("target > 0"),)


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    period_number: Mapped[int]
    kind: Mapped[str] = mapped_column(String(30))
    wallet_delta: Mapped[int]
    savings_delta: Mapped[int]
    wallet_after: Mapped[int]
    savings_after: Mapped[int]
    details: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class QuestAttempt(Base):
    __tablename__ = "quest_attempts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), index=True)
    quest_id: Mapped[str] = mapped_column(ForeignKey("content.id"))
    period_number: Mapped[int]
    choice_id: Mapped[str] = mapped_column(String(40))
    correct: Mapped[bool]
    reward: Mapped[int]
    __table_args__ = (UniqueConstraint("profile_id", "quest_id"),)


class Operation(Base):
    __tablename__ = "operations"
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    operation_id: Mapped[str] = mapped_column(String(36), primary_key=True)
    request_hash: Mapped[str] = mapped_column(String(64))
    response: Mapped[dict] = mapped_column(JSON)


class AdultGate(Base):
    __tablename__ = "adult_gates"
    profile_id: Mapped[str] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    challenge_id: Mapped[str] = mapped_column(String(36))
    answer_hash: Mapped[str] = mapped_column(String(64))
    grant_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(default=0)
