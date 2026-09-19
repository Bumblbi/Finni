// src/types/budget.ts

/** Игровой период 1–5 */
export type Period = 1 | 2 | 3 | 4 | 5;

/** Категории бюджета */
export type BudgetCategory = 'mandatory' | 'desired' | 'savings';

/** План распределения на период */
export interface BudgetPlan {
  income: number;
  mandatory: number;  // Обязательные расходы
  desired: number;    // Желаемое
  savings: number;    // Накопления
}

/** Фактические траты в текущем периоде */
export interface BudgetActual {
  mandatory: number;
  desired: number;
  savings: number;
}

/** Транзакция (для истории) */
export interface Transaction {
  id: string;
  category: BudgetCategory;
  amount: number;
  label: string;
  timestamp: number;
  period: Period;
}

/** Агрегированная статистика для родительского экрана */
export interface BudgetStats {
  totalEarned: number;
  totalSaved: number;
  totalSpent: number;
  savingsRate: number;       // % от дохода
  periodsCompleted: number;
  overBudgetCount: number;   // Кол-во периодов с перерасходом
}
