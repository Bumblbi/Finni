// src/utils/petEvolution.ts
import { PetState, PetGrowthStage, GROWTH_THRESHOLDS } from '../types/pet';
import { BudgetPlan, BudgetActual } from '../types/budget';
import { QuestStatus } from '../types/quest';

export interface EvolutionResult {
  newStage: PetGrowthStage;
  newGrowthPoints: number;
  newMood: number;
  newSatiety: number;
  newDiscipline: number;
  newEnergy: number;
  stageUp: boolean;
  /** Описание изменений для UI */
  summary: string;
}

/**
 * Вычисляет новое состояние питомца при смене игрового периода.
 *
 * Логика:
 * - Регулярные накопления (savings > 0) → +discipline, +growthPoints
 * - Перерасход бюджета → -discipline, -growthPoints
 * - Выполненные квесты → +energy
 * - Покупка обязательных товаров (satiety > 50) → нет штрафа настроению
 * - Низкая сытость → -mood
 */
export function calculatePetEvolution(
  pet: PetState,
  plan: BudgetPlan,
  actual: BudgetActual,
  completedQuestsCount: number,
): EvolutionResult {
  let { mood, satiety, energy, discipline, growthPoints } = pet;

  // 1. Накопления: если план сбережений выполнен ≥ 80%
  const savingsRate = plan.savings > 0 ? actual.savings / plan.savings : 0;
  const savedWell = savingsRate >= 0.8;

  if (savedWell) {
    discipline = clamp(discipline + 15, 0, 100);
    growthPoints += 10;
    energy = clamp(energy + 5, 0, 100);
  } else if (plan.savings > 0 && actual.savings === 0) {
    // Не отложил ни рубля
    discipline = clamp(discipline - 10, 0, 100);
    growthPoints = Math.max(0, growthPoints - 5);
  }

  // 2. Перерасход обязательных расходов
  const mandatoryOverspend = actual.mandatory > plan.mandatory;
  if (mandatoryOverspend) {
    discipline = clamp(discipline - 8, 0, 100);
    mood = clamp(mood - 10, 0, 100);
  }

  // 3. Сытость: зависит от mandatory spending
  const mandatoryRate = plan.mandatory > 0 ? actual.mandatory / plan.mandatory : 0;
  if (mandatoryRate >= 0.7) {
    satiety = clamp(satiety + 10, 0, 100);
  } else {
    satiety = clamp(satiety - 15, 0, 100);
    mood = clamp(mood - 10, 0, 100);
  }

  // 4. Квесты: бонус за прохождение
  if (completedQuestsCount > 0) {
    energy = clamp(energy + completedQuestsCount * 8, 0, 100);
    growthPoints += completedQuestsCount * 5;
    mood = clamp(mood + completedQuestsCount * 5, 0, 100);
  }

  // 5. Базовое восстановление настроения (если всё нормально)
  if (satiety > 50 && !mandatoryOverspend) {
    mood = clamp(mood + 5, 0, 100);
  }

  // 6. Проверка перехода на новую стадию
  const currentStage = pet.growthStage;
  let newStage = currentStage;
  let stageUp = false;

  if (currentStage === 1 && growthPoints >= GROWTH_THRESHOLDS[2]) {
    newStage = 2;
    stageUp = true;
    mood = 100; // Счастье от эволюции
  } else if (currentStage === 2 && growthPoints >= GROWTH_THRESHOLDS[3]) {
    newStage = 3;
    stageUp = true;
    mood = 100;
  }

  // 7. Генерация summary
  const messages: string[] = [];
  if (stageUp) messages.push('🎉 Финни вырос! Новая стадия!');
  if (savedWell) messages.push('💰 Молодец — копилка пополнилась!');
  if (mandatoryOverspend) messages.push('⚠️ Перерасход обязательных трат');
  if (satiety < 30) messages.push('😢 Финни голоден — купи ему еду!');
  if (completedQuestsCount > 0)
    messages.push(`📚 Выполнено заданий: ${completedQuestsCount}`);

  return {
    newStage,
    newGrowthPoints: growthPoints,
    newMood: mood,
    newSatiety: satiety,
    newDiscipline: discipline,
    newEnergy: energy,
    stageUp,
    summary: messages.join('\n') || 'Период завершён!',
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
