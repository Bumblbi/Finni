// src/store/profileStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Period } from '../types/budget';

interface ProfileState {
  /** Установлен ли питомец (онбординг пройден) */
  isOnboarded: boolean;
  /** Имя питомца */
  petName: string;
  /** Текущий доступный баланс */
  balance: number;
  /** Всего накоплено за все периоды */
  totalSavings: number;
  /** Текущий игровой период (1-5) */
  currentPeriod: Period;
  /** Доход на текущий период */
  periodIncome: number;
  /** Демо-режим активен */
  isDemoMode: boolean;
  /** API Access Token */
  accessToken: string | null;
  /** Local Revision for sync */
  revision: number;
  /** Local Epoch for sync */
  epoch: number;
}

interface ProfileActions {
  completeOnboarding: (petName: string, accessToken: string | null, revision: number, epoch: number) => void;
  setBalance: (amount: number) => void;
  addToBalance: (amount: number) => void;
  subtractFromBalance: (amount: number) => boolean; // returns false if insufficient
  addToSavings: (amount: number) => void;
  advancePeriod: () => void;
  setPeriodIncome: (income: number) => void;
  toggleDemoMode: () => void;
  resetAll: () => void;
}

import { api } from '../api';

const INITIAL_INCOME = 500; // Стартовый доход на период (в рублях игрового мира)

const initialState: ProfileState = {
  isOnboarded: false,
  petName: '',
  balance: INITIAL_INCOME,
  totalSavings: 0,
  currentPeriod: 1,
  periodIncome: INITIAL_INCOME,
  isDemoMode: false,
  accessToken: null,
  revision: 1,
  epoch: 1,
};

export const useProfileStore = create<ProfileState & ProfileActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeOnboarding: (petName, accessToken, revision, epoch) =>
        set({ isOnboarded: true, petName, balance: INITIAL_INCOME, accessToken, revision, epoch }),

      setBalance: (amount) => set({ balance: Math.max(0, amount) }),

      addToBalance: (amount) =>
        set((s) => ({ balance: s.balance + amount })),

      subtractFromBalance: (amount) => {
        const { balance } = get();
        if (balance < amount) return false;
        set({ balance: balance - amount });
        return true;
      },

      addToSavings: (amount) =>
        set((s) => ({ totalSavings: s.totalSavings + amount })),

      advancePeriod: () => {
        set((s) => {
          const next = Math.min(5, s.currentPeriod + 1) as Period;
          return {
            currentPeriod: next,
            balance: s.periodIncome, // новый период — новый доход
          };
        });
        import('./syncStore').then(({ useSyncStore }) => {
          useSyncStore.getState().enqueue({ action: 'advance' });
        });
      },

      setPeriodIncome: (income) => set({ periodIncome: income }),

      toggleDemoMode: () => set((s) => ({ isDemoMode: !s.isDemoMode })),

      resetAll: () => set(initialState),
    }),
    {
      name: 'finni-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
