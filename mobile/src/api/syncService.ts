// src/api/syncService.ts
/**
 * Offline-first sync service.
 *
 * Architecture:
 *   gameStore.dispatch() → local engine + AsyncStorage (instant UX)
 *                        → syncService.enqueue() → queue in AsyncStorage
 *                        → syncService.flush()   → POST /api/v1/sync (background)
 *
 * Local engine is the source of truth for UX (instant response).
 * Backend is the source of truth for data (server wins on conflicts).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { client } from './client';
import { ApiCommand, SyncResult, State, ProfileCreated } from './types';

const QUEUE_KEY = 'finni-sync-queue';
const TOKEN_KEY = 'finni-api-token';
const REVISION_KEY = 'finni-revision';
const EPOCH_KEY = 'finni-epoch';

interface QueuedCommand {
  command: ApiCommand;
  queuedAt: number;
}

class SyncService {
  private _flushing = false;
  private _revision = 0;
  private _epoch = 1;

  // ─── Token management ──────────────────────────────────────────────────────
  async loadToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      client.setToken(token);
    }
    // Load revision/epoch
    const rev = await AsyncStorage.getItem(REVISION_KEY);
    const ep = await AsyncStorage.getItem(EPOCH_KEY);
    if (rev) this._revision = parseInt(rev, 10);
    if (ep) this._epoch = parseInt(ep, 10);
    return token;
  }

  async saveToken(token: string): Promise<void> {
    client.setToken(token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async clearToken(): Promise<void> {
    client.setToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, REVISION_KEY, EPOCH_KEY, QUEUE_KEY]);
    this._revision = 0;
    this._epoch = 1;
  }

  // ─── Revision tracking ─────────────────────────────────────────────────────
  get revision(): number { return this._revision; }
  get epoch(): number { return this._epoch; }

  async updateRevision(revision: number, epoch: number): Promise<void> {
    this._revision = revision;
    this._epoch = epoch;
    await AsyncStorage.setItem(REVISION_KEY, String(revision));
    await AsyncStorage.setItem(EPOCH_KEY, String(epoch));
  }

  // ─── Queue management ──────────────────────────────────────────────────────
  private async getQueue(): Promise<QueuedCommand[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedCommand[];
    } catch {
      return [];
    }
  }

  private async saveQueue(queue: QueuedCommand[]): Promise<void> {
    if (queue.length === 0) {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } else {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  }

  /**
   * Add a command to the offline sync queue.
   * Called by gameStore after successful local commit.
   */
  async enqueue(command: ApiCommand): Promise<void> {
    const queue = await this.getQueue();
    queue.push({ command, queuedAt: Date.now() });
    await this.saveQueue(queue);
  }

  /**
   * Attempt to flush the queue to the server (fire-and-forget).
   * If the server is unreachable, commands stay in queue for next attempt.
   */
  async flush(): Promise<{ success: boolean; state?: State }> {
    if (this._flushing) return { success: false };
    const token = client.getToken();
    if (!token) return { success: false };

    const queue = await this.getQueue();
    if (queue.length === 0) return { success: true };

    this._flushing = true;
    try {
      const result = await client.post<SyncResult>('/sync', {
        commands: queue.map(q => q.command),
      });

      // Success — clear queue and update revision
      await this.saveQueue([]);
      await this.updateRevision(result.state.revision, result.state.epoch);
      this._flushing = false;
      return { success: true, state: result.state };
    } catch (error) {
      this._flushing = false;
      // Check for specific error types
      const message = error instanceof Error ? error.message : '';

      if (message.includes('concurrent_change') || message.includes('revision_conflict')) {
        // Conflict — clear queue (server state wins) and reload
        await this.saveQueue([]);
        return { success: false };
      }

      if (message.includes('profile_reset')) {
        // Profile was reset server-side — clear everything
        await this.saveQueue([]);
        return { success: false };
      }

      // Network error or other — keep queue for retry
      return { success: false };
    }
  }

  // ─── Server API wrappers ───────────────────────────────────────────────────

  /**
   * Register a new profile on the server.
   * Returns access_token and initial state.
   */
  async createProfile(nickname: string, pet: ApiCommand extends { action: 'customize'; pet: infer P } ? P : never, demo: boolean): Promise<ProfileCreated | null> {
    try {
      const result = await client.post<ProfileCreated>('/profiles', {
        nickname,
        pet: { name: nickname, ...pet },
        demo,
      });
      await this.saveToken(result.access_token);
      await this.updateRevision(result.state.revision, result.state.epoch);
      return result;
    } catch {
      // Server unavailable — profile created locally only
      return null;
    }
  }

  /**
   * Fetch current state from server.
   */
  async fetchState(): Promise<State | null> {
    const token = client.getToken();
    if (!token) return null;
    try {
      const state = await client.get<State>('/state');
      await this.updateRevision(state.revision, state.epoch);
      return state;
    } catch {
      return null;
    }
  }

  /**
   * Get the number of queued commands awaiting sync.
   */
  async queueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
}

export const syncService = new SyncService();
