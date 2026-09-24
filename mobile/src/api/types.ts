// src/api/types.ts

/**
 * API types synchronized with backend schemas.
 * These types match the FastAPI backend models for profile, state, and sync.
 */

// Типы для профиля
export interface Appearance {
  name: string;
  body_color: 'brown' | 'orange' | 'gray';
  accessory: 'none' | 'glasses' | 'hat' | 'bow';
  outfit: 'hoodie_teal' | 'hoodie_pink' | 'hoodie_yellow';
}

export interface ProfileCreate {
  nickname: string;
  pet: Appearance;
  demo: boolean;
}

// Типы состояния
export interface PetState extends Appearance {
  mood: number;
  satiety: number;
  stage: number;
}

export interface BalanceState {
  wallet: number;
  savings: number;
}

export interface PeriodState {
  number: number;
  income_claimed: boolean;
  plan: { required: number; wanted: number; savings: number } | null;
  spent_required: number;
  spent_wanted: number;
  saved: number;
  withdrawn: number;
  closed: boolean;
}

export interface GoalState {
  id: string;
  title: string;
  target: number;
  progress: number;
  achieved: boolean;
  estimated_periods: number | null;
}

export interface State {
  profile_id: string;
  nickname: string;
  demo: boolean;
  revision: number;
  epoch: number;
  pet: PetState;
  balance: BalanceState;
  period: PeriodState;
  goal: GoalState | null;
  completed_quests: string[];
}

export interface ProfileCreated {
  access_token: string;
  token_type: string;
  state: State;
}

export interface CommandResult {
  operation_id: string;
  feedback: string;
  state: State;
}

export interface SyncResult {
  results: CommandResult[];
  state: State;
}

export interface SyncRequest {
  commands: ApiCommand[];
}

// Каталог
export interface CatalogItem {
  id: string;
  kind: string;
  data: Record<string, unknown>;
}

// API-формат команд (с revision/epoch/operation_id)
export interface ApiCommandBase {
  operation_id: string;
  expected_revision: number;
  epoch: number;
}

export type ApiCommand = ApiCommandBase & (
  | { action: 'income' }
  | { action: 'budget'; required: number; wanted: number; savings: number }
  | { action: 'purchase'; product_id: string; quantity: number }
  | { action: 'deposit'; amount: number }
  | { action: 'withdraw'; amount: number; confirmed: true }
  | { action: 'goal'; goal_id: string }
  | { action: 'quest'; quest_id: string; choice_id: string }
  | { action: 'advance' }
  | { action: 'customize'; pet: Appearance }
);
