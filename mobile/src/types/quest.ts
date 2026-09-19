// src/types/quest.ts

export type QuestTheme = 'saving' | 'spending' | 'planning';

export type QuestChoiceResult = 'good' | 'neutral' | 'bad';

export interface QuestChoice {
  id: string;
  text: string;
  result: QuestChoiceResult;
  explanation: string;   // Объяснение финансового последствия
  moodDelta: number;     // Изменение настроения (-20..+20)
  satietyDelta: number;  // Изменение сытости (-20..+20)
  growthPoints: number;  // Очки роста (0..15)
  moneyDelta: number;    // Изменение баланса (отрицательное = трата)
}

export interface Quest {
  id: string;
  theme: QuestTheme;
  title: string;
  story: string;         // Ситуационная задача
  choices: QuestChoice[];
  reward: {
    growthPoints: number;
    money: number;
  };
}

export interface QuestStatus {
  questId: string;
  completed: boolean;
  choiceId: string | null;
  completedAt: number | null;
}

export const QUEST_THEME_LABELS: Record<QuestTheme, string> = {
  saving: '🐷 Копилка',
  spending: '🛒 Покупки',
  planning: '📋 Планирование',
};

export const QUEST_RESULT_CONFIG: Record<QuestChoiceResult, {
  label: string;
  color: string;
  icon: string;
}> = {
  good: {
    label: 'Отличное решение!',
    color: '#67D8AF',
    icon: '✅',
  },
  neutral: {
    label: 'Неплохо, но можно лучше',
    color: '#F5B942',
    icon: '⚡',
  },
  bad: {
    label: 'Стоит подумать...',
    color: '#FF7675',
    icon: '⚠️',
  },
};
