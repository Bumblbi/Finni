// src/api/client.ts

import { Platform } from 'react-native';

// Для Android эмулятора (10.0.2.2), для iOS и веба (localhost), для физического устройства (IP)
// Вынесем в константу, которую можно легко поменять
// Для работы с Expo Go на реальном устройстве, API_URL должен указывать на локальный IP компьютера.
// Пока оставим localhost (подойдёт для эмуляторов и веба)
export const API_URL = 'http://localhost:8080/api/v1'; 

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
          errorDetail = typeof errorBody.detail === 'string' ? errorBody.detail : errorBody.detail.message || JSON.stringify(errorBody.detail);
        }
      } catch (e) {
        // ignore
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
