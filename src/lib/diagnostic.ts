import type { Question } from "@/types";
import { questionsByDomain } from "@/data/content";

// Fisher-Yates shuffle (browser runtime; Math.random is fine here).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ~`total` items spread across domains by weight, minimum `min` per domain.
export function diagnosticPlan(
  weights: Record<string, number>,
  total = 30,
  min = 3
): Record<string, number> {
  const ids = Object.keys(weights);
  const plan: Record<string, number> = {};
  let assigned = 0;
  for (const d of ids) {
    plan[d] = Math.max(min, Math.round((total * weights[d]) / 100));
    assigned += plan[d];
  }
  const heaviest = [...ids].sort((a, b) => weights[b] - weights[a])[0];
  plan[heaviest] += total - assigned; // reconcile rounding onto the heaviest domain
  if (plan[heaviest] < min) plan[heaviest] = min;
  return plan;
}

// Build the diagnostic question set. Spreads picks across subtopics within a domain.
export function selectDiagnosticQuestions(plan: Record<string, number>): Question[] {
  const picked: Question[] = [];
  for (const domain in plan) {
    const pool = shuffle(questionsByDomain(domain));
    picked.push(...pool.slice(0, plan[domain]));
  }
  return shuffle(picked);
}

// priority = exam weight * (1 - mastery). Higher = study first.
export function priorityOrder(
  byDomain: Record<string, number>,
  weights: Record<string, number>
): string[] {
  return Object.keys(weights).sort(
    (a, b) =>
      weights[b] * (1 - (byDomain[b] ?? 0)) - weights[a] * (1 - (byDomain[a] ?? 0))
  );
}

// Reduce a list of {domain, score} into mean score per domain (0..1).
export function scoreDiagnostic(results: { domain: string; score: number }[]): Record<string, number> {
  const grouped: Record<string, number[]> = {};
  for (const r of results) (grouped[r.domain] ??= []).push(r.score);
  const out: Record<string, number> = {};
  for (const d in grouped) out[d] = grouped[d].reduce((s, x) => s + x, 0) / grouped[d].length;
  return out;
}
