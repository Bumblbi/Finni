// src/store/syncStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';
import { client } from '../api/client';
import { useProfileStore } from './profileStore';

// Simple UUID v4 generator if library is missing
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface GameCommand {
  action: string;
  operation_id: string;
  expected_revision: number;
  epoch: number;
  [key: string]: any;
}

interface SyncState {
  queue: GameCommand[];
  isSyncing: boolean;
  lastError: string | null;
}

interface SyncActions {
  enqueue: (commandPayload: Omit<GameCommand, 'operation_id' | 'expected_revision' | 'epoch'>) => void;
  syncNow: () => Promise<void>;
  clearQueue: () => void;
}

export const useSyncStore = create<SyncState & SyncActions>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,
      lastError: null,

      enqueue: (commandPayload) => {
        const profileState = useProfileStore.getState();
        if (!profileState.accessToken) return; // Not registered with backend yet

        // Increment revision locally for the command
        const currentRevision = profileState.revision;
        const newRevision = currentRevision + 1;
        useProfileStore.setState({ revision: newRevision });

        const command = {
          ...commandPayload,
          operation_id: generateUUID(),
          expected_revision: currentRevision,
          epoch: profileState.epoch,
        } as GameCommand;

        set((s) => ({ queue: [...s.queue, command] }));
        
        // Attempt to sync immediately (fire and forget)
        get().syncNow().catch(() => {});
      },

      syncNow: async () => {
        const { queue, isSyncing } = get();
        if (isSyncing || queue.length === 0) return;
        
        const profileState = useProfileStore.getState();
        if (!profileState.accessToken) return;

        set({ isSyncing: true, lastError: null });
        client.setToken(profileState.accessToken);

        try {
          const result = await api.sync({ commands: queue });
          
          // If successful, backend returns new state. We can update revision/epoch to match backend if needed
          if (result.state) {
             useProfileStore.setState({ 
               revision: result.state.revision, 
               epoch: result.state.epoch 
             });
          }
          
          // Clear queue on success
          set({ queue: [], isSyncing: false });
        } catch (error: any) {
          console.log("Sync error:", error.message);
          set({ isSyncing: false, lastError: error.message });
          
          if (error.message.includes('concurrent_change')) {
             // Need to pull state and resolve conflicts, but for now we just log
          }
        }
      },

      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'finni-sync',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
