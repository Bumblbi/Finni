// src/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfileStore, usePetStore } from '../store';
import { api } from '../api';
import { PET_COMBOS, PetAppearance } from '../types/pet';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadows,
  TouchTarget,
} from '../constants/theme';

const nameSchema = z.object({
  name: z
    .string()
    .min(1, 'Придумай имя питомцу!')
    .max(16, 'Имя слишком длинное (не более 16 символов)')
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ0-9\s]+$/,
      'Только буквы, цифры и пробелы',
    ),
});
type NameForm = z.infer<typeof nameSchema>;

type Step = 0 | 1 | 2 | 3;

const STEP_DATA = [
  {
    title: 'Привет! Я Финни! 👋',
    emoji: '🐣',
    text: 'Я помогу тебе научиться обращаться с деньгами — весело и без скуки!',
    subText: 'С моей помощью ты узнаешь, как правильно тратить, копить и планировать.',
    btnLabel: 'Расскажи подробнее →',
  },
  {
    title: 'Три правила денег',
    emoji: '💡',
    text: '',
    subText: '',
    btnLabel: 'Понятно! →',
  },
  {
    title: 'Создай своего Финни!',
    emoji: '',
    text: 'Выбери как будет выглядеть твой питомец:',
    subText: '',
    btnLabel: 'Далее →',
  },
  {
    title: 'Дай имя питомцу',
    emoji: '',
    text: 'Как будет зваться твой Финни?',
    subText: '',
    btnLabel: '🎉 Начать игру!',
  },
];

const RULES = [
  {
    emoji: '🥗',
    color: Colors.mint,
    title: 'Обязательное',
    desc: 'Еда, одежда, транспорт. Это нужно купить в любом случае.',
  },
  {
    emoji: '🎮',
    color: Colors.purple,
    title: 'Желаемое',
    desc: 'Игрушки, развлечения. Это здорово, но не обязательно.',
  },
  {
    emoji: '🐷',
    color: Colors.pink,
    title: 'Накопления',
    desc: 'Откладываем деньги на мечту или на потом.',
  },
];

const PET_COMBO_EMOJIS = ['🟫', '🟠', '🩶'];
const PET_ACCESSORY_EMOJIS: Record<string, string> = {
  none: '',
  glasses: '👓',
  hat: '🎩',
  bow: '🎀',
};
const PET_OUTFIT_EMOJIS: Record<string, string> = {
  hoodie_teal: '🩵',
  hoodie_pink: '🩷',
  hoodie_yellow: '💛',
};

function getPetComboEmoji(combo: PetAppearance): string {
  const color = PET_COMBO_EMOJIS[
    ['brown', 'orange', 'gray'].indexOf(combo.bodyColor)
  ] ?? '🟫';
  const acc = PET_ACCESSORY_EMOJIS[combo.accessory] ?? '';
  const outfit = PET_OUTFIT_EMOJIS[combo.outfit] ?? '';
  return `${outfit}🦆${acc}`;
}

export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>(0);
  const [selectedCombo, setSelectedCombo] = useState<number>(0);

  const completeOnboarding = useProfileStore((s) => s.completeOnboarding);
  const initPet = usePetStore((s) => s.initPet);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  });

  const nextStep = () => setStep((s) => Math.min(3, s + 1) as Step);

  const onFinish = async (data: NameForm) => {
    const appearance = PET_COMBOS[selectedCombo]!;
    initPet(data.name, appearance);
    
    let token = null;
    let rev = 1;
    let ep = 1;
    try {
      const res = await api.createProfile({
        nickname: data.name,
        pet: {
          name: data.name,
          body: appearance.bodyColor,
          color: appearance.bodyColor, // mapping for backend
          accessory: appearance.accessory,
        },
        demo: false,
      });
      token = res.access_token;
      rev = res.state.revision;
      ep = res.state.epoch;
    } catch (e) {
      console.log('Failed to create profile on backend, continuing offline', e);
    }

    completeOnboarding(data.name, token, rev, ep);
  };

  const isLastStep = step === 3;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, step === i && styles.dotActive]}
              accessibilityLabel={`Шаг ${i + 1} из 4`}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Step 0: Welcome ──────────────────────────────────────────── */}
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.heroEmoji}>{STEP_DATA[0].emoji}</Text>
              <Text style={styles.stepTitle}>{STEP_DATA[0].title}</Text>
              <Text style={styles.stepText}>{STEP_DATA[0].text}</Text>
              <Text style={styles.stepSubText}>{STEP_DATA[0].subText}</Text>
            </View>
          )}

          {/* ── Step 1: Three Rules ──────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.heroEmoji}>{STEP_DATA[1].emoji}</Text>
              <Text style={styles.stepTitle}>{STEP_DATA[1].title}</Text>
              <Text style={[styles.stepText, { marginBottom: Spacing.xl }]}>
                Деньги можно потратить тремя способами:
              </Text>
              {RULES.map((r) => (
                <View
                  key={r.title}
                  style={[styles.ruleCard, { borderLeftColor: r.color }]}
                >
                  <Text style={styles.ruleEmoji}>{r.emoji}</Text>
                  <View style={styles.ruleText}>
                    <Text style={[styles.ruleTitle, { color: r.color }]}>
                      {r.title}
                    </Text>
                    <Text style={styles.ruleDesc}>{r.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Step 2: Pet Constructor ──────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>{STEP_DATA[2].title}</Text>
              <Text style={styles.stepText}>{STEP_DATA[2].text}</Text>
              <View style={styles.comboGrid}>
                {PET_COMBOS.map((combo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.comboCard,
                      selectedCombo === index && styles.comboCardSelected,
                    ]}
                    onPress={() => setSelectedCombo(index)}
                    accessibilityLabel={`Питомец вариант ${index + 1}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedCombo === index }}
                  >
                    <Text style={styles.comboEmoji}>
                      {getPetComboEmoji(combo)}
                    </Text>
                    <Text style={styles.comboLabel}>
                      {PET_OUTFIT_EMOJIS[combo.outfit]}
                      {PET_ACCESSORY_EMOJIS[combo.accessory] || '·'}
                    </Text>
                    {selectedCombo === index && (
                      <View style={styles.selectedCheck}>
                        <Text>✅</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Step 3: Name Input ───────────────────────────────────────── */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.heroEmoji}>✏️</Text>
              <Text style={styles.stepTitle}>{STEP_DATA[3].title}</Text>
              <Text style={styles.stepText}>{STEP_DATA[3].text}</Text>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[
                        styles.nameInput,
                        errors.name && styles.nameInputError,
                      ]}
                      placeholder="Например: Фини, Рыжик, Плата..."
                      placeholderTextColor={Colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                      maxLength={16}
                      autoFocus
                      autoCorrect={false}
                      accessibilityLabel="Введи имя для питомца"
                    />
                    {errors.name && (
                      <View
                        style={styles.inputError}
                        accessibilityRole="alert"
                      >
                        <Text style={styles.inputErrorIcon}>⚠️</Text>
                        <Text style={styles.inputErrorText}>
                          {errors.name.message}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={isLastStep ? handleSubmit(onFinish) : nextStep}
            accessibilityLabel={STEP_DATA[step].btnLabel}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>{STEP_DATA[step].btnLabel}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.bgMain },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.screenH,
    paddingBottom: Spacing.xxxl,
  },

  // Progress dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.mint,
  },

  // Step content
  stepContainer: {
    paddingTop: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroEmoji: {
    fontSize: 72,
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: Typography.sizeXL,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: 'sans-serif-rounded',
  },
  stepText: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepSubText: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
  },

  // Rules
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.sm + 4,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    gap: Spacing.md,
    width: '100%',
    ...Shadows.card,
  },
  ruleEmoji: { fontSize: 28 },
  ruleText: { flex: 1 },
  ruleTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Combo grid (3x3)
  comboGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.lg,
    width: '100%',
  },
  comboCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.card,
    position: 'relative',
  },
  comboCardSelected: {
    borderColor: Colors.mint,
    borderWidth: 3,
    backgroundColor: Colors.mintLight,
  },
  comboEmoji: { fontSize: 28 },
  comboLabel: { fontSize: Typography.sizeXS, marginTop: 4 },
  selectedCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
  },

  // Name input
  inputGroup: { width: '100%', marginTop: Spacing.xl },
  nameInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.sm + 4,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    fontSize: Typography.sizeLG,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.border,
    textAlign: 'center',
    minHeight: TouchTarget.min,
    ...Shadows.card,
  },
  nameInputError: {
    borderColor: Colors.red,
  },
  inputError: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  inputErrorIcon: { fontSize: 14 },
  inputErrorText: {
    color: Colors.red,
    fontSize: Typography.sizeSM,
    fontWeight: '600',
    flex: 1,
  },

  // Next button
  nextBtn: {
    backgroundColor: Colors.mint,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.button,
  },
  nextBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizeMD,
    fontWeight: '800',
  },
});
