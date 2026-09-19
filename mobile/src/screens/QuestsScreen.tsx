// src/screens/QuestsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useQuestStore, usePetStore, useProfileStore } from '../store';
import { Quest, QuestChoice, QUEST_RESULT_CONFIG, QUEST_THEME_LABELS } from '../types/quest';
import { QUESTS } from '../constants/quests';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadows,
  TouchTarget,
} from '../constants/theme';

type ScreenState =
  | { mode: 'list' }
  | { mode: 'detail'; quest: Quest }
  | { mode: 'result'; quest: Quest; choice: QuestChoice };

export default function QuestsScreen() {
  const [screen, setScreen] = useState<ScreenState>({ mode: 'list' });
  const { statuses, completeQuest, isCompleted, getChoiceId } = useQuestStore();
  const addMood = usePetStore((s) => s.addMood);
  const addSatiety = usePetStore((s) => s.addSatiety);
  const addGrowthPoints = usePetStore((s) => s.addGrowthPoints);
  const addToBalance = useProfileStore((s) => s.addToBalance);
  const completedCount = useQuestStore((s) => s.getCompletedCount)();

  const handleChooseAnswer = (quest: Quest, choice: QuestChoice) => {
    if (!isCompleted(quest.id)) {
      completeQuest(quest.id, choice.id);
      addMood(choice.moodDelta);
      addSatiety(choice.satietyDelta);
      addGrowthPoints(choice.growthPoints + quest.reward.growthPoints);
      if (quest.reward.money > 0) {
        addToBalance(quest.reward.money);
      }
      if (choice.moneyDelta !== 0) {
        addToBalance(choice.moneyDelta);
      }
    }
    setScreen({ mode: 'result', quest, choice });
  };

  // ── List View ────────────────────────────────────────────────────────────
  if (screen.mode === 'list') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.screenTitle}>📚 Задания</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {completedCount}/{QUESTS.length}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.totalProgressCard}>
            <Text style={styles.totalProgressLabel}>
              Выполнено заданий
            </Text>
            <View style={styles.totalProgressTrack}>
              <View
                style={[
                  styles.totalProgressFill,
                  { width: `${(completedCount / QUESTS.length) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.totalProgressSub}>
              {completedCount === QUESTS.length
                ? '🏆 Все задания пройдены!'
                : `Осталось ${QUESTS.length - completedCount} заданий`}
            </Text>
          </View>

          {/* Quest list */}
          {QUESTS.map((quest) => {
            const done = isCompleted(quest.id);
            const choiceId = getChoiceId(quest.id);
            const choice = done
              ? quest.choices.find((c) => c.id === choiceId)
              : undefined;

            return (
              <TouchableOpacity
                key={quest.id}
                style={[styles.questCard, done && styles.questCardDone]}
                onPress={() =>
                  done && choice
                    ? setScreen({ mode: 'result', quest, choice })
                    : setScreen({ mode: 'detail', quest })
                }
                accessibilityLabel={`${quest.title}. ${done ? 'Выполнено' : 'Начать задание'}`}
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <View style={styles.questCardLeft}>
                  <View
                    style={[
                      styles.themeTag,
                      { backgroundColor: done ? Colors.mintLight : Colors.purpleLight },
                    ]}
                  >
                    <Text style={styles.themeTagText}>
                      {QUEST_THEME_LABELS[quest.theme]}
                    </Text>
                  </View>
                  <Text style={styles.questCardTitle}>{quest.title}</Text>
                  <Text style={styles.questCardReward}>
                    🌟 +{quest.reward.growthPoints} очков  💰 +{quest.reward.money}₽
                  </Text>
                </View>
                <View style={styles.questCardRight}>
                  {done ? (
                    <View style={styles.doneCircle}>
                      <Text style={styles.doneEmoji}>✅</Text>
                    </View>
                  ) : (
                    <View style={styles.startCircle}>
                      <Text style={styles.startArrow}>→</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Detail View (quest question) ──────────────────────────────────────────
  if (screen.mode === 'detail') {
    const { quest } = screen;
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setScreen({ mode: 'list' })}
            accessibilityLabel="Назад к списку заданий"
            accessibilityRole="button"
          >
            <Text style={styles.backBtnText}>← Назад</Text>
          </TouchableOpacity>

          {/* Story card */}
          <View style={styles.storyCard}>
            <View
              style={[
                styles.storyThemeTag,
                { backgroundColor: Colors.purpleLight },
              ]}
            >
              <Text style={styles.storyThemeText}>
                {QUEST_THEME_LABELS[quest.theme]}
              </Text>
            </View>
            <Text style={styles.storyTitle}>{quest.title}</Text>
            <Text style={styles.storyText}>{quest.story}</Text>
          </View>

          {/* Choices */}
          <Text style={styles.choicePrompt}>Что сделаешь?</Text>
          {quest.choices.map((choice) => (
            <TouchableOpacity
              key={choice.id}
              style={styles.choiceBtn}
              onPress={() => handleChooseAnswer(quest, choice)}
              accessibilityLabel={choice.text}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.choiceBtnText}>{choice.text}</Text>
            </TouchableOpacity>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Result View ───────────────────────────────────────────────────────────
  if (screen.mode === 'result') {
    const { quest, choice } = screen;
    const config = QUEST_RESULT_CONFIG[choice.result];

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Result card */}
          <View style={[styles.resultCard, { borderTopColor: config.color }]}>
            <Text style={styles.resultEmoji}>{config.icon}</Text>
            <Text style={[styles.resultTitle, { color: config.color }]}>
              {config.label}
            </Text>
            <Text style={styles.resultChoice}>{choice.text}</Text>
          </View>

          {/* Explanation */}
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>💡 Объяснение</Text>
            <Text style={styles.explanationText}>{choice.explanation}</Text>
          </View>

          {/* Effects */}
          <View style={styles.effectsCard}>
            <Text style={styles.effectsTitle}>Что изменилось:</Text>
            <View style={styles.effectsGrid}>
              {choice.moodDelta !== 0 && (
                <View style={[
                  styles.effectChip,
                  { backgroundColor: choice.moodDelta > 0 ? Colors.purpleLight : Colors.redLight },
                ]}>
                  <Text style={[
                    styles.effectChipText,
                    { color: choice.moodDelta > 0 ? Colors.purple : Colors.red },
                  ]}>
                    😊 {choice.moodDelta > 0 ? '+' : ''}{choice.moodDelta}
                  </Text>
                </View>
              )}
              {choice.satietyDelta !== 0 && (
                <View style={[
                  styles.effectChip,
                  { backgroundColor: choice.satietyDelta > 0 ? Colors.mintLight : Colors.redLight },
                ]}>
                  <Text style={[
                    styles.effectChipText,
                    { color: choice.satietyDelta > 0 ? Colors.mint : Colors.red },
                  ]}>
                    🍽 {choice.satietyDelta > 0 ? '+' : ''}{choice.satietyDelta}
                  </Text>
                </View>
              )}
              {choice.growthPoints > 0 && (
                <View style={[styles.effectChip, { backgroundColor: Colors.yellowLight }]}>
                  <Text style={[styles.effectChipText, { color: Colors.yellow }]}>
                    ⭐ +{choice.growthPoints} опыта
                  </Text>
                </View>
              )}
              {choice.moneyDelta !== 0 && (
                <View style={[
                  styles.effectChip,
                  { backgroundColor: choice.moneyDelta > 0 ? Colors.mintLight : Colors.redLight },
                ]}>
                  <Text style={[
                    styles.effectChipText,
                    { color: choice.moneyDelta > 0 ? Colors.mint : Colors.red },
                  ]}>
                    💰 {choice.moneyDelta > 0 ? '+' : ''}{choice.moneyDelta}₽
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Reward */}
          <View style={styles.rewardCard}>
            <Text style={styles.rewardTitle}>🎁 Награда за задание</Text>
            <Text style={styles.rewardText}>
              +{quest.reward.growthPoints} очков роста · +{quest.reward.money}₽
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backListBtn}
            onPress={() => setScreen({ mode: 'list' })}
            accessibilityLabel="Вернуться к заданиям"
            accessibilityRole="button"
          >
            <Text style={styles.backListBtnText}>← К заданиям</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgMain },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.lg,
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
    fontSize: Typography.sizeLG,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'sans-serif-rounded',
  },
  progressBadge: {
    backgroundColor: Colors.mint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.tag,
  },
  progressBadgeText: {
    color: Colors.textWhite,
    fontWeight: '800',
    fontSize: Typography.sizeSM,
  },

  // Total progress
  totalProgressCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  totalProgressLabel: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  totalProgressTrack: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: Radius.circle,
    overflow: 'hidden',
    marginBottom: 6,
  },
  totalProgressFill: {
    height: '100%',
    backgroundColor: Colors.mint,
    borderRadius: Radius.circle,
  },
  totalProgressSub: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
  },

  // Quest card (list)
  questCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.card,
  },
  questCardDone: {
    opacity: 0.75,
    borderWidth: 1.5,
    borderColor: Colors.mint,
  },
  questCardLeft: { flex: 1, gap: 4 },
  questCardRight: { marginLeft: Spacing.md },
  themeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.tag,
    marginBottom: 4,
  },
  themeTagText: {
    fontSize: Typography.sizeXS,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  questCardTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  questCardReward: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  doneCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneEmoji: { fontSize: 20 },
  startCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  startArrow: {
    color: Colors.textWhite,
    fontSize: 18,
    fontWeight: '700',
  },

  // Back button
  backBtn: {
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
    paddingRight: Spacing.xl,
  },
  backBtnText: {
    fontSize: Typography.sizeSM,
    color: Colors.mint,
    fontWeight: '700',
  },

  // Story card
  storyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  storyThemeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.tag,
    marginBottom: Spacing.sm,
  },
  storyThemeText: {
    fontSize: Typography.sizeXS,
    fontWeight: '700',
    color: Colors.purple,
  },
  storyTitle: {
    fontSize: Typography.sizeXL,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  storyText: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  choicePrompt: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  choiceBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    minHeight: TouchTarget.min,
    justifyContent: 'center',
    ...Shadows.card,
  },
  choiceBtnText: {
    fontSize: Typography.sizeSM,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Result
  resultCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    borderTopWidth: 4,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  resultEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  resultTitle: {
    fontSize: Typography.sizeXL,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  resultChoice: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  explanationCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  explanationTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  explanationText: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  effectsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  effectsTitle: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  effectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  effectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.tag,
  },
  effectChipText: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
  },

  rewardCard: {
    backgroundColor: Colors.yellowLight,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: Colors.yellow,
    marginBottom: 4,
  },
  rewardText: {
    fontSize: Typography.sizeSM,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  backListBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  backListBtnText: {
    color: Colors.mint,
    fontSize: Typography.sizeMD,
    fontWeight: '700',
  },
});
