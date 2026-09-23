import React from 'react';
import { Text } from 'react-native';
import { Button, Card, Page, ui } from '../components/GameUI';
import { useGameStore } from '../store/gameStore';
import { SHOP_PRODUCTS } from '../constants/shop';

export default function ShopScreen() {
  const game = useGameStore(s => s.game)!;
  const dispatch = useGameStore(s => s.dispatch);
  return <Page title="🛒 Магазин">
    <Text style={ui.heading}>В кошельке: {game.wallet} монет</Text>
    <Text accessibilityLiveRegion="polite" style={ui.text}>{game.feedback}</Text>
    {!game.period.plan && <Text style={ui.text}>Перед покупкой сохрани бюджет периода.</Text>}
    {SHOP_PRODUCTS.map(p => <Card key={p.id}>
      <Text style={ui.heading}>{p.emoji} {p.name} · {p.price} монет</Text>
      <Text style={ui.muted}>{p.category === 'mandatory' ? 'Обязательное' : 'Желаемое'} · Сытость +{p.satietyDelta} · Настроение +{p.moodDelta}</Text>
      <Text style={ui.text}>{p.tip}</Text>
      <Button title={game.wallet < p.price ? `Не хватает ${p.price - game.wallet} монет` : `Купить: ${p.price} монет`}
        disabled={game.period.closed || !game.period.plan || game.wallet < p.price}
        onPress={() => { void dispatch({ type: 'purchase', productId: p.id }); }} />
    </Card>)}
  </Page>;
}
