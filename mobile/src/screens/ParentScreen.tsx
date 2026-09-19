// src/screens/ParentScreen.tsx
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import {
  useProfileStore,
  usePetStore,
  useBudgetStore,
  useQuestStore,
} from '../store';
import { clearAllData } from '../utils/storage';
import { GROWTH_STAGE_LABELS } from '../types/pet';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadows,
  TouchTarget,
} from '../constants/theme';

// ── Math challenge for access guard ──────────────────────────────────────────
function generateMathChallenge(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 20) + 5;
  const b = Math.floor(Math.random() * 15) + 5;
  const ops: Array<{ question: string; answer: number }> = [
    { question: `${a} + ${b}`, answer: a + b },
    { question: `${a} - ${b}`, answer: a - b },
    { question: `${Math.min(a, b)} × 2`, answer: Math.min(a, b) * 2 },
  ];
  return ops[Math.floor(Math.random() * ops.length)]!;
}

const HOLD_DURATION_MS = 3000;

export default function ParentScreen() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mathChallenge] = useState(generateMathChallenge);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [wrongAttempt, setWrongAttempt] = useState(false);

  // Hold-to-enter animation
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isHolding, setIsHolding] = useState(false);

  // Generate answer options (correct + 2 wrong)
  const answerOptions = React.useMemo(() => {
    const correct = mathChallenge.answer;
    const opts = new Set<number>([correct]);
    while (opts.size < 3) {
      const off = Math.floor(Math.random() * 10) - 5;
      if (off !== 0) opts.add(correct + off);
    }
    return Array.from(opts).sort(() => Math.random() - 0.5);
  }, [mathChallenge.answer]);

  const handlePressIn = useCallback(() => {
    setIsHolding(true);
    holdProgress.setValue(0);
    holdAnimRef.current = Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    });
    holdAnimRef.current.start(({ finished }) => {
      if (finished) {
        setIsUnlocked(true);
      }
      setIsHolding(false);
    });
  }, []);

  const handlePressOut = useCallback(() => {
    holdAnimRef.current?.stop();
    Animated.timing(holdProgress, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsHolding(false);
  }, []);

  const handleAnswer = (answer: number) => {
    setSelectedAnswer(answer);
    if (answer === mathChallenge.answer) {
      setIsUnlocked(true);
    } else {
      setWrongAttempt(true);
      setTimeout(() => {
        setSelectedAnswer(null);
        setWrongAttempt(false);
      }, 1500);
    }
  };

  // ── Stats data ────────────────────────────────────────────────────────────
  const petName = useProfileStore((s) => s.petName);
  const currentPeriod = useProfileStore((s) => s.currentPeriod);
  const isDemoMode = useProfileStore((s) => s.isDemoMode);
  const toggleDemoMode = useProfileStore((s) => s.toggleDemoMode);
  const advancePeriod = useProfileStore((s) => s.advancePeriod);
  const resetAll = useProfileStore((s) => s.resetAll);
  const resetPet = usePetStore((s) => s.resetPet);
  const resetBudget = useBudgetStore((s) => s.resetBudget);
  const resetQuests = useQuestStore((s) => s.resetQuests);
  const getStats = useBudgetStore((s) => s.getStats);
  const completedQuests = useQuestStore((s) => s.getCompletedCount)();
  const pet = usePetStore();
  const stats = getStats();

  const arcLength = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleReset = () => {
    Alert.alert(
      '⚠️ Сброс данных',
      'Весь прогресс будет удалён. Приложение вернётся к началу. Уверены?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            resetAll();
            resetPet();
            resetBudget();
            resetQuests();
            await clearAllData();
          },
        },
      ]
    );
  };

  // ── Lock Screen ───────────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
        <View style={styles.lockScreen}>
          <Text style={styles.lockTitle}>👤 Для взрослых</Text>
          <Text style={styles.lockSub}>
            Это раздел только для родителей
          </Text>

          {/* Hold button */}
          <View style={styles.holdContainer}>
            <Text style={styles.holdLabel}>
              Удерживай 3 секунды для входа:
            </Text>

            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              accessibilityLabel="Удерживай для входа в родительский раздел"
              accessibilityRole="button"
            >
              <View style={styles.holdBtnOuter}>
                {/* Progress arc (simulated with border) */}
                <Animated.View
                  style={[
                    styles.holdProgressRing,
                    {
                      borderColor: isHolding ? Colors.mint : Colors.border,
                    },
                  ]}
                />
                <View style={styles.holdBtnInner}>
                  <Text style={styles.holdBtnEmoji}>
                    {isHolding ? '⏳' : '🔒'}
                  </Text>
                  <Text style={styles.holdBtnText}>
                    {isHolding ? 'Держи...' : 'Удержать'}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* OR separator */}
          <Text style={styles.orText}>— или реши пример —</Text>

          {/* Math challenge */}
          <View style={styles.mathCard}>
            <Text style={styles.mathQuestion}>{mathChallenge.question} = ?</Text>
            <View style={styles.mathOptions}>
              {answerOptions.map((opt) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === mathChallenge.answer;
                const bg: string = isSelected
                  ? isCorrect ? Colors.mint : Colors.red
                  : Colors.bgCard;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.mathOption, { backgroundColor: bg }]}
                    onPress={() => handleAnswer(opt)}
                    accessibilityLabel={`Ответ ${opt}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.mathOptionText,
                        isSelected && { color: Colors.textWhite },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {wrongAttempt && (
              <Text
                style={styles.wrongText}
                accessibilityRole="alert"
              >
                ❌ Неверно! Попробуй ещё раз.
              </Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Unlocked: Stats Dashboard ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>👤 Родительский раздел</Text>
          <TouchableOpacity
            onPress={() => setIsUnlocked(false)}
            style={styles.lockBtn}
            accessibilityLabel="Закрыть раздел"
            accessibilityRole="button"
          >
            <Text style={styles.lockBtnText}>Закрыть</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Статистика {petName}</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🐣 Стадия роста</Text>
            <Text style={styles.statValue}>
              {GROWTH_STAGE_LABELS[pet.growthStage]}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>📅 Период</Text>
            <Text style={styles.statValue}>{currentPeriod} из 5</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>💰 Всего заработано</Text>
            <Text style={styles.statValue}>{stats.totalEarned} ₽</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🐷 Всего накоплено</Text>
            <Text style={[styles.statValue, { color: Colors.pink }]}>
              {stats.totalSaved} ₽
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>📈 % накоплений</Text>
            <Text style={[styles.statValue, { color: Colors.mint }]}>
              {stats.savingsRate}%
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>📚 Задания</Text>
            <Text style={styles.statValue}>{completedQuests} / 6</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>⚠️ Перерасходов</Text>
            <Text
              style={[
                styles.statValue,
                stats.overBudgetCount > 0 ? { color: Colors.red } : { color: Colors.mint },
              ]}
            >
              {stats.overBudgetCount}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>😊 Настроение</Text>
            <Text style={styles.statValue}>{pet.mood}%</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🎯 Дисциплина</Text>
            <Text style={[styles.statValue, { color: Colors.mint }]}>
              {pet.discipline}%
            </Text>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 Наблюдения</Text>
          {stats.savingsRate >= 20 && (
            <Text style={styles.insightPositive}>
              ✅ Ребёнок регулярно откладывает более 20% — отличная привычка!
            </Text>
          )}
          {stats.savingsRate > 0 && stats.savingsRate < 20 && (
            <Text style={styles.insightNeutral}>
              💬 Сбережения составляют {stats.savingsRate}%. Рекомендуем обсудить
              цель в 20%.
            </Text>
          )}
          {stats.savingsRate === 0 && (
            <Text style={styles.insightWarning}>
              ⚠️ Пока нет накоплений. Помогите ребёнку поставить цель накопить
              на что-то желанное.
            </Text>
          )}
          {stats.overBudgetCount > 0 && (
            <Text style={styles.insightWarning}>
              ⚠️ Было {stats.overBudgetCount} случаев перерасхода. Разберите
              вместе, почему так произошло.
            </Text>
          )}
          {completedQuests === 6 && (
            <Text style={styles.insightPositive}>
              🏆 Все задания пройдены! Обсудите выборы ребёнка и их последствия.
            </Text>
          )}
        </View>

        {/* Demo mode */}
        <View style={styles.controlCard}>
          <Text style={styles.controlTitle}>🎛️ Управление</Text>

          <TouchableOpacity
            style={[styles.controlBtn, isDemoMode && styles.controlBtnActive]}
            onPress={toggleDemoMode}
            accessibilityLabel={`Демо-режим: ${isDemoMode ? 'выключить' : 'включить'}`}
            accessibilityRole="button"
          >
            <Text style={styles.controlBtnText}>
              {isDemoMode ? '⏸ Выключить демо-режим' : '▶️ Включить демо-режим'}
            </Text>
          </TouchableOpacity>

          {isDemoMode && (
            <TouchableOpacity
              style={styles.advanceBtn}
              onPress={advancePeriod}
              accessibilityLabel="Перейти к следующему периоду"
              accessibilityRole="button"
            >
              <Text style={styles.advanceBtnText}>
                ⏭ Период {currentPeriod} → {Math.min(5, currentPeriod + 1)}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            accessibilityLabel="Сбросить все данные приложения"
            accessibilityRole="button"
          >
            <Text style={styles.resetBtnText}>🗑️ Сбросить все данные</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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

  // Lock screen
  lockScreen: {
    flex: 1,
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  lockTitle: {
    fontSize: Typography.size2XL,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: 'sans-serif-rounded',
  },
  lockSub: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
    textAlign: 'center',
  },

  // Hold button
  holdContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  holdLabel: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  holdBtnOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  holdProgressRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.mint,
  },
  holdBtnInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadows.card,
  },
  holdBtnEmoji: { fontSize: 36 },
  holdBtnText: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  orText: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    marginVertical: Spacing.lg,
  },

  // Math challenge
  mathCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
    ...Shadows.card,
  },
  mathQuestion: {
    fontSize: Typography.size3XL,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  mathOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  mathOption: {
    flex: 1,
    minHeight: TouchTarget.min,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  mathOptionText: {
    fontSize: Typography.sizeLG,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  wrongText: {
    marginTop: Spacing.md,
    color: Colors.red,
    fontSize: Typography.sizeSM,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: 10,
  },
  screenTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'sans-serif-rounded',
  },
  lockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.tag,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  lockBtnText: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Stats
  statsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  statsTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Insights
  insightCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  insightTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  insightPositive: {
    fontSize: Typography.sizeSM,
    color: Colors.mint,
    backgroundColor: Colors.mintLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    lineHeight: 20,
  },
  insightNeutral: {
    fontSize: Typography.sizeSM,
    color: Colors.yellow,
    backgroundColor: Colors.yellowLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    lineHeight: 20,
  },
  insightWarning: {
    fontSize: Typography.sizeSM,
    color: Colors.red,
    backgroundColor: Colors.redLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    lineHeight: 20,
  },

  // Controls
  controlCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.card,
  },
  controlTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  controlBtn: {
    backgroundColor: Colors.purpleLight,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  controlBtnActive: {
    backgroundColor: Colors.purple,
  },
  controlBtnText: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  advanceBtn: {
    backgroundColor: Colors.mint,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    ...Shadows.button,
  },
  advanceBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizeSM,
    fontWeight: '700',
  },
  resetBtn: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.red,
  },
  resetBtnText: {
    color: Colors.red,
    fontSize: Typography.sizeSM,
    fontWeight: '700',
  },
});
