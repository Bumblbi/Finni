import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, MoneyInput, Page, ui } from '../components/GameUI';
import { useGameStore } from '../store/gameStore';
import { GOALS, goalProgress } from '../game/engine';

export default function SavingsScreen() {
  const game = useGameStore(s => s.game)!;
  const dispatch = useGameStore(s => s.dispatch);
  const [amount, setAmount] = useState('20');
  const [withdrawal, setWithdrawal] = useState<number | null>(null);
  const goal = goalProgress(game);
  return <Page title="🐷 Копилка">
    <Card>
      <Text style={ui.heading}>{game.savings} монет в копилке</Text>
      <Text style={ui.text}>В кошельке: {game.wallet} монет</Text>
      {goal && <>
        <Text style={ui.heading}>{goal.emoji} {goal.title}</Text>
        <Text style={ui.text}>{game.savings} / {goal.target} · {goal.percent}% · Осталось: {goal.remaining}</Text>
        <Text style={ui.muted}>{goal.remaining === 0 ? '🎉 Цель достигнута! Можно выбрать новую.' : goal.estimate === null ? 'Сделай первое пополнение, чтобы увидеть прогноз.' : `При таком среднем темпе осталось примерно ${goal.estimate} периодов.`}</Text>
      </>}
    </Card>
    <Card>
      <Text style={ui.heading}>Выбор цели</Text>
      {GOALS.map(g => <Button key={g.id} title={`${g.emoji} ${g.title} · ${g.target}${game.goalId === g.id ? ' ✓' : ''}`}
        disabled={game.period.closed || game.goalId === g.id} onPress={() => { void dispatch({ type: 'goal', goalId: g.id }); }} />)}
      <Text style={ui.muted}>При смене цели все накопления сохраняются.</Text>
    </Card>
    {!game.period.closed && <Card>
      <MoneyInput label="Сумма в монетах" value={amount} onChange={value => { setAmount(value); setWithdrawal(null); }} />
      <Button title="Отложить монеты" onPress={() => { setWithdrawal(null); void dispatch({ type: 'deposit', amount: Number(amount) }); }} />
      <Button title="Забрать из копилки" onPress={() => setWithdrawal(Number(amount))} />
      {withdrawal !== null && <>
        <Text accessibilityRole="alert" style={ui.text}>Вернуть {withdrawal} монет в кошелёк? Накоплений станет меньше, а достижение цели может отложиться.</Text>
        <Button title="Подтверждаю снятие" onPress={async () => {
          if (await dispatch({ type: 'withdraw', amount: withdrawal, confirmed: true })) setWithdrawal(null);
        }} />
        <Button title="Оставить в копилке" onPress={() => setWithdrawal(null)} />
      </>}
    </Card>}
    <Text accessibilityLiveRegion="polite" style={ui.text}>{game.feedback}</Text>
  </Page>;
}
