import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Page, ui } from '../components/GameUI';
import { useGameStore } from '../store/gameStore';

export default function ParentScreen() {
  const game = useGameStore(s => s.game)!;
  const reset = useGameStore(s => s.reset);
  const [unlocked, setUnlocked] = useState(false);
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [challenge, setChallenge] = useState({ a: 17, b: 8 });
  useFocusEffect(React.useCallback(() => {
    setUnlocked(false); setAnswer(''); setWrong(false); setConfirmReset(false);
    setChallenge({ a: 10 + Math.floor(Math.random() * 20), b: 5 + Math.floor(Math.random() * 15) });
    return () => { setUnlocked(false); setConfirmReset(false); };
  }, []));
  const earned = game.transactions.reduce((s, t) => s + Math.max(0, t.wallet - Math.max(0, -t.savings)), 0);
  if (!unlocked) return <Page title="🔒 Для родителей"><Card>
    <Text style={ui.text}>Для входа решите пример: {challenge.a} + {challenge.b}</Text>
    <TextInput accessibilityLabel="Ответ на пример" keyboardType="number-pad" value={answer} onChangeText={setAnswer} style={ui.input} />
    <Button title="Войти" onPress={() => { if (Number(answer) === challenge.a + challenge.b) setUnlocked(true); else setWrong(true); }} />
    {wrong && <Text accessibilityRole="alert" style={ui.error}>Ответ не совпал. Попробуйте ещё раз.</Text>}
  </Card></Page>;
  return <Page title="👤 Для родителей">
    <Card>
      <Text style={ui.heading}>{game.name} · {game.demo ? 'Демонстрационный режим' : 'Обычный режим'}</Text>
      <Text style={ui.text}>Получено: {earned} монет. В кошельке: {game.wallet}. Накоплено: {game.savings}.</Text>
      <Text style={ui.text}>Периодов завершено: {game.history.length}. Успешных: {game.history.filter(p => p.successful).length}.</Text>
      <Text style={ui.text}>Заданий: {Object.keys(game.attempts).length} / 6. Верных решений: {Object.values(game.attempts).filter(a => a.correct).length}.</Text>
      <Text style={ui.muted}>Профиль хранится на этом устройстве. Демо: пять периодов без ожидания. Обычный режим: не менее 24 часов на период.</Text>
      <Text style={ui.text}>Обсудите с ребёнком: что было необходимым, что могло подождать и как регулярные накопления приближают цель.</Text>
    </Card>
    <Button title="Начать заново" onPress={() => setConfirmReset(true)} />
    {confirmReset && <Card>
      <Text accessibilityRole="alert" style={ui.text}>Удалить текущий игровой прогресс? После сброса можно выбрать обычный или демонстрационный режим.</Text>
      <Button title="Да, сбросить прогресс" onPress={() => { void reset(); }} />
      <Button title="Отмена" onPress={() => setConfirmReset(false)} />
    </Card>}
    <Button title="Закрыть родительский раздел" onPress={() => { setUnlocked(false); setAnswer(''); setConfirmReset(false); }} />
  </Page>;
}
