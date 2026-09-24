import hashlib
import json
import math
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import select

from app.models import Balance, Content, Goal, Operation, Period, Pet, QuestAttempt, Transaction, utcnow

PERIOD_INCOME = 100


def fail(code, message, status=409):
    raise HTTPException(status, {"code": code, "message": message})


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def current_period(db, profile):
    return db.scalar(select(Period).where(Period.profile_id == profile.id, Period.number == profile.period_number))


def state(db, profile):
    db.flush()
    pet = db.get(Pet, profile.id)
    balance = db.get(Balance, profile.id)
    period = current_period(db, profile)
    goal = db.get(Goal, profile.id)
    periods = list(db.scalars(select(Period).where(Period.profile_id == profile.id)))
    average = sum(max(0, p.saved - p.withdrawn) for p in periods) / len(periods)
    remaining = max(0, goal.target - balance.savings) if goal else 0
    return {
        "profile_id": profile.id, "nickname": profile.nickname, "demo": profile.demo,
        "revision": profile.revision, "epoch": profile.epoch,
        "pet": {k: getattr(pet, k) for k in ("name", "body_color", "accessory", "outfit", "mood", "satiety", "stage")},
        "balance": {"wallet": balance.wallet, "savings": balance.savings},
        "period": {k: getattr(period, k) for k in ("number", "income_claimed", "plan", "spent_required", "spent_wanted", "saved", "withdrawn", "closed")},
        "goal": {"id": goal.content_id, "title": goal.title, "target": goal.target,
                 "progress": min(balance.savings, goal.target), "achieved": remaining == 0,
                 "estimated_periods": 0 if remaining == 0 else math.ceil(remaining / average) if average > 0 else None} if goal else None,
        "completed_quests": list(db.scalars(select(QuestAttempt.quest_id).where(QuestAttempt.profile_id == profile.id).order_by(QuestAttempt.quest_id))),
    }


def initialize(db, profile, appearance):
    db.add(Pet(profile_id=profile.id, **appearance))
    db.add(Balance(profile_id=profile.id))
    db.add(Period(profile_id=profile.id, number=1))
    default_goal = min(db.scalars(select(Content).where(Content.kind == "goal", Content.active.is_(True))), key=lambda g: (g.data["target"], g.id), default=None)
    if default_goal:
        db.add(Goal(profile_id=profile.id, content_id=default_goal.id, **default_goal.data))
    db.flush()


def catalog_item(db, item_id, kind):
    item = db.get(Content, item_id)
    if not item or item.kind != kind or not item.active:
        fail("content_not_found", "Этот вариант сейчас недоступен.", 404)
    return item


def movement(db, profile, balance, kind, wallet=0, savings=0, **details):
    if balance.wallet + wallet < 0:
        fail("insufficient_funds", "Пока не хватает монет. Можно выбрать покупку дешевле или выполнить задание.")
    if balance.savings + savings < 0:
        fail("insufficient_savings", "В копилке пока нет такой суммы.")
    balance.wallet += wallet
    balance.savings += savings
    db.add(Transaction(profile_id=profile.id, period_number=profile.period_number, kind=kind,
                       wallet_delta=wallet, savings_delta=savings, wallet_after=balance.wallet,
                       savings_after=balance.savings, details=details))


def check_version(profile, command):
    if command.epoch != profile.epoch:
        fail("profile_reset", "Профиль был сброшен. Очистите локальную очередь и загрузите новое состояние.")
    if command.expected_revision != profile.revision:
        fail("revision_conflict", "Прогресс изменился. Загрузите состояние перед повтором действия.")


def execute(db, profile, command):
    operation_id = str(command.operation_id)
    request_hash = digest(json.dumps(command.model_dump(mode="json"), sort_keys=True, ensure_ascii=False))
    if command.epoch != profile.epoch:
        fail("profile_reset", "Профиль был сброшен. Очистите локальную очередь.")
    previous = db.get(Operation, (profile.id, operation_id))
    if previous:
        if previous.request_hash != request_hash:
            fail("idempotency_conflict", "Идентификатор действия уже использован для другого запроса.")
        return previous.response
    check_version(profile, command)
    period = current_period(db, profile)
    balance, pet = db.get(Balance, profile.id), db.get(Pet, profile.id)
    action = command.action
    if period.closed and action != "customize":
        fail("demo_complete", "Пять демопериодов завершены. Результаты доступны в разделе взрослого.")
    feedback = "Готово!"
    if action == "income":
        if period.income_claimed:
            fail("income_already_claimed", "Бюджет этого периода уже получен.")
        movement(db, profile, balance, "income", wallet=PERIOD_INCOME)
        period.income_claimed = True
        feedback = "Получено 100 монет. Сначала спланируй обязательные расходы и сбережения."
    elif action == "budget":
        if period.plan is not None:
            fail("budget_already_set", "План периода уже сохранён.")
        if not period.income_claimed:
            fail("income_required", "Сначала получи бюджет периода.")
        if command.required + command.wanted + command.savings > balance.wallet:
            fail("budget_exceeded", "Нельзя распределить больше монет, чем есть в кошельке.")
        period.plan = {k: getattr(command, k) for k in ("required", "wanted", "savings")}
        feedback = "План сохранён. Деньги в копилку переводятся отдельным действием."
    elif action == "purchase":
        item = catalog_item(db, command.product_id, "product")
        cost = item.data["price"] * command.quantity
        # Map catalog categories to period field names
        cat_to_field = {"mandatory": "required", "required": "required", "optional": "wanted", "wanted": "wanted"}
        field_suffix = cat_to_field.get(item.data["category"], item.data["category"])
        movement(db, profile, balance, "purchase", wallet=-cost, product_id=item.id,
                 quantity=command.quantity, category=item.data["category"], unit_price=item.data["price"])
        field = "spent_" + field_suffix
        setattr(period, field, getattr(period, field) + cost)
        for field in ("mood", "satiety"):
            setattr(pet, field, max(0, min(100, getattr(pet, field) + item.data[field] * command.quantity)))
        feedback = "Покупка совершена."
        plan_key = field_suffix  # "required" or "wanted"
        if period.plan and getattr(period, "spent_" + field_suffix) > period.plan[plan_key]:
            feedback += " Расходы по этой категории превысили план — учти это в следующем периоде."
    elif action in ("deposit", "withdraw"):
        if action == "deposit":
            movement(db, profile, balance, action, wallet=-command.amount, savings=command.amount)
            period.saved += command.amount
            feedback = "Копилка пополнена — ты ближе к цели!"
        else:
            movement(db, profile, balance, action, wallet=command.amount, savings=-command.amount)
            period.withdrawn += command.amount
            feedback = "Монеты возвращены в кошелёк. Срок достижения цели может увеличиться."
    elif action == "goal":
        item = catalog_item(db, command.goal_id, "goal")
        goal = db.get(Goal, profile.id)
        if goal is None:
            goal = Goal(profile_id=profile.id)
            db.add(goal)
        goal.content_id, goal.title, goal.target = item.id, item.data["title"], item.data["target"]
        feedback = "Цель выбрана. Накопленные монеты сохранены."
    elif action == "quest":
        item = catalog_item(db, command.quest_id, "quest")
        if db.scalar(select(QuestAttempt.id).where(QuestAttempt.profile_id == profile.id, QuestAttempt.quest_id == item.id)):
            fail("quest_already_answered", "Это задание уже пройдено. Попробуй следующее!")
        choice = next((c for c in item.data["choices"] if c["id"] == command.choice_id), None)
        if choice is None:
            fail("invalid_choice", "Выбери один из предложенных ответов.", 422)
        reward = item.data["reward"] if choice["correct"] else 0
        db.add(QuestAttempt(profile_id=profile.id, quest_id=item.id, period_number=period.number,
                            choice_id=choice["id"], correct=choice["correct"], reward=reward))
        movement(db, profile, balance, "quest", wallet=reward, quest_id=item.id, correct=choice["correct"])
        pet.mood = min(100, pet.mood + (5 if choice["correct"] else 0))
        feedback = choice["feedback"] + f" Награда: {reward} монет."
    elif action == "customize":
        for key, value in command.pet.model_dump().items():
            setattr(pet, key, value)
    elif action == "advance":
        if not period.income_claimed or period.plan is None:
            fail("period_incomplete", "Перед завершением получи доход и составь план.")
        started = period.created_at.replace(tzinfo=utcnow().tzinfo) if period.created_at.tzinfo is None else period.created_at
        if not profile.demo and utcnow() < started + timedelta(days=1):
            fail("period_not_ready", "Следующий период начнётся через сутки после начала текущего.")
        period.closed = True
        net = period.saved - period.withdrawn
        period.successful = (net > 0 and net >= period.plan["savings"] and period.spent_required > 0
                             and period.spent_required <= period.plan["required"]
                             and period.spent_wanted <= period.plan["wanted"])
        db.flush()
        periods = list(db.scalars(select(Period).where(Period.profile_id == profile.id, Period.closed.is_(True))))
        successes = sum(p.successful for p in periods)
        pet.stage = max(pet.stage, 3 if successes >= 4 else 2 if successes >= 2 else 1)
        pet.satiety = max(0, pet.satiety - 15)
        pet.mood = max(0, min(100, pet.mood + (5 if period.successful else -5)))
        if not profile.demo or profile.period_number < 5:
            profile.period_number += 1
            db.add(Period(profile_id=profile.id, number=profile.period_number))
        feedback = "Период завершён. Регулярные накопления и соблюдение плана помогают питомцу расти."
    profile.revision += 1
    result = {"operation_id": operation_id, "feedback": feedback, "state": state(db, profile)}
    db.add(Operation(profile_id=profile.id, operation_id=operation_id, request_hash=request_hash, response=result))
    db.flush()
    return result
