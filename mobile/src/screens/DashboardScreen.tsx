// src/screens/DashboardScreen.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../types/navigation';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useProfileStore, usePetStore, useQuestStore } from '../store';
import { PetAvatar } from '../components/PetAvatar';
import { ProgressBar } from '../components/ProgressBar';
import { FloatingBadge } from '../components/FloatingBadge';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadows,
  TouchTarget,
} from '../constants/theme';
import { QUESTS } from '../constants/quests';

type Props = BottomTabScreenProps<TabParamList, 'Dashboard'>;

interface ActionButtonProps {
  emoji: string;
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  emoji,
  label,
  sublabel,
  color,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.actionBtn}
    onPress={onPress}
    accessibilityLabel={`${label} — ${sublabel}`}
    accessibilityRole="button"
    activeOpacity={0.75}
  >
    <View style={[styles.actionIconBox, { backgroundColor: `${color}18` }]}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
    <Text style={styles.actionSublabel}>{sublabel}</Text>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }: Props) {
  const petName = useProfileStore((s) => s.petName);
  const balance = useProfileStore((s) => s.balance);
  const totalSavings = useProfileStore((s) => s.totalSavings);
  const currentPeriod = useProfileStore((s) => s.currentPeriod);
  const addMood = usePetStore((s) => s.addMood);
  const addSatiety = usePetStore((s) => s.addSatiety);
  const addEnergy = usePetStore((s) => s.addEnergy);
  const pet = usePetStore((s) => s);
  const questsCompleted = useQuestStore((s) => s.getCompletedCount)();
  const totalQuests = QUESTS.length;

  // Найти первый незавершённый квест
  const questStatuses = useQuestStore((s) => s.statuses);
  const activeQuest = QUESTS.find(
    (q) => !questStatuses.find((s) => s.questId === q.id)?.completed
  );

  const handleFeed = useCallback(() => {
    addSatiety(10);
    addMood(5);
  }, []);
  const handlePlay = useCallback(() => {
    addMood(15);
    addEnergy(-5);
  }, []);
  const handleLearn = useCallback(() => {
    addEnergy(10);
    addMood(5);
  }, []);
  const handleSleep = useCallback(() => {
    addEnergy(25);
    addSatiety(-5);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Привет,</Text>
            <Text style={styles.petNameText}>{petName || 'Финни'} 👋</Text>
          </View>
          <View style={styles.moodBadge}>
            <Text style={styles.moodBadgeIcon}>😊</Text>
            <Text style={styles.moodBadgeText}>
              {pet.mood > 70 ? 'Доволен' : pet.mood > 40 ? 'Обычно' : 'Грустит'}
            </Text>
          </View>
        </View>

        {/* ── Balance Cards Row ───────────────────────────────────────────── */}
        <View style={styles.balanceRow}>
          {/* Баланс */}
          <View style={[styles.balanceCard, styles.balanceCardMint]}>
            <Text style={styles.balanceCardIcon}>💰</Text>
            <Text style={styles.balanceCardLabel}>Баланс</Text>
            <Text style={styles.balanceCardValue}>{balance} ₽</Text>
          </View>

          {/* Копилка */}
          <View style={[styles.balanceCard, styles.balanceCardPink]}>
            <Text style={styles.balanceCardIcon}>🐷</Text>
            <Text style={styles.balanceCardLabel}>Копилка</Text>
            <Text style={[styles.balanceCardValue, { color: Colors.pink }]}>
              {totalSavings} ₽
            </Text>
          </View>

          {/* Период */}
          <View style={[styles.balanceCard, styles.balanceCardPurple]}>
            <Text style={styles.balanceCardIcon}>📅</Text>
            <Text style={styles.balanceCardLabel}>Период</Text>
            <Text style={[styles.balanceCardValue, { color: Colors.purple }]}>
              {currentPeriod} / 5
            </Text>
          </View>
        </View>

        {/* ── Hero: Pet + Floating Badges ────────────────────────────────── */}
        <View style={styles.heroContainer}>
          {/* Фон градиент-заглушка */}
          <View style={styles.heroBg} />

          {/* Парящие бейджи */}
          <FloatingBadge
            emoji="😊"
            label="Настроение"
            value={`${pet.mood}%`}
            color={Colors.purple}
            style={{ left: -10, top: 40, transform: [{ rotate: '-4deg' }] }}
          />
          <FloatingBadge
            emoji="🍽️"
            label="Сытость"
            value={`${pet.satiety}%`}
            color={Colors.mint}
            style={{ right: 10, top: 120, transform: [{ rotate: '5deg' }] }}
          />

          {/* Питомец */}
          <PetAvatar pet={pet} size="large" animated />
        </View>

        {/* ── Action Bar (наезжает на Hero) ──────────────────────────────── */}
        <View style={styles.actionBar}>
          <View style={styles.actionsCard}>
            <ActionButton
              emoji="🍎"
              label="Покормить"
              sublabel="+сытость"
              color={Colors.mint}
              onPress={handleFeed}
            />
            <ActionButton
              emoji="🎮"
              label="Играть"
              sublabel="+настроение"
              color={Colors.purple}
              onPress={handlePlay}
            />
            <ActionButton
              emoji="📚"
              label="Учиться"
              sublabel="+энергия"
              color={Colors.yellow}
              onPress={handleLearn}
            />
            <ActionButton
              emoji="💤"
              label="Спать"
              sublabel="+восст."
              color={Colors.purpleLight}
              onPress={handleSleep}
            />
          </View>
        </View>

        {/* ── Stats Card ──────────────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 Состояние Финни</Text>
          <ProgressBar
            label="Настроение"
            value={pet.mood}
            color={Colors.purple}
            icon="😊"
          />
          <ProgressBar
            label="Сытость"
            value={pet.satiety}
            color={Colors.mint}
            icon="🍽️"
          />
          <ProgressBar
            label="Энергия"
            value={pet.energy}
            color={Colors.yellow}
            icon="⚡"
          />
          <ProgressBar
            label="Дисциплина"
            value={pet.discipline}
            color={Colors.pink}
            icon="🎯"
          />
        </View>

        {/* ── Active Quest Card ────────────────────────────────────────────── */}
        {activeQuest && (
          <TouchableOpacity
            style={styles.questCard}
            onPress={() => (navigation as any).navigate('Quests')}
            accessibilityLabel={`Активное задание: ${activeQuest.title}. Нажми чтобы открыть.`}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <View style={styles.questHeader}>
              <Text style={styles.questEmoji}>📋</Text>
              <View style={styles.questInfo}>
                <Text style={styles.questLabel}>Активное задание</Text>
                <Text style={styles.questTitle}>{activeQuest.title}</Text>
              </View>
              <View style={styles.questProgress}>
                <Text style={styles.questProgressText}>
                  {questsCompleted}/{totalQuests}
                </Text>
                <Text style={styles.questArrow}>→</Text>
              </View>
            </View>
            <Text style={styles.questStory} numberOfLines={2}>
              {activeQuest.story}
            </Text>
          </TouchableOpacity>
        )}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenH,
    paddingTop: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 0,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  petNameText: {
    fontSize: Typography.sizeLG,
    color: Colors.textPrimary,
    fontWeight: '800',
    fontFamily: 'sans-serif-rounded',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purpleLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.tag,
    gap: 6,
  },
  moodBadgeIcon: { fontSize: 16 },
  moodBadgeText: {
    fontSize: Typography.sizeSM,
    color: Colors.purple,
    fontWeight: '700',
  },

  // Balance row
  balanceRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.sm + 4,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    ...Shadows.card,
  },
  balanceCardMint: { borderTopWidth: 3, borderTopColor: Colors.mint },
  balanceCardPink: { borderTopWidth: 3, borderTopColor: Colors.pink },
  balanceCardPurple: { borderTopWidth: 3, borderTopColor: Colors.purple },
  balanceCardIcon: { fontSize: 18 },
  balanceCardLabel: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  balanceCardValue: {
    fontSize: Typography.sizeMD,
    color: Colors.mint,
    fontWeight: '800',
  },

  // Hero
  heroContainer: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -Spacing.screenH,
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(103, 216, 175, 0.07)',
    borderRadius: Radius.card,
  },

  // Action Bar
  actionBar: {
    marginTop: -30,
    zIndex: 10,
    marginBottom: Spacing.lg,
  },
  actionsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...Shadows.cardStrong,
  },
  actionBtn: {
    alignItems: 'center',
    minWidth: TouchTarget.action,
    gap: 4,
  },
  actionIconBox: {
    width: TouchTarget.action,
    height: TouchTarget.action,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: {
    fontSize: Typography.sizeXS,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionSublabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Stats card
  statsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Quest card
  questCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.mint,
    ...Shadows.card,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  questEmoji: { fontSize: 24 },
  questInfo: { flex: 1 },
  questLabel: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  questTitle: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  questProgress: {
    alignItems: 'center',
  },
  questProgressText: {
    fontSize: Typography.sizeXS,
    color: Colors.mint,
    fontWeight: '700',
  },
  questArrow: {
    fontSize: 18,
    color: Colors.mint,
  },
  questStory: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
