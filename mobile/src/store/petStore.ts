// src/store/petStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetState, PetAppearance, PetGrowthStage, PET_COMBOS } from '../types/pet';

interface PetStoreState extends PetState {}

interface PetStoreActions {
  initPet: (name: string, appearance: PetAppearance) => void;
  setAppearance: (appearance: PetAppearance) => void;
  setMood: (mood: number) => void;
  addMood: (delta: number) => void;
  setSatiety: (satiety: number) => void;
  addSatiety: (delta: number) => void;
  setEnergy: (energy: number) => void;
  addEnergy: (delta: number) => void;
  setDiscipline: (discipline: number) => void;
  addDiscipline: (delta: number) => void;
  addGrowthPoints: (points: number) => void;
  applyEvolution: (result: {
    newStage: PetGrowthStage;
    newGrowthPoints: number;
    newMood: number;
    newSatiety: number;
    newDiscipline: number;
    newEnergy: number;
  }) => void;
  resetPet: () => void;
}

const defaultPet: PetState = {
  name: '',
  appearance: PET_COMBOS[0],
  growthStage: 1,
  mood: 70,
  satiety: 70,
  energy: 80,
  discipline: 50,
  growthPoints: 0,
};

export const usePetStore = create<PetStoreState & PetStoreActions>()(
  persist(
    (set) => ({
      ...defaultPet,

      initPet: (name, appearance) =>
        set({ ...defaultPet, name, appearance }),

      setAppearance: (appearance) => set({ appearance }),

      setMood: (mood) => set({ mood: clamp(mood, 0, 100) }),
      addMood: (delta) => set((s) => ({ mood: clamp(s.mood + delta, 0, 100) })),

      setSatiety: (satiety) => set({ satiety: clamp(satiety, 0, 100) }),
      addSatiety: (delta) => set((s) => ({ satiety: clamp(s.satiety + delta, 0, 100) })),

      setEnergy: (energy) => set({ energy: clamp(energy, 0, 100) }),
      addEnergy: (delta) => set((s) => ({ energy: clamp(s.energy + delta, 0, 100) })),

      setDiscipline: (discipline) => set({ discipline: clamp(discipline, 0, 100) }),
      addDiscipline: (delta) =>
        set((s) => ({ discipline: clamp(s.discipline + delta, 0, 100) })),

      addGrowthPoints: (points) =>
        set((s) => ({ growthPoints: s.growthPoints + points })),

      applyEvolution: (result) =>
        set({
          growthStage: result.newStage,
          growthPoints: result.newGrowthPoints,
          mood: result.newMood,
          satiety: result.newSatiety,
          discipline: result.newDiscipline,
          energy: result.newEnergy,
        }),

      resetPet: () => set(defaultPet),
    }),
    {
      name: 'finni-pet',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
