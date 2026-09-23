// src/types/navigation.ts
import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Bottom Tab Navigator ────────────────────────────────────────────────────
export type TabParamList = {
  Dashboard: undefined;
  Budget: undefined;
  Shop: undefined;
  Quests: undefined;
  Parent: undefined;
};

// ─── Root Stack Navigator ────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  Savings: undefined;
  Progress: undefined;
  Help: undefined;
};
