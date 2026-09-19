// src/types/pet.ts

export type PetBodyColor = 'brown' | 'orange' | 'gray';
export type PetAccessory = 'none' | 'glasses' | 'hat' | 'bow';
export type PetOutfit = 'hoodie_teal' | 'hoodie_pink' | 'hoodie_yellow';

/** 1 = Малыш, 2 = Подросток, 3 = Мастер */
export type PetGrowthStage = 1 | 2 | 3;

export interface PetAppearance {
  bodyColor: PetBodyColor;
  accessory: PetAccessory;
  outfit: PetOutfit;
}

export interface PetState {
  name: string;
  appearance: PetAppearance;
  growthStage: PetGrowthStage;
  /** 0–100: влияет на анимацию питомца */
  mood: number;
  /** 0–100: снижается, если не покупать обязательные товары */
  satiety: number;
  /** 0–100: накапливается при выполнении квестов и хороших решениях */
  energy: number;
  /** 0–100: финансовая дисциплина (регулярность накоплений) */
  discipline: number;
  /** Накопленные очки для перехода на следующую стадию */
  growthPoints: number;
}

// ─── Константы выбора ────────────────────────────────────────────────────────
export const PET_BODY_COLORS: PetBodyColor[] = ['brown', 'orange', 'gray'];
export const PET_ACCESSORIES: PetAccessory[] = ['none', 'glasses', 'hat', 'bow'];
export const PET_OUTFITS: PetOutfit[] = ['hoodie_teal', 'hoodie_pink', 'hoodie_yellow'];

export const GROWTH_THRESHOLDS: Record<PetGrowthStage, number> = {
  1: 0,
  2: 100,
  3: 250,
};

export const GROWTH_STAGE_LABELS: Record<PetGrowthStage, string> = {
  1: '🐣 Малыш',
  2: '⭐ Подросток',
  3: '🏆 Мастер',
};

export const PET_BODY_COLOR_LABELS: Record<PetBodyColor, string> = {
  brown: 'Шоколадный',
  orange: 'Рыжий',
  gray: 'Серый',
};

export const PET_ACCESSORY_LABELS: Record<PetAccessory, string> = {
  none: 'Без аксессуара',
  glasses: '👓 Очки',
  hat: '🎩 Шляпа',
  bow: '🎀 Бантик',
};

export const PET_OUTFIT_LABELS: Record<PetOutfit, string> = {
  hoodie_teal: '🩵 Бирюзовая кофта',
  hoodie_pink: '🩷 Розовая кофта',
  hoodie_yellow: '💛 Жёлтая кофта',
};

// 9 визуальных комбинаций для онбординга
export type PetComboIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const PET_COMBOS: PetAppearance[] = [
  { bodyColor: 'brown', accessory: 'none',    outfit: 'hoodie_teal'   },
  { bodyColor: 'brown', accessory: 'glasses', outfit: 'hoodie_pink'   },
  { bodyColor: 'brown', accessory: 'hat',     outfit: 'hoodie_yellow' },
  { bodyColor: 'orange', accessory: 'none',   outfit: 'hoodie_pink'   },
  { bodyColor: 'orange', accessory: 'bow',    outfit: 'hoodie_teal'   },
  { bodyColor: 'orange', accessory: 'glasses',outfit: 'hoodie_yellow' },
  { bodyColor: 'gray', accessory: 'none',     outfit: 'hoodie_yellow' },
  { bodyColor: 'gray', accessory: 'hat',      outfit: 'hoodie_teal'   },
  { bodyColor: 'gray', accessory: 'bow',      outfit: 'hoodie_pink'   },
];
