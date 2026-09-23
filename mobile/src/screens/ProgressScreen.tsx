import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, Page, ui } from '../components/GameUI';
import { useGameStore } from '../store/gameStore';
import { GROWTH_STAGE_LABELS } from '../types/pet';
import { goalProgress } from '../game/engine';

export default function ProgressScreen() {
  const game = useGameStore(s => s.game)!;
  const goal = goalProgress(game);
  const [limit, setLimit] = useState(30);
  return <Page title="🌱 Прогресс и история">
    <Card>
      <Text style={ui.heading}>{GROWTH_STAGE_LABELS[game.pet.growthStage]}</Text>
      <Text style={ui.text}>Успешных периодов: {game.history.filter(p => p.successful).length}. Для подростка нужно 2, для мастера — 4.</Text>
      <Text style={ui.text}>Завершено периодов: {game.history.length}{game.demo ? ' / 5' : ''}. Заданий: {Object.keys(game.attempts).length} / 6.</Text>
      <Text style={ui.text}>{goal ? `${goal.title}: ${game.savings} / ${goal.target}` : 'Цель ещё не выбрана.'}</Text>
    </Card>
    {[...game.history].reverse().map(result => <Card key={result.period.number}>
      <Text style={ui.heading}>Период {result.period.number} · {result.successful ? '✓ План выполнен' : 'Есть чему научиться'}</Text>
      <Text style={ui.text}>Обязательное: {result.period.mandatory} / {result.period.plan?.mandatory}</Text>
      <Text style={ui.text}>Желаемое: {result.period.desired} / {result.period.plan?.desired}</Text>
      <Text style={ui.text}>Чистые накопления: {result.period.saved - result.period.withdrawn} / {result.period.plan?.savings}</Text>
      <Text style={ui.muted}>Факт / план. Пополнено {result.period.saved}, снято {result.period.withdrawn}.</Text>
      <Text style={ui.text}>Настроение {signed(result.moodDelta)} · Сытость {signed(result.satietyDelta)} · Дисциплина {signed(result.disciplineDelta)}</Text>
      {result.stageAfter > result.stageBefore && <Text style={ui.heading}>🎉 Финни вырос благодаря успешным периодам!</Text>}
      {result.reasons.map(reason => <Text key={reason} style={ui.text}>{reason}</Text>)}
    </Card>)}
    {game.history.length === 0 && <Text style={ui.text}>Заверши первый период, чтобы увидеть результат.</Text>}
    <Text style={ui.heading}>Движение монет</Text>
    {[...game.transactions].reverse().slice(0, limit).map(t => <Card key={t.id}>
      <Text style={ui.text}>Период {t.period} · {t.label}</Text>
      <Text style={ui.muted}>Кошелёк: {signed(t.wallet)} · Копилка: {signed(t.savings)}</Text>
    </Card>)}
    {game.transactions.length > limit && <Button title="Показать ещё" onPress={() => setLimit(limit + 30)} />}
  </Page>;
}
function signed(n: number) { return n > 0 ? '+' + n : String(n); }
