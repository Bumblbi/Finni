// src/api/types.ts

// Типы для профиля
export interface Appearance {
  name: string;
  body: 'cat' | 'fox' | 'bunny' | string; // На бэке cat/fox/bunny, но у нас утконос. Пока оставим как строка
  color: 'mint' | 'peach' | 'lavender' | string;
  accessory: 'none' | 'bow' | 'hat' | string;
}

export interface ProfileCreate {
  nickname: string;
  pet: Appearance;
  demo: boolean;
}

// Типы состояния
export interface PetState {
  name: string;
  body: string;
  color: string;
  accessory: string;
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
  plan: Record<string, number> | null;
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
  commands: any[];
}

// Каталог
export interface CatalogItem {
  id: string;
  kind: string;
  data: any;
}
