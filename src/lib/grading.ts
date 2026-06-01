import type { Question, Answer } from "@/types";

export function correctIds(item: Question): string[] {
  return (item.options ?? []).filter((o) => o.correct).map((o) => o.id);
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

// Returns a 0..1 score for an answered item.
export function gradeItem(item: Question, answer: Answer): number {
  switch (item.type) {
    case "single":
      return answer.selected?.[0] === correctIds(item)[0] ? 1 : 0;

    case "multi": {
      const sel = new Set(answer.selected ?? []);
      const cor = new Set(correctIds(item));
      return setsEqual(sel, cor) ? 1 : 0; // all-or-nothing, mirrors exam strictness
    }

    case "draganddrop": {
      const zones = item.dropZones ?? [];
      if (zones.length === 0) return 0;
      let right = 0;
      for (const z of zones) if (answer.mapping?.[z.id] === z.correctTokenId) right++;
      return right / zones.length; // partial credit
    }

    case "sim":
    case "simlet":
    case "testlet": {
      const rubric = item.rubric ?? [];
      const max = rubric.reduce((s, r) => s + r.points, 0);
      if (max === 0) return 0;
      const passed = new Set(answer.rubricPassed ?? []);
      const got = rubric.reduce((s, r) => (passed.has(r.id) ? s + r.points : s), 0);
      return got / max;
    }

    default:
      return 0;
  }
}

export const isCorrect = (item: Question, answer: Answer): boolean => gradeItem(item, answer) >= 1;
