from typing import Annotated, Literal, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=32)]
Money = Annotated[int, Field(strict=True, ge=0, le=1_000_000)]
PositiveMoney = Annotated[int, Field(strict=True, gt=0, le=1_000_000)]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Appearance(StrictModel):
    name: Name = "Финни"
    body: Literal["cat", "fox", "bunny"] = "cat"
    color: Literal["mint", "peach", "lavender"] = "mint"
    accessory: Literal["none", "bow", "hat"] = "none"


class ProfileCreate(StrictModel):
    nickname: Name
    pet: Appearance = Field(default_factory=Appearance)
    demo: bool = True


class Command(StrictModel):
    operation_id: UUID
    expected_revision: Annotated[int, Field(strict=True, ge=0)]
    epoch: Annotated[int, Field(strict=True, ge=1)]


class Income(Command):
    action: Literal["income"] = "income"


class Budget(Command):
    action: Literal["budget"] = "budget"
    required: Money
    wanted: Money
    savings: Money


class Purchase(Command):
    action: Literal["purchase"] = "purchase"
    product_id: str = Field(min_length=1, max_length=80)
    quantity: Annotated[int, Field(strict=True, ge=1, le=20)] = 1


class Deposit(Command):
    action: Literal["deposit"] = "deposit"
    amount: PositiveMoney


class Withdraw(Command):
    action: Literal["withdraw"] = "withdraw"
    amount: PositiveMoney
    confirmed: Literal[True]


class SelectGoal(Command):
    action: Literal["goal"] = "goal"
    goal_id: str = Field(min_length=1, max_length=80)


class AnswerQuest(Command):
    action: Literal["quest"] = "quest"
    quest_id: str = Field(min_length=1, max_length=80)
    choice_id: str = Field(min_length=1, max_length=40)


class Advance(Command):
    action: Literal["advance"] = "advance"


class Customize(Command):
    action: Literal["customize"] = "customize"
    pet: Appearance


GameCommand = Annotated[Union[Income, Budget, Purchase, Deposit, Withdraw, SelectGoal, AnswerQuest, Advance, Customize], Field(discriminator="action")]


class SyncRequest(StrictModel):
    commands: list[GameCommand] = Field(min_length=1, max_length=100)


class GateAnswer(StrictModel):
    challenge_id: UUID
    answer: Annotated[int, Field(strict=True, ge=0, le=10000)]


class Reset(Command):
    confirmed: Literal[True]


class PetState(Appearance):
    mood: int
    satiety: int
    stage: int


class BalanceState(StrictModel):
    wallet: int
    savings: int


class PeriodState(StrictModel):
    number: int
    income_claimed: bool
    plan: dict[str, int] | None
    spent_required: int
    spent_wanted: int
    saved: int
    withdrawn: int
    closed: bool


class GoalState(StrictModel):
    id: str
    title: str
    target: int
    progress: int
    achieved: bool
    estimated_periods: int | None


class State(StrictModel):
    profile_id: str
    nickname: str
    demo: bool
    revision: int
    epoch: int
    pet: PetState
    balance: BalanceState
    period: PeriodState
    goal: GoalState | None
    completed_quests: list[str]


class ProfileCreated(StrictModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    state: State


class CommandResult(StrictModel):
    operation_id: str
    feedback: str
    state: State


class SyncResult(StrictModel):
    results: list[CommandResult]
    state: State


class CatalogItem(StrictModel):
    id: str
    kind: str
    data: dict
