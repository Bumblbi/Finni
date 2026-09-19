// src/screens/BudgetScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useProfileStore, useBudgetStore, usePetStore } from '../store';
import { BudgetSlider } from '../components/BudgetSlider';
import { ProgressBar } from '../components/ProgressBar';
import {
  budgetPlanSchema,
  BudgetPlanForm,
  calcUnallocated,
  calcPercent,
  isOverBudget,
} from '../utils/budgetValidation';
import {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadows,
  TouchTarget,
} from '../constants/theme';

export default function BudgetScreen() {
  const periodIncome = useProfileStore((s) => s.periodIncome);
  const currentPeriod = useProfileStore((s) => s.currentPeriod);
  const storedPlan = useBudgetStore((s) => s.plan);
  const storedActual = useBudgetStore((s) => s.actual);
  const setPlan = useBudgetStore((s) => s.setPlan);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<BudgetPlanForm>({
    resolver: zodResolver(budgetPlanSchema),
    defaultValues: {
      income: periodIncome,
      mandatory: storedPlan.mandatory,
      desired: storedPlan.desired,
      savings: storedPlan.savings,
    },
  });

  const watchedMandatory = watch('mandatory') ?? 0;
  const watchedDesired = watch('desired') ?? 0;
  const watchedSavings = watch('savings') ?? 0;

  const unallocated = calcUnallocated(
    periodIncome,
    watchedMandatory,
    watchedDesired,
    watchedSavings
  );

  const totalAllocated = watchedMandatory + watchedDesired + watchedSavings;
  const overBudget = isOverBudget(
    watchedMandatory,
    watchedDesired,
    watchedSavings,
    periodIncome,
  );

  const onSavePlan = (data: BudgetPlanForm) => {
    setPlan({
      income: periodIncome,
      mandatory: data.mandatory,
      desired: data.desired,
      savings: data.savings,
    });
    setShowSuccessModal(true);
  };

  const totalActual = storedActual.mandatory + storedActual.desired + storedActual.savings;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgMain} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>💰 Мой бюджет</Text>
          <View style={styles.periodTag}>
            <Text style={styles.periodText}>Период {currentPeriod}</Text>
          </View>
        </View>

        {/* ── Income Card ─────────────────────────────────────────────────── */}
        <View style={styles.incomeCard}>
          <View>
            <Text style={styles.incomeLabel}>Доход на период</Text>
            <Text style={styles.incomeValue}>{periodIncome} ₽</Text>
          </View>
          <View style={styles.incomeRight}>
            <Text style={styles.incomeIcon}>💵</Text>
          </View>
        </View>

        {/* ── Unallocated Banner ───────────────────────────────────────────── */}
        <View
          style={[
            styles.unallocatedBanner,
            overBudget ? styles.unallocatedError : styles.unallocatedOk,
          ]}
          accessibilityRole="alert"
          accessibilityLabel={
            overBudget
              ? `Превышение на ${Math.abs(unallocated)} рублей`
              : `Нераспределено ${unallocated} рублей`
          }
        >
          <Text style={styles.unallocatedIcon}>{overBudget ? '⚠️' : '✅'}</Text>
          <View style={styles.unallocatedText}>
            <Text style={[
              styles.unallocatedMain,
              { color: overBudget ? Colors.red : Colors.mint },
            ]}>
              {overBudget
                ? `Перерасход на ${totalAllocated - periodIncome} ₽!`
                : `Нераспределено: ${unallocated} ₽`}
            </Text>
            <Text style={styles.unallocatedSub}>
              {overBudget
                ? 'Уменьши одну из категорий'
                : unallocated === 0
                ? 'Весь доход распределён!'
                : 'Можно распределить ещё'}
            </Text>
          </View>
        </View>

        {/* ── Budget Sliders ───────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>📋 Распредели доход</Text>

        <Controller
          control={control}
          name="mandatory"
          render={({ field: { value, onChange } }) => (
            <BudgetSlider
              label="Обязательные расходы"
              emoji="🥗"
              color={Colors.mint}
              value={value ?? 0}
              maxValue={periodIncome}
              onChange={onChange}
              description="Еда, транспорт, необходимые вещи"
              errorMessage={errors.mandatory?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="desired"
          render={({ field: { value, onChange } }) => (
            <BudgetSlider
              label="Желаемое"
              emoji="🎮"
              color={Colors.purple}
              value={value ?? 0}
              maxValue={periodIncome}
              onChange={onChange}
              description="Игрушки, развлечения, хотелки"
              errorMessage={errors.desired?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="savings"
          render={({ field: { value, onChange } }) => (
            <BudgetSlider
              label="Накопления"
              emoji="🐷"
              color={Colors.pink}
              value={value ?? 0}
              maxValue={periodIncome}
              onChange={onChange}
              description="Откладываем на мечту!"
              errorMessage={errors.savings?.message}
            />
          )}
        />

        {/* Global form error */}
        {(errors as any)._total && (
          <View style={styles.globalError} accessibilityRole="alert">
            <Text style={styles.globalErrorIcon}>⚠️</Text>
            <Text style={styles.globalErrorText}>
              {(errors as any)._total?.message}
            </Text>
          </View>
        )}

        {/* ── Allocation summary ───────────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>📊 Итог распределения</Text>
          <ProgressBar
            label="Обязательные"
            value={calcPercent(watchedMandatory, periodIncome)}
            color={Colors.mint}
            icon="🥗"
          />
          <ProgressBar
            label="Желаемое"
            value={calcPercent(watchedDesired, periodIncome)}
            color={Colors.purple}
            icon="🎮"
          />
          <ProgressBar
            label="Накопления"
            value={calcPercent(watchedSavings, periodIncome)}
            color={Colors.pink}
            icon="🐷"
          />
        </View>

        {/* ── Actual Spending Card ─────────────────────────────────────────── */}
        <View style={styles.actualCard}>
          <Text style={styles.sectionTitle}>💳 Фактические траты</Text>
          <View style={styles.actualRow}>
            <Text style={styles.actualLabel}>🥗 Обязательные</Text>
            <Text style={styles.actualValue}>{storedActual.mandatory} ₽</Text>
          </View>
          <View style={styles.actualRow}>
            <Text style={styles.actualLabel}>🎮 Желаемое</Text>
            <Text style={styles.actualValue}>{storedActual.desired} ₽</Text>
          </View>
          <View style={styles.actualRow}>
            <Text style={styles.actualLabel}>🐷 Накопления</Text>
            <Text style={styles.actualValue}>{storedActual.savings} ₽</Text>
          </View>
          <View style={[styles.actualRow, styles.actualRowTotal]}>
            <Text style={styles.actualTotalLabel}>Итого потрачено</Text>
            <Text style={styles.actualTotalValue}>{totalActual} ₽</Text>
          </View>
        </View>

        {/* ── Save Button ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, overBudget && styles.saveBtnDisabled]}
          onPress={handleSubmit(onSavePlan)}
          disabled={overBudget}
          accessibilityLabel={overBudget ? 'Сохранить план — недоступно, есть перерасход' : 'Сохранить план бюджета'}
          accessibilityRole="button"
          accessibilityState={{ disabled: overBudget }}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            {overBudget ? '⚠️ Исправь перерасход' : '✅ Сохранить план'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Success Modal ─────────────────────────────────────────────────── */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>План сохранён!</Text>
            <Text style={styles.modalText}>
              Отличная работа! Ты распределил свои деньги по трём корзинкам.
              Придерживайся плана — и Финни будет счастлив!
            </Text>
            {watchedSavings > 0 && (
              <View style={styles.modalTip}>
                <Text style={styles.modalTipText}>
                  💡 Ты откладываешь {calcPercent(watchedSavings, periodIncome)}% в копилку.{' '}
                  {calcPercent(watchedSavings, periodIncome) >= 20
                    ? 'Супер! Это как у настоящего финансиста!'
                    : 'Постарайся откладывать хотя бы 20%!'}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowSuccessModal(false)}
              accessibilityLabel="Закрыть"
              accessibilityRole="button"
            >
              <Text style={styles.modalBtnText}>Понятно!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
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
  periodTag: {
    backgroundColor: Colors.mintLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.tag,
  },
  periodText: {
    fontSize: Typography.sizeSM,
    color: Colors.mint,
    fontWeight: '700',
  },

  // Income card
  incomeCard: {
    backgroundColor: Colors.mint,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.button,
  },
  incomeLabel: {
    fontSize: Typography.sizeSM,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  incomeValue: {
    fontSize: Typography.size2XL,
    fontWeight: '800',
    color: Colors.textWhite,
  },
  incomeRight: {},
  incomeIcon: { fontSize: 36 },

  // Unallocated banner
  unallocatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.sm + 4,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  unallocatedOk: { backgroundColor: Colors.mintLight },
  unallocatedError: { backgroundColor: Colors.redLight },
  unallocatedIcon: { fontSize: 22 },
  unallocatedText: { flex: 1 },
  unallocatedMain: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
  },
  unallocatedSub: {
    fontSize: Typography.sizeXS,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Section title
  sectionTitle: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Global error
  globalError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redLight,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  globalErrorIcon: { fontSize: 18 },
  globalErrorText: {
    color: Colors.red,
    fontSize: Typography.sizeSM,
    fontWeight: '600',
    flex: 1,
  },

  // Summary card
  summaryCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },

  // Actual spending card
  actualCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  actualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actualRowTotal: {
    borderBottomWidth: 0,
    marginTop: Spacing.sm,
  },
  actualLabel: {
    fontSize: Typography.sizeSM,
    color: Colors.textSecondary,
  },
  actualValue: {
    fontSize: Typography.sizeSM,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actualTotalLabel: {
    fontSize: Typography.sizeMD,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actualTotalValue: {
    fontSize: Typography.sizeMD,
    fontWeight: '800',
    color: Colors.mint,
  },

  // Save button
  saveBtn: {
    backgroundColor: Colors.mint,
    borderRadius: Radius.button,
    minHeight: TouchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.button,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.border,
  },
  saveBtnText: {
    color: Colors.textWhite,
    fontSize: Typography.sizeMD,
    fontWeight: '800',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenH,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.card,
    padding: Spacing.xxxl,
    alignItems: 'center',
    width: '100%',
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
  modalTip: {
    backgroundColor: Colors.mintLight,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  modalTipText: {
    fontSize: Typography.sizeSM,
    color: Colors.mint,
    fontWeight: '600',
    textAlign: 'center',
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
