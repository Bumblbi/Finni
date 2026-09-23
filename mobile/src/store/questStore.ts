// src/store/questStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncStore } from './syncStore';
import { QuestStatus } from '../types/quest';
import { QUESTS } from '../constants/quests';

interface QuestStoreState {
  statuses: QuestStatus[];
}

interface QuestStoreActions {
  completeQuest: (questId: string, choiceId: string) => void;
  isCompleted: (questId: string) => boolean;
  getCompletedCount: () => number;
  getChoiceId: (questId: string) => string | null;
  resetQuests: () => void;
}

const initialStatuses: QuestStatus[] = QUESTS.map((q) => ({
  questId: q.id,
  completed: false,
  choiceId: null,
  completedAt: null,
}));

export const useQuestStore = create<QuestStoreState & QuestStoreActions>()(
  persist(
    (set, get) => ({
      statuses: initialStatuses,

      completeQuest: (questId, choiceId) => {
        set((s) => ({
          statuses: s.statuses.map((st) =>
            st.questId === questId
              ? { ...st, completed: true, choiceId, completedAt: Date.now() }
              : st,
          ),
        }));
        
        useSyncStore.getState().enqueue({
          action: 'quest',
          quest_id: questId,
          choice_id: choiceId,
        });
      },

      isCompleted: (questId) =>
        get().statuses.find((s) => s.questId === questId)?.completed ?? false,

      getCompletedCount: () =>
        get().statuses.filter((s) => s.completed).length,

      getChoiceId: (questId) =>
        get().statuses.find((s) => s.questId === questId)?.choiceId ?? null,

      resetQuests: () => set({ statuses: initialStatuses }),
    }),
    {
      name: 'finni-quests',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
