// src/api/index.ts
import { client } from './client';
import {
  ProfileCreate,
  ProfileCreated,
  State,
  CatalogItem,
  SyncRequest,
  SyncResult,
} from './types';

export const api = {
  createProfile: async (payload: ProfileCreate) => {
    return client.post<ProfileCreated>('/profiles', payload);
  },

  getState: async () => {
    return client.get<State>('/state');
  },

  getCatalog: async () => {
    return client.get<CatalogItem[]>('/catalog');
  },

  sync: async (payload: SyncRequest) => {
    return client.post<SyncResult>('/sync', payload);
  },
};
