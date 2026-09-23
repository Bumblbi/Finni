// src/store/budgetStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncStore } from './syncStore';
import {
  BudgetPlan,
  BudgetActual,
  Transaction,
  BudgetStats,
  Period,
} from '../types/budget';

interface BudgetStoreState {
  plan: BudgetPlan;
  actual: BudgetActual;
  transactions: Transaction[];
  /** История планов по периодам */
  periodHistory: Array<{
    period: Period;
    plan: BudgetPlan;
    actual: BudgetActual;
  }>;
}

interface BudgetStoreActions {
  setPlan: (plan: BudgetPlan) => void;
  recordPurchase: (
    category: 'mandatory' | 'desired' | 'savings',
    amount: number,
    label: string,
    period: Period,
  ) => void;
  closePeriod: (period: Period) => void;
  getStats: () => BudgetStats;
  resetBudget: () => void;
}

const defaultPlan: BudgetPlan = {
  income: 500,
  mandatory: 150,
  desired: 200,
  savings: 100,
};

const defaultActual: BudgetActual = {
  mandatory: 0,
  desired: 0,
  savings: 0,
};

export const useBudgetStore = create<BudgetStoreState & BudgetStoreActions>()(
  persist(
    (set, get) => ({
      plan: defaultPlan,
      actual: defaultActual,
      transactions: [],
      periodHistory: [],

      setPlan: (plan) => {
        set({ plan, actual: defaultActual });
        useSyncStore.getState().enqueue({
          action: 'budget',
          required: plan.mandatory,
          wanted: plan.desired,
          savings: plan.savings,
        });
      },

      recordPurchase: (category, amount, label, period) =>
        set((s) => ({
          actual: {
            ...s.actual,
            [category]: s.actual[category] + amount,
          },
          transactions: [
            ...s.transactions,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              category,
              amount,
              label,
              timestamp: Date.now(),
              period,
            },
          ],
        })),

      closePeriod: (period) =>
        set((s) => ({
          periodHistory: [
            ...s.periodHistory,
            { period, plan: s.plan, actual: s.actual },
          ],
          actual: defaultActual,
        })),

      getStats: (): BudgetStats => {
        const { periodHistory, plan, actual } = get();
        const allPeriods = [
          ...periodHistory,
          { period: 0 as Period, plan, actual },
        ];
        const totalEarned = allPeriods.reduce(
          (sum, p) => sum + p.plan.income,
          0,
        );
        const totalSaved = allPeriods.reduce(
          (sum, p) => sum + p.actual.savings,
          0,
        );
        const totalSpent = allPeriods.reduce(
          (sum, p) => sum + p.actual.mandatory + p.actual.desired,
          0,
        );
        const overBudgetCount = allPeriods.filter(
          (p) =>
            p.actual.mandatory + p.actual.desired + p.actual.savings >
            p.plan.income,
        ).length;

        return {
          totalEarned,
          totalSaved,
          totalSpent,
          savingsRate: totalEarned > 0 ? Math.round((totalSaved / totalEarned) * 100) : 0,
          periodsCompleted: periodHistory.length,
          overBudgetCount,
        };
      },

      resetBudget: () =>
        set({
          plan: defaultPlan,
          actual: defaultActual,
          transactions: [],
          periodHistory: [],
        }),
    }),
    {
      name: 'finni-budget',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
