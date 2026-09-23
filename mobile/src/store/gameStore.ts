import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyCommand, Command, createGame, Game } from '../game/engine';
import { decodeSave, SAVE_KEY, writeSave } from '../game/storage';
import { PetAppearance } from '../types/pet';

type Store = {
  game: Game | null; ready: boolean; busy: boolean; error: string | null; notice: string | null;
  load: () => Promise<void>;
  start: (name: string, appearance: PetAppearance, demo: boolean) => Promise<boolean>;
  dispatch: (command: Command) => Promise<boolean>;
  reset: () => Promise<boolean>;
  recover: () => Promise<boolean>;
};
export const useGameStore = create<Store>((set, get) => {
  const commit = async (make: () => Game | null): Promise<boolean> => {
    if (!get().ready || get().busy) return false;
    set({ busy: true, error: null });
    try {
      const game = make();
      await writeSave(AsyncStorage, game);
      set({ game, busy: false });
      return true;
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : 'Не удалось сохранить действие. Повтори попытку.' });
      return false;
    }
  };
  return {
    game: null, ready: false, busy: false, error: null, notice: null,
    load: async () => {
      if (get().busy) return;
      set({ busy: true, error: null });
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        const legacy = raw === null ? await AsyncStorage.getItem('finni-profile') : null;
        set({ game: raw === null ? null : decodeSave(raw), ready: true, busy: false,
          notice: legacy ? 'Найдено сохранение старого прототипа. Оно оставлено на устройстве без изменений. Новая локальная игра начнётся отдельно со 100 монетами.' : null });
      } catch {
        set({ ready: false, busy: false, error: 'Не удалось прочитать сохранение. Повтори загрузку. Перед началом новой игры повреждённая запись будет сохранена отдельно.' });
      }
    },
    start: (name, appearance, demo) => commit(() => {
      if (get().game) throw new Error('Игра уже создана.');
      return createGame(name, appearance, demo);
    }),
    dispatch: command => commit(() => {
      const game = get().game;
      if (!game) throw new Error('Сначала создай питомца.');
      return applyCommand(game, command);
    }),
    reset: () => commit(() => null),
    recover: async () => {
      if (get().busy) return false;
      set({ busy: true });
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw !== null) await AsyncStorage.setItem(`${SAVE_KEY}-backup-${Date.now()}`, raw);
        await writeSave(AsyncStorage, null);
        set({ ready: true, busy: false, error: null, game: null });
        return true;
      } catch { set({ busy: false, error: 'Не удалось сохранить резервную копию. Новая игра не начата.' }); return false; }
    },
  };
});
