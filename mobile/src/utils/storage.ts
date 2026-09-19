// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Базовый ключ для всего state */
export const STORAGE_KEY = 'finni_app_state';

/** Полная очистка всех данных приложения */
export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
}

/** Безопасный getter с fallback */
export async function safeGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Безопасный setter */
export async function safeSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Storage] Failed to save:', key, e);
  }
}
