import * as db from "@/data/db";
import { schedulePush } from "@/lib/sync";

const KEY = "favorites";

export async function getFavorites(): Promise<string[]> {
  return (await db.getSetting<string[]>(KEY)) ?? [];
}

export async function toggleFavorite(questionId: string): Promise<string[]> {
  const current = await getFavorites();
  const next = current.includes(questionId)
    ? current.filter((id) => id !== questionId)
    : [...current, questionId];
  await db.setSetting(KEY, next);
  schedulePush();
  return next;
}

export function isFav(ids: string[], questionId: string): boolean {
  return ids.includes(questionId);
}
