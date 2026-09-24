// src/api/client.ts

import { Platform } from 'react-native';

/**
 * API client for communicating with the Finni backend.
 * Used by syncService for offline-first synchronization.
 *
 * URL selection:
 * - Android emulator: 10.0.2.2 (maps to host's localhost)
 * - iOS simulator / Web: localhost
 * - Physical device: replace with your machine's local IP
 *
 * In production, replace with the actual server URL.
 */

// @ts-ignore — __DEV__ is a React Native global
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const API_URL = isDev
  ? Platform.select({
      android: 'http://10.0.2.2:8080/api/v1',  // Android emulator → host localhost
      default: 'http://localhost:8080/api/v1',   // iOS simulator, web
    })!
  : 'http://localhost:8080/api/v1'; // Production: update to real server URL

class ApiClient {
  private _token: string | null = null;

  setToken(token: string | null) {
    this._token = token;
  }

  getToken() {
    return this._token;
  }

  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = 'API Request Failed';
      try {
        const errorBody = await response.json();
        if (errorBody.detail) {
          errorDetail = typeof errorBody.detail === 'string'
            ? errorBody.detail
            : errorBody.detail.message || errorBody.detail.code || JSON.stringify(errorBody.detail);
        }
      } catch (e) {
        // ignore parse error
      }
      throw new Error(errorDetail);
    }

    return response.json() as Promise<T>;
  }

  async get<T>(endpoint: string) {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any) {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body: any) {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
}

export const client = new ApiClient();
