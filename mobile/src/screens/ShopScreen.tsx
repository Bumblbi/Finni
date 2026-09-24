import React, { useState } from 'react';
import { Modal, Text, View, StyleSheet } from 'react-native';
import { Button, Card, Page, ui } from '../components/GameUI';
import { useGameStore } from '../store/gameStore';
import { SHOP_PRODUCTS, ShopProduct } from '../constants/shop';
import { Colors } from '../constants/theme';

export default function ShopScreen() {
  const game = useGameStore(s => s.game)!;
  const dispatch = useGameStore(s => s.dispatch);
  const [selected, setSelected] = useState<ShopProduct | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    void dispatch({ type: 'purchase', productId: selected.id });
    setSelected(null);
  };

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
        onPress={() => setSelected(p)} />
    </Card>)}

    {/* Модалка подтверждения покупки */}
    <Modal
      visible={selected !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setSelected(null)}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {selected && <>
            <Text style={styles.modalEmoji}>{selected.emoji}</Text>
            <Text style={styles.modalTitle}>{selected.name}</Text>
            <Text style={styles.modalPrice}>{selected.price} монет</Text>

            <View style={styles.divider} />

            <View style={styles.effectRow}>
              <Text style={styles.effectLabel}>Категория:</Text>
              <Text style={styles.effectValue}>
                {selected.category === 'mandatory' ? '🥗 Обязательное' : '🎮 Желаемое'}
              </Text>
            </View>
            {selected.satietyDelta > 0 && (
              <View style={styles.effectRow}>
                <Text style={styles.effectLabel}>Сытость:</Text>
                <Text style={styles.effectValue}>+{selected.satietyDelta}</Text>
              </View>
            )}
            {selected.moodDelta > 0 && (
              <View style={styles.effectRow}>
                <Text style={styles.effectLabel}>Настроение:</Text>
                <Text style={styles.effectValue}>+{selected.moodDelta}</Text>
              </View>
            )}

            <View style={styles.balanceInfo}>
              <Text style={ui.muted}>
                После покупки в кошельке: {game.wallet - selected.price} монет
              </Text>
            </View>

            <View style={styles.divider} />

            <Button title="Купить" onPress={handleConfirm} />
            <Button title="Отмена" onPress={() => setSelected(null)} />
          </>}
        </View>
      </View>
    </Modal>
  </Page>;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.bgCard,
    borderRadius: 28,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    gap: 10,
    alignItems: 'center',
  },
  modalEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.mint,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
    marginVertical: 6,
  },
  effectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  effectLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  effectValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  balanceInfo: {
    marginTop: 4,
    alignItems: 'center',
  },
});
