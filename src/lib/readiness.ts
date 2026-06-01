import type { Attempt, Band } from "@/types";

export function band(score: number): Band {
  if (score < 0.6) return "red";
  if (score <= 0.8) return "yellow";
  return "green";
}

// Overall readiness = weight-weighted mean of per-domain scores (0..1).
export function overallReadiness(
  byDomain: Record<string, number>,
  weights: Record<string, number>
): number {
  let sum = 0;
  let w = 0;
  for (const d in weights) {
    sum += (byDomain[d] ?? 0) * weights[d];
    w += weights[d];
  }
  return w ? sum / w : 0;
}

// Mastery per domain = mean score of the last `n` attempts in that domain.
export function masteryByDomain(attempts: Attempt[], n = 10): Record<string, number> {
  const byDomain: Record<string, Attempt[]> = {};
  for (const a of attempts) (byDomain[a.domain] ??= []).push(a);
  const out: Record<string, number> = {};
  for (const d in byDomain) {
    const recent = byDomain[d].sort((x, y) => y.ts - x.ts).slice(0, n);
    out[d] = recent.length ? recent.reduce((s, a) => s + a.score, 0) / recent.length : 0;
  }
  return out;
}

// Mastery per subtopic = mean score of the last `n` attempts on that subtopic.
export function masteryBySubtopic(attempts: Attempt[], n = 10): Record<string, number> {
  const bySub: Record<string, Attempt[]> = {};
  for (const a of attempts) (bySub[a.subtopic] ??= []).push(a);
  const out: Record<string, number> = {};
  for (const s in bySub) {
    const recent = bySub[s].sort((x, y) => y.ts - x.ts).slice(0, n);
    out[s] = recent.length ? recent.reduce((sum, a) => sum + a.score, 0) / recent.length : 0;
  }
  return out;
}

export const bandColor: Record<Band, string> = {
  red: "#ef4444",
  yellow: "#eab308",
  green: "#22c55e"
};
