// src/utils/budgetValidation.ts
import { z } from 'zod';

/** Схема для планирования бюджета */
export const budgetPlanSchema = z
  .object({
    income: z.number().positive('Доход должен быть больше нуля'),
    mandatory: z
      .number({ required_error: 'Введи сумму' })
      .min(0, 'Не может быть меньше нуля'),
    desired: z
      .number({ required_error: 'Введи сумму' })
      .min(0, 'Не может быть меньше нуля'),
    savings: z
      .number({ required_error: 'Введи сумму' })
      .min(0, 'Не может быть меньше нуля'),
  })
  .refine(
    (data) => data.mandatory + data.desired + data.savings <= data.income,
    {
      message: 'Сумма расходов не может быть больше дохода',
      path: ['_total'],
    }
  );

export type BudgetPlanForm = z.infer<typeof budgetPlanSchema>;

/** Рассчитать остаток нераспределённых средств */
export function calcUnallocated(
  income: number,
  mandatory: number,
  desired: number,
  savings: number,
): number {
  return Math.max(0, income - mandatory - desired - savings);
}

/** Рассчитать процент от дохода */
export function calcPercent(amount: number, income: number): number {
  if (income <= 0) return 0;
  return Math.round((amount / income) * 100);
}

/** Проверить, нет ли перерасхода */
export function isOverBudget(
  mandatory: number,
  desired: number,
  savings: number,
  income: number,
): boolean {
  return mandatory + desired + savings > income;
}
