import React from 'react';
import { Text, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types/navigation';
import { useGameStore } from '../store/gameStore';
import { Button, Card, Page, ui } from '../components/GameUI';
import { PetAvatar } from '../components/PetAvatar';
import { ACTIVITIES, goalProgress } from '../game/engine';
import { QUESTS } from '../constants/quests';

export default function DashboardScreen({ navigation }: BottomTabScreenProps<TabParamList, 'Dashboard'>) {
  const game = useGameStore(s => s.game)!;
  const dispatch = useGameStore(s => s.dispatch);
  const goal = goalProgress(game);
  const active = QUESTS.find(q => !game.attempts[q.id]);
  const closed = game.period.closed;
  return <Page title={`Привет, ${game.name}! 👋`}>
    <Text style={ui.muted}>{game.demo ? 'Демо · ' : ''}Период {game.period.number}{game.demo ? ' из 5' : ''}{closed ? ' · завершён' : ''}</Text>
    <Card>
      <View style={{ alignItems: 'center' }}><PetAvatar pet={game.pet} /></View>
      <Text style={ui.text}>😊 Настроение: {game.pet.mood}/100 · 🍎 Сытость: {game.pet.satiety}/100</Text>
      <Text style={ui.text}>Дисциплина: {game.pet.discipline}/100</Text>
      <Text style={ui.heading}>💰 {game.wallet} монет · 🐷 {game.savings} в копилке</Text>
    </Card>
    <Card>
      <Text style={ui.heading}>{goal ? `${goal.emoji} ${goal.title}` : 'Выбери свою первую цель'}</Text>
      <Text style={ui.text}>{goal ? `${game.savings} / ${goal.target} монет · ${goal.percent}%` : 'На что будет копить Финни?'}</Text>
      {goal?.remaining === 0 && <Text style={ui.text}>🎉 Цель достигнута! Монеты остаются в копилке.</Text>}
      <Button title="Открыть копилку" onPress={() => navigation.getParent()?.navigate('Savings')} />
    </Card>
    {!closed && !game.period.incomeClaimed && <Button title="Получить 100 монет нового периода" onPress={() => { void dispatch({ type: 'income' }); }} />}
    <Card>
      <Text style={ui.heading}>{closed ? 'Пять периодов пройдены!' : 'Что дальше?'}</Text>
      <Text style={ui.text}>{closed ? 'Посмотри, чему ты научился и как вырос Финни.' : !goal ? 'Выбери цель, затем составь бюджет.' : !game.period.plan ? 'Распредели монеты: необходимое, желаемое и накопления.' : 'Купи необходимое, отложи по плану и заверши период.'}</Text>
      <Button title="Бюджет" onPress={() => navigation.navigate('Budget')} />
      <Button title="Покупки" onPress={() => navigation.navigate('Shop')} />
      <Button title={active ? `Задание: ${ACTIVITIES[active.id]?.title ?? active.title}` : 'Все задания пройдены'} onPress={() => navigation.navigate('Quests')} />
      {!closed && <Button title="Завершить период и посмотреть результат" onPress={async () => {
        if (await dispatch({ type: 'advance' })) navigation.getParent()?.navigate('Progress');
      }} />}
      <Button title="Прогресс и история" onPress={() => navigation.getParent()?.navigate('Progress')} />
      <Button title="Словарик" onPress={() => navigation.getParent()?.navigate('Help')} />
    </Card>
    <Text accessibilityLiveRegion="polite" style={ui.text}>{game.feedback}</Text>
  </Page>;
}
