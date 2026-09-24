import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyCommand, Command, createGame, Game } from '../game/engine';
import { decodeSave, SAVE_KEY, writeSave } from '../game/storage';
import { PetAppearance } from '../types/pet';
import { syncService } from '../api/syncService';
import { mapCommand } from '../api/commandMapper';

type Store = {
  game: Game | null; ready: boolean; busy: boolean; error: string | null; notice: string | null;
  /** Number of commands pending sync with server */
  pendingSync: number;
  load: () => Promise<void>;
  start: (name: string, appearance: PetAppearance, demo: boolean) => Promise<boolean>;
  dispatch: (command: Command) => Promise<boolean>;
  reset: () => Promise<boolean>;
  recover: () => Promise<boolean>;
};
export const useGameStore = create<Store>((set, get) => {
  const commit = async (make: () => Game | null, command?: Command): Promise<boolean> => {
    if (!get().ready || get().busy) return false;
    set({ busy: true, error: null });
    try {
      const game = make();
      await writeSave(AsyncStorage, game);
      set({ game, busy: false });

      // Enqueue for backend sync (fire-and-forget)
      if (command) {
        try {
          const apiCmd = mapCommand(command);
          await syncService.enqueue(apiCmd);
          syncService.flush().then(async () => {
            const size = await syncService.queueSize();
            set({ pendingSync: size });
          }).catch(() => { /* silent — offline is OK */ });
        } catch {
          // Sync enqueue failure is non-fatal — local state is already saved
        }
      }

      return true;
    } catch (error) {
      set({ busy: false, error: error instanceof Error ? error.message : 'Не удалось сохранить действие. Повтори попытку.' });
      return false;
    }
  };
  return {
    game: null, ready: false, busy: false, error: null, notice: null, pendingSync: 0,
    load: async () => {
      if (get().busy) return;
      set({ busy: true, error: null });
      try {
        // Load API token for sync
        await syncService.loadToken();

        const raw = await AsyncStorage.getItem(SAVE_KEY);
        const legacy = raw === null ? await AsyncStorage.getItem('finni-profile') : null;
        const game = raw === null ? null : decodeSave(raw);
        set({ game, ready: true, busy: false,
          notice: legacy ? 'Найдено сохранение старого прототипа. Оно оставлено на устройстве без изменений. Новая локальная игра начнётся отдельно со 100 монетами.' : null });

        // Background: try to sync with server
        if (game) {
          syncService.flush().then(async () => {
            const size = await syncService.queueSize();
            set({ pendingSync: size });
          }).catch(() => { /* offline is OK */ });
        }
      } catch {
        set({ ready: false, busy: false, error: 'Не удалось прочитать сохранение. Повтори загрузку. Перед началом новой игры повреждённая запись будет сохранена отдельно.' });
      }
    },
    start: async (name, appearance, demo) => {
      const result = await commit(() => {
        if (get().game) throw new Error('Игра уже создана.');
        return createGame(name, appearance, demo);
      });

      if (result) {
        // Register on backend (non-blocking)
        syncService.createProfile(name, {
          name,
          body_color: appearance.bodyColor,
          accessory: appearance.accessory,
          outfit: appearance.outfit,
        }, demo).catch(() => { /* server unavailable — offline is OK */ });
      }

      return result;
    },
    dispatch: command => commit(() => {
      const game = get().game;
      if (!game) throw new Error('Сначала создай питомца.');
      return applyCommand(game, command);
    }, command),
    reset: async () => {
      const result = await commit(() => null);
      if (result) {
        // Clear sync state on reset
        await syncService.clearToken();
        set({ pendingSync: 0 });
      }
      return result;
    },
    recover: async () => {
      if (get().busy) return false;
      set({ busy: true });
      try {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        if (raw !== null) await AsyncStorage.setItem(`${SAVE_KEY}-backup-${Date.now()}`, raw);
        await writeSave(AsyncStorage, null);
        await syncService.clearToken();
        set({ ready: true, busy: false, error: null, game: null, pendingSync: 0 });
        return true;
      } catch { set({ busy: false, error: 'Не удалось сохранить резервную копию. Новая игра не начата.' }); return false; }
    },
  };
});
