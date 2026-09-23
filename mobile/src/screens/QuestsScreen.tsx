import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, MoneyInput, Page, ui } from '../components/GameUI';
import { useGameStore } from '../store/gameStore';
import { ACTIVITIES } from '../game/engine';
import { QUESTS } from '../constants/quests';
import { QUEST_THEME_LABELS } from '../types/quest';

export default function QuestsScreen() {
  const game = useGameStore(s => s.game)!;
  const dispatch = useGameStore(s => s.dispatch);
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [basket, setBasket] = useState<string[]>([]);
  const [budget, setBudget] = useState(['', '', '']);
  const quest = QUESTS.find(q => q.id === selected);
  const activity = selected ? ACTIVITIES[selected] : undefined;
  const attempt = selected ? game.attempts[selected] : undefined;
  const submit = (answer: string) => { if (selected) void dispatch({ type: 'quest', questId: selected, answer }); };
  return <Page title="📚 Задания">
    <Text style={ui.text}>Пройдено {Object.keys(game.attempts).length} из 6. Награда выдаётся один раз за верное решение.</Text>
    {!quest ? QUESTS.map(q => <Card key={q.id}>
      <Text style={ui.muted}>{QUEST_THEME_LABELS[q.theme]}</Text>
      <Text style={ui.heading}>{ACTIVITIES[q.id]?.title ?? q.title}</Text>
      <Button title={game.attempts[q.id] ? 'Посмотреть результат' : `Начать · награда ${q.reward.money} монет`} onPress={() => {
        setSelected(q.id); setAmount(''); setBasket([]); setBudget(['', '', '']);
      }} />
    </Card>) : <>
      <Button title="← Все задания" onPress={() => setSelected(null)} />
      <Card>
        <Text style={ui.heading}>{activity?.title ?? quest.title}</Text>
        <Text style={ui.text}>{activity?.instruction ?? quest.story}</Text>
        {attempt ? <>
          <Text style={ui.heading}>{attempt.correct ? '✓ Верно!' : 'Попробуем разобраться'}</Text>
          <Text style={ui.text}>{attempt.feedback}</Text><Text style={ui.text}>Награда: {attempt.reward} монет.</Text>
        </> : game.period.closed ? <Text style={ui.text}>Демо завершено. Новую игру можно начать в разделе родителя.</Text> : <>
          {activity?.kind === 'saving' && <><MoneyInput label="Монет в неделю" value={amount} onChange={setAmount} /><Button title="Проверить план" onPress={() => submit(amount)} /></>}
          {activity?.kind === 'basket' && <>
            {[['food', 'Еда', 20], ['water', 'Вода', 10], ['toy', 'Игрушка', 30]].map(([id, title, price]) => <Button key={id} title={`${basket.includes(String(id)) ? '✓ Убрать' : '+ Добавить'}: ${title} · ${price}`} onPress={() => setBasket(basket.includes(String(id)) ? basket.filter(i => i !== id) : [...basket, String(id)])} />)}
            <Text style={ui.text}>В корзине: {basket.reduce((sum, id) => sum + ({ food: 20, water: 10, toy: 30 }[id] ?? 0), 0)} / 35 монет</Text>
            <Button title="Проверить корзину" onPress={() => submit(basket.join(','))} />
          </>}
          {activity?.kind === 'budget' && <>
            {['Обязательное', 'Желаемое', 'Накопления'].map((label, index) => <MoneyInput key={label} label={label} value={budget[index]} onChange={value => setBudget(budget.map((v, i) => i === index ? value : v))} />)}
            <Button title="Проверить распределение" onPress={() => submit(budget.join(','))} />
          </>}
          {!activity && quest.choices.map(choice => <Button key={choice.id} title={choice.text} onPress={() => submit(choice.id)} />)}
        </>}
      </Card>
    </>}
  </Page>;
}
