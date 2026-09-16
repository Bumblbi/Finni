from uuid import uuid4

import pytest


class Player:
    def __init__(self, client, demo=True):
        self.client = client
        response = client.post('/api/v1/profiles', json={'nickname': 'Игрок', 'demo': demo})
        assert response.status_code == 201, response.text
        self.headers = {'Authorization': 'Bearer ' + response.json()['access_token']}
        self.state = response.json()['state']

    def payload(self, **kwargs):
        return {'operation_id': str(uuid4()), 'expected_revision': self.state['revision'], 'epoch': self.state['epoch'], **kwargs}

    def send(self, path, method='post', status=200, **kwargs):
        response = getattr(self.client, method)('/api/v1/' + path, headers=self.headers, json=self.payload(**kwargs))
        assert response.status_code == status, response.text
        if status == 200:
            self.state = response.json()['state']
        return response

    def adult(self):
        challenge = self.client.post('/api/v1/adult/challenge', headers=self.headers).json()
        a, b = [int(x) for x in challenge['question'].replace(' = ?', '').split(' + ')]
        result = self.client.post('/api/v1/adult/unlock', headers=self.headers, json={'challenge_id': challenge['challenge_id'], 'answer': a + b})
        assert result.status_code == 200
        self.headers['X-Adult-Token'] = result.json()['adult_token']


def test_acceptance_five_periods_and_reset(client):
    p = Player(client)
    assert p.state['goal']['estimated_periods'] is None
    for number in range(1, 6):
        p.send('income')
        p.send('budget', method='put', required=40, wanted=20, savings=40)
        if number == 1:
            p.send('quests/answer', quest_id='budget_1', choice_id='plan')
        p.send('purchases', product_id='food')
        p.send('purchases', product_id='ball')
        p.send('purchases', product_id='castle', status=409)
        p.send('savings/deposit', amount=40)
        p.send('periods/advance')
    assert p.state['period']['number'] == 5 and p.state['period']['closed']
    assert p.state['pet']['stage'] == 3
    assert p.state['goal']['achieved'] and p.state['balance']['savings'] == 200
    p.send('income', status=409)
    assert client.get('/api/v1/state', headers=p.headers).json() == p.state
    assert client.get('/api/v1/adult/progress', headers=p.headers).status_code == 403
    p.adult()
    metrics = client.get('/api/v1/adult/progress', headers=p.headers).json()
    assert metrics['successful_periods'] == 5 and metrics['savings_streak'] == 5
    old = p.payload()
    p.send('adult/reset', confirmed=True)
    assert p.state['epoch'] == 2 and p.state['balance'] == {'wallet': 0, 'savings': 0}
    assert p.state['completed_quests'] == []
    assert client.post('/api/v1/income', headers=p.headers, json=old).status_code == 409
    assert client.get('/api/v1/transactions', headers=p.headers).json() == []
    assert client.get('/api/v1/adult/progress', headers=p.headers).status_code == 403


def test_idempotency_and_revision(client):
    p = Player(client)
    payload = p.payload()
    a = client.post('/api/v1/income', headers=p.headers, json=payload)
    b = client.post('/api/v1/income', headers=p.headers, json=payload)
    assert a.status_code == b.status_code == 200 and a.json() == b.json()
    collision = client.post('/api/v1/savings/deposit', headers=p.headers, json={**payload, 'amount': 1})
    assert collision.status_code == 409
    p.send('income', status=409)  # stale revision
    assert len(client.get('/api/v1/transactions', headers=p.headers).json()) == 1
    p.state = a.json()['state']
    p.send('income', status=409)  # new ID cannot claim income twice


@pytest.mark.parametrize('amount', [-1, 0, 1.5, '10', True, 1000001])
def test_strict_money_validation(client, amount):
    p = Player(client)
    p.send('savings/deposit', amount=amount, status=422)


def test_insufficient_funds_budget_and_withdraw(client):
    p = Player(client)
    p.send('income')
    p.send('budget', method='put', required=100, wanted=1, savings=0, status=409)
    p.send('budget', method='put', required=40, wanted=20, savings=40)
    p.send('savings/deposit', amount=101, status=409)
    p.send('savings/deposit', amount=40)
    assert p.state['goal']['estimated_periods'] == 3
    p.send('savings/withdraw', amount=41, confirmed=True, status=409)
    p.send('savings/withdraw', amount=10, confirmed=False, status=422)
    p.send('savings/withdraw', amount=10, confirmed=True)
    assert p.state['goal']['estimated_periods'] == 4
    assert p.state['balance'] == {'wallet': 70, 'savings': 30}


def test_quest_rewards_once_and_hidden_answers(client):
    p = Player(client)
    catalog = client.get('/api/v1/catalog').json()
    assert sum(c['kind'] == 'product' for c in catalog) >= 8
    quests = [c for c in catalog if c['kind'] == 'quest']
    assert len(quests) >= 6 and len({q['data']['topic'] for q in quests}) == 3
    assert 'correct' not in quests[0]['data']['choices'][0]
    p.send('quests/answer', quest_id='budget_1', choice_id='missing', status=422)
    p.send('quests/answer', quest_id='budget_1', choice_id='spend')
    assert p.state['balance']['wallet'] == 0
    p.send('quests/answer', quest_id='budget_1', choice_id='plan', status=409)
    p.send('quests/answer', quest_id='budget_2', choice_id='no')
    assert p.state['balance']['wallet'] == 10


def test_sync_atomic_and_replay(client):
    p = Player(client)
    first = p.payload(action='income')
    second = p.payload(action='purchase', product_id='castle', expected_revision=1)
    response = client.post('/api/v1/sync', headers=p.headers, json={'commands': [first, second]})
    assert response.status_code == 409
    assert client.get('/api/v1/state', headers=p.headers).json()['balance']['wallet'] == 0
    assert client.get('/api/v1/transactions', headers=p.headers).json() == []
    second['product_id'] = 'food'
    response = client.post('/api/v1/sync', headers=p.headers, json={'commands': [first, second]})
    assert response.status_code == 200, response.text
    again = client.post('/api/v1/sync', headers=p.headers, json={'commands': [first, second]})
    assert again.json() == response.json()
    assert response.json()['state']['balance']['wallet'] == 80


def test_auth_isolation_gate_and_real_period(client):
    assert client.get('/api/v1/state').status_code == 401
    p, other = Player(client, demo=False), Player(client)
    p.send('income')
    p.send('budget', method='put', required=40, wanted=20, savings=40)
    p.send('periods/advance', status=409)
    assert client.get('/api/v1/state', headers=other.headers).json()['balance']['wallet'] == 0
    p.adult()
    stolen = {**other.headers, 'X-Adult-Token': p.headers['X-Adult-Token']}
    assert client.get('/api/v1/adult/progress', headers=stolen).status_code == 403
    c = client.post('/api/v1/adult/challenge', headers=p.headers).json()
    for _ in range(4):
        assert client.post('/api/v1/adult/unlock', headers=p.headers, json={'challenge_id': c['challenge_id'], 'answer': 0}).status_code == 403


def test_customization_and_goal_preserve_savings(client):
    p = Player(client)
    p.send('pet', method='put', pet={'name': 'Финни', 'body': 'fox', 'color': 'peach', 'accessory': 'hat'})
    p.send('income')
    p.send('savings/deposit', amount=50)
    p.send('goal', method='put', goal_id='goal_trip')
    assert p.state['pet']['body'] == 'fox' and p.state['goal']['target'] == 300
    assert p.state['balance']['savings'] == 50
