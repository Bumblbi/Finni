import { z } from 'zod';
import { Game } from './engine';

export const SAVE_KEY = 'finni-game-v1';
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const plan = z.object({ mandatory: money, desired: money, savings: money });
const period = z.object({ number: z.number().int().positive(), startedAt: money, incomeClaimed: z.boolean(),
  plan: plan.nullable(), mandatory: money, desired: money, saved: money, withdrawn: money, closed: z.boolean() });
const stat = z.number().min(0).max(100);
const stage = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const schema = z.object({
  version: z.literal(1), name: z.string().min(1).max(16), demo: z.boolean(), wallet: money, savings: money,
  goalId: z.enum(['house', 'trip', 'garden']).nullable(),
  pet: z.object({ name: z.string(), appearance: z.object({ bodyColor: z.enum(['brown', 'orange', 'gray']),
    accessory: z.enum(['none', 'glasses', 'hat', 'bow']), outfit: z.enum(['hoodie_teal', 'hoodie_pink', 'hoodie_yellow']) }),
    growthStage: stage, mood: stat, satiety: stat, energy: stat, discipline: stat, growthPoints: money }),
  period, history: z.array(z.object({ period, successful: z.boolean(), reasons: z.array(z.string()),
    moodDelta: z.number(), satietyDelta: z.number(), disciplineDelta: z.number(), stageBefore: stage, stageAfter: stage })),
  transactions: z.array(z.object({ id: money, period: money, at: money, label: z.string(), wallet: z.number().int(), savings: z.number().int() })),
  attempts: z.record(z.object({ answer: z.string(), correct: z.boolean(), feedback: z.string(), reward: money })),
  feedback: z.string(),
});

export function encodeSave(game: Game | null): string { return JSON.stringify({ version: 1, game }); }
export function decodeSave(raw: string): Game | null {
  return z.object({ version: z.literal(1), game: schema.nullable() }).parse(JSON.parse(raw)).game;
}

export interface SaveStorage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void> }

// Publish a state only after its complete snapshot has been written successfully.
export async function writeSave(storage: SaveStorage, game: Game | null): Promise<void> {
  const raw = encodeSave(game);
  decodeSave(raw);
  await storage.setItem(SAVE_KEY, raw);
}
