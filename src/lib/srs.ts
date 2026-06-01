import type { SrsCard } from "@/types";

const DAY_MS = 86_400_000;

export function newCard(questionId: string, now: number): SrsCard {
  return { questionId, ef: 2.5, interval: 0, reps: 0, due: now };
}

// SM-2. grade q in 0..5. UI buttons map: Again=1, Hard=3, Good=4, Easy=5.
export function review(card: SrsCard, q: number, now: number, dayMs = DAY_MS): SrsCard {
  let { ef, interval, reps } = card;

  if (q < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ef);
  }

  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  return { questionId: card.questionId, ef, interval, reps, due: now + interval * dayMs };
}

export const GRADE = { again: 1, hard: 3, good: 4, easy: 5 } as const;

export function isDue(card: SrsCard, now: number): boolean {
  return card.due <= now;
}

export function dueQueue(cards: SrsCard[], now: number): SrsCard[] {
  return cards.filter((c) => isDue(c, now)).sort((a, b) => a.due - b.due);
}
