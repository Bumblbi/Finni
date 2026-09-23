import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, MoneyInput, Page, ui } from '../components/GameUI';
import { useGameStore } from '../store/gameStore';

export default function BudgetScreen() {
  const game = useGameStore(s => s.game)!;
  const dispatch = useGameStore(s => s.dispatch);
  const [mandatory, setMandatory] = useState('50');
  const [desired, setDesired] = useState('30');
  const [savings, setSavings] = useState('20');
  useEffect(() => { setMandatory('50'); setDesired('30'); setSavings('20'); }, [game.period.number]);
  const p = game.period;
  return <Page title="💰 Мой бюджет">
    <Text style={ui.text}>Период {p.number} · В кошельке {game.wallet} монет</Text>
    {!p.incomeClaimed && <Button title="Получить доход: 100 монет" onPress={() => { void dispatch({ type: 'income' }); }} />}
    {p.plan ? <Card>
      <Text style={ui.heading}>План сохранён</Text>
      <Text style={ui.text}>Обязательное: {p.mandatory} / {p.plan.mandatory}</Text>
      <Text style={ui.text}>Желаемое: {p.desired} / {p.plan.desired}</Text>
      <Text style={ui.text}>Чистые накопления: {p.saved - p.withdrawn} / {p.plan.savings}</Text>
      <Text style={ui.muted}>Слева — факт, справа — план. План не переводит монеты в копилку автоматически.</Text>
    </Card> : <Card>
      <Text style={ui.heading}>Распредели монеты</Text>
      <MoneyInput label="Обязательные расходы" value={mandatory} onChange={setMandatory} />
      <MoneyInput label="Желаемые расходы" value={desired} onChange={setDesired} />
      <MoneyInput label="Накопления" value={savings} onChange={setSavings} />
      <Text style={ui.text}>Остаток вне плана: {game.wallet - Number(mandatory) - Number(desired) - Number(savings)} монет</Text>
      <Button title="Сохранить план периода" disabled={!p.incomeClaimed || p.closed} onPress={() => {
        void dispatch({ type: 'budget', plan: { mandatory: mandatory.trim() ? Number(mandatory) : NaN,
          desired: desired.trim() ? Number(desired) : NaN, savings: savings.trim() ? Number(savings) : NaN } });
      }} />
    </Card>}
    <Text accessibilityLiveRegion="polite" style={ui.text}>{game.feedback}</Text>
  </Page>;
}
