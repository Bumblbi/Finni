// src/screens/ShopScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useProfileStore, usePetStore, useBudgetStore } from '../store';
import { ShopItem } from '../components/ShopItem';
import { ShopProduct, MANDATORY_PRODUCTS, OPTIONAL_PRODUCTS } from '../constants/shop';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadows,
  TouchTarget,
} from '../constants/theme';

export default function ShopScreen() {
  const balance = useProfileStore((s) => s.balance);
  const currentPeriod = useProfileStore((s) => s.currentPeriod);
  const subtractFromBalance = useProfileStore((s) => s.subtractFromBalance);
  const addToSavings = useProfileStore((s) => s.addToSavings);
  const addMood = usePetStore((s) => s.addMood);
  const addSatiety = usePetStore((s) => s.addSatiety);
  const recordPurchase = useBudgetStore((s) => s.recordPurchase);

  // Modal state
  const [noMoneyModal, setNoMoneyModal] = useState<ShopProduct | null>(null);
  const [purchaseModal, setPurchaseModal] = useState<ShopProduct | null>(null);

  const handleBuy = (product: ShopProduct) => {
    if (balance < product.price) {
      setNoMoneyModal(product);
      return;
    }
    // Confirm & purchase
    const success = subtractFromBalance(product.price);
    if (!success) return;

    // Apply effects
    if (product.moodDelta) addMood(product.moodDelta);
    if (product.satietyDelta) addSatiety(product.satietyDelta);

    // Record in budget
    const category =
      product.category === 'mandatory' ? 'mandatory' : 'desired';
    recordPurchase(category, product.price, product.name, currentPeriod);

    setPurchaseModal(product);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>🛒 Магазин</Text>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceIcon}>💰</Text>
            <Text style={styles.balanceText}>{balance} ₽</Text>
          </View>
        </View>

        {/* ── Tip Banner ───────────────────────────────────────────────────── */}
        <View style={styles.tipBanner}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Сначала купи необходимое, потом — желаемое!
          </Text>
        </View>

        {/* ── Mandatory Products ───────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>🥗 Обязательные</Text>
        <Text style={styles.sectionSub}>
          Влияют на сытость Финни. Покупай их каждый период!
        </Text>
        {MANDATORY_PRODUCTS.map((p) => (
          <ShopItem
            key={p.id}
            product={p}
            canAfford={balance >= p.price}
            onBuy={handleBuy}
          />
        ))}

        {/* ── Optional Products ────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
          🎮 Желаемые
        </Text>
        <Text style={styles.sectionSub}>
          Поднимают настроение. Покупай, если остались деньги!
        </Text>
        {OPTIONAL_PRODUCTS.map((p) => (
          <ShopItem
            key={p.id}
            product={p}
            canAfford={balance >= p.price}
            onBuy={handleBuy}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── "No money" Educational Modal ────────────────────────────────── */}
      <Modal
        visible={!!noMoneyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setNoMoneyModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>😢</Text>
            <Text style={styles.modalTitle}>Денег не хватает</Text>
            {noMoneyModal && (
              <>
                <Text style={styles.modalText}>
                  Ты хочешь купить{' '}
                  <Text style={styles.bold}>{noMoneyModal.name}</Text> за{' '}
                  <Text style={styles.bold}>{noMoneyModal.price} ₽</Text>, но у тебя
                  есть только{' '}
                  <Text style={[styles.bold, { color: Colors.red }]}>
                    {balance} ₽
                  </Text>
                  .
                </Text>

                <View style={styles.lessonCard}>
                  <Text style={styles.lessonTitle}>💡 Что делать?</Text>
                  <Text style={styles.lessonText}>
                    1. Подожди следующего периода — придут новые деньги.
                    {'\n'}2. Пересмотри бюджет — может, можно меньше потратить
                    на желаемое?{'\n'}3. Копи — откладывай понемногу каждый
                    период!
                  </Text>
                </View>

                <Text style={styles.lessonTip}>{noMoneyModal.tip}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setNoMoneyModal(null)}
              accessibilityLabel="Понятно, закрыть"
              accessibilityRole="button"
            >
              <Text style={styles.modalBtnText}>Понятно!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Purchase Success Modal ───────────────────────────────────────── */}
      <Modal
        visible={!!purchaseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPurchaseModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {purchaseModal && (
              <>
                <Text style={styles.modalEmoji}>{purchaseModal.emoji}</Text>
                <Text style={styles.modalTitle}>Куплено!</Text>
                <Text style={styles.modalText}>{purchaseModal.tip}</Text>
                <View style={styles.effectsRow}>
                  {purchaseModal.satietyDelta > 0 && (
                    <View style={styles.effectBadge}>
                      <Text style={styles.effectText}>
                        🍽 Сытость +{purchaseModal.satietyDelta}
                      </Text>
                    </View>
                  )}
                  {purchaseModal.moodDelta > 0 && (
                    <View style={[styles.effectBadge, styles.effectBadgePurple]}>
                      <Text style={[styles.effectText, { color: Colors.purple }]}>
                        😊 Настроение +{purchaseModal.moodDelta}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setPurchaseModal(null)}
              accessibilityLabel="Закрыть"
              accessibilityRole="button"
            >
              <Text style={styles.modalBtnText}>Здорово!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgMain },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.lg,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: 10,
  },
  screenTitle: {
    fontSize: Typography.sizeLG,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'sans-serif-rounded',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mintLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.tag,
    gap: 4,
  },
  balanceIcon: { fontSize: 16 },
  balanceText: {
    fontSize: Typography.sizeMD,
    color: Colors.mint,
    fontWeight: '800',
  },

  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowLight,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tipIcon: { fontSize: 18 },
  tipText: {
    flex: 1,
    fontSize: Typography.sizeSM,
    color: Colors.yellow,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xxxl,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xxxl,
    alignItems: 'center',
    ...Shadows.cardStrong,
  },
  modalEmoji: { fontSize: 56, marginBottom: Spacing.md },
  modalTitle: {
    fontSize: Typography.sizeXL,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  bold: { fontWeight: '700', color: Colors.textPrimary },
  lessonCard: {
    backgroundColor: Colors.mintLight,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  lessonTitle: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.mint,
    marginBottom: 6,
  },
  lessonText: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  lessonTip: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  effectsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  effectBadge: {
    backgroundColor: Colors.mintLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.tag,
  },
  effectBadgePurple: {
    backgroundColor: Colors.purpleLight,
  },
  effectText: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.mint,
  },
  modalBtn: {
    backgroundColor: Colors.mint,
    borderRadius: Radius.button,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  modalBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizeMD,
    fontWeight: '800',
  },
});
