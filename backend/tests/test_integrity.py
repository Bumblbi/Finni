import json
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4

import pytest
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.content import seed
from app.db import get_db
from app.main import app
from app.models import Balance, Content
from tests.test_game import Player


def test_database_rejects_negative_balance(client):
    p = Player(client)
    with next(app.dependency_overrides[get_db]()) as db:
        balance = db.get(Balance, p.state['profile_id'])
        balance.wallet = -1
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


def test_content_import_validation_and_deactivation(client, tmp_path):
    original = json.loads(open('content/catalog.json', encoding='utf-8').read())
    path = tmp_path / 'catalog.json'
    path.write_text(json.dumps(original[:-1]), encoding='utf-8')
    with next(app.dependency_overrides[get_db]()) as db:
        seed(db, path)
        db.commit()
        assert db.get(Content, original[-1]['id']).active is False
        assert len(list(db.scalars(select(Content)))) == len(original)
        seed(db, path)
        db.commit()
        original[0]['data']['price'] = -1
        path.write_text(json.dumps(original), encoding='utf-8')
        with pytest.raises(ValidationError):
            seed(db, path)
        db.rollback()
        assert db.get(Content, 'food').data['price'] == 20


def test_postgres_concurrent_spending(client):
    with next(app.dependency_overrides[get_db]()) as db:
        if db.bind.dialect.name != 'postgresql':
            pytest.skip('Row-lock concurrency requires PostgreSQL')
    p = Player(client)
    p.send('income')
    barrier = Barrier(2)

    def spend(_):
        payload = p.payload(amount=80, operation_id=str(uuid4()))
        barrier.wait(timeout=10)
        return client.post('/api/v1/savings/deposit', headers=p.headers, json=payload).status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(spend, range(2)))
    assert sorted(statuses) == [200, 409]
    state = client.get('/api/v1/state', headers=p.headers).json()
    assert state['balance'] == {'wallet': 20, 'savings': 80}


def test_postgres_concurrent_idempotency(client):
    with next(app.dependency_overrides[get_db]()) as db:
        if db.bind.dialect.name != 'postgresql':
            pytest.skip('Row-lock concurrency requires PostgreSQL')
    p = Player(client)
    payload = p.payload()
    barrier = Barrier(2)

    def claim(_):
        barrier.wait(timeout=10)
        return client.post('/api/v1/income', headers=p.headers, json=payload)

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(pool.map(claim, range(2)))
    assert all(r.status_code == 200 for r in responses)
    assert responses[0].json() == responses[1].json()
    assert len(client.get('/api/v1/transactions', headers=p.headers).json()) == 1
