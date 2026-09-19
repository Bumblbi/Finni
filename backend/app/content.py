"""Validated, transactional content import: python -m app.content content/catalog.json."""
import json
import sys
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from sqlalchemy import select

from app.db import SessionLocal
from app.models import Content
from app.schemas import Money, PositiveMoney, StrictModel


class Product(StrictModel):
    title: str = Field(min_length=1, max_length=100)
    category: Literal["required", "wanted"]
    price: PositiveMoney
    mood: int = Field(ge=-100, le=100)
    satiety: int = Field(ge=-100, le=100)


class GoalDefinition(StrictModel):
    title: str = Field(min_length=1, max_length=100)
    target: PositiveMoney


class Choice(StrictModel):
    id: str = Field(min_length=1, max_length=40)
    text: str = Field(min_length=1)
    correct: bool
    feedback: str = Field(min_length=1)


class Quest(StrictModel):
    title: str = Field(min_length=1)
    topic: Literal["budget", "needs", "savings"]
    question: str = Field(min_length=1)
    reward: Money
    choices: list[Choice] = Field(min_length=2, max_length=8)

    @model_validator(mode="after")
    def choices_valid(self):
        if len({c.id for c in self.choices}) != len(self.choices) or not any(c.correct for c in self.choices):
            raise ValueError("Choices must have unique IDs and at least one correct answer")
        return self


class Entry(StrictModel):
    id: str = Field(pattern=r"^[a-z0-9_-]{1,80}$")
    kind: Literal["product", "goal", "quest"]
    data: dict

    @model_validator(mode="after")
    def validate_data(self):
        schema = {"product": Product, "goal": GoalDefinition, "quest": Quest}[self.kind]
        self.data = schema.model_validate(self.data).model_dump()
        return self


def seed(session, path):
    entries = [Entry.model_validate(e) for e in json.loads(Path(path).read_text(encoding="utf-8"))]
    if len({e.id for e in entries}) != len(entries):
        raise ValueError("Duplicate content IDs")
    existing = {c.id: c for c in session.scalars(select(Content))}
    for entry in entries:
        if entry.id in existing and existing[entry.id].kind != entry.kind:
            raise ValueError("Cannot change content kind")
    for item in existing.values():
        item.active = False
    for entry in entries:
        item = existing.get(entry.id)
        if item is None:
            item = Content(id=entry.id, kind=entry.kind)
            session.add(item)
        item.data, item.active = entry.data, True
    session.flush()


if __name__ == "__main__":
    with SessionLocal.begin() as session:
        seed(session, sys.argv[1] if len(sys.argv) > 1 else "content/catalog.json")
