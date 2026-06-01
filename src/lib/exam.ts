import type { Question, Answer, ExamRun } from "@/types";
import { questionsByDomain } from "@/data/content";
import { gradeItem } from "@/lib/grading";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Allocate `total` items across domains by weight using the largest-remainder method.
export function examAllocation(
  weights: Record<string, number>,
  total = 100
): Record<string, number> {
  const ids = Object.keys(weights);
  const exact = ids.map((d) => ({ d, raw: (total * weights[d]) / 100 }));
  const alloc: Record<string, number> = {};
  let used = 0;
  for (const e of exact) {
    alloc[e.d] = Math.floor(e.raw);
    used += alloc[e.d];
  }
  exact.sort((a, b) => (b.raw - Math.floor(b.raw)) - (a.raw - Math.floor(a.raw)));
  let i = 0;
  while (used < total) {
    alloc[exact[i % exact.length].d]++;
    used++;
    i++;
  }
  return alloc;
}

// Build a full exam: draw alloc[d] questions per domain, then shuffle the whole set.
// If the pool for a domain is smaller than its allocation, it takes whatever exists.
export function buildExam(weights: Record<string, number>, total = 100): Question[] {
  const alloc = examAllocation(weights, total);
  const set: Question[] = [];
  for (const domain in alloc) {
    const pool = shuffle(questionsByDomain(domain));
    set.push(...pool.slice(0, alloc[domain]));
  }
  return shuffle(set);
}

// Grade a finished exam. `answers` keyed by questionId.
export function gradeExam(
  items: Question[],
  answers: Record<string, Answer>,
  durationUsedSec?: number
): ExamRun {
  const perItem = items.map((q) => ({
    questionId: q.id,
    domain: q.domain,
    score: gradeItem(q, answers[q.id] ?? {})
  }));

  const byDomainScores: Record<string, number[]> = {};
  for (const it of perItem) (byDomainScores[it.domain] ??= []).push(it.score);
  const byDomain: Record<string, number> = {};
  for (const d in byDomainScores)
    byDomain[d] = byDomainScores[d].reduce((s, x) => s + x, 0) / byDomainScores[d].length;

  const overall = perItem.length
    ? perItem.reduce((s, it) => s + it.score, 0) / perItem.length
    : 0;

  return {
    ts: Date.now(),
    durationUsedSec,
    overall,
    byDomain,
    items: perItem.map(({ questionId, score }) => ({ questionId, score }))
  };
}

export const EXAM_DURATION_SEC = 120 * 60; // 120 minutes
