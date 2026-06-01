import { describe, it, expect } from "vitest";
import { examAllocation } from "@/lib/exam";
import { priorityOrder, diagnosticPlan } from "@/lib/diagnostic";
import { band, overallReadiness } from "@/lib/readiness";
import { newCard, review } from "@/lib/srs";
import { gradeItem } from "@/lib/grading";
import type { Question } from "@/types";

const WEIGHTS = { "1.0": 20, "2.0": 20, "3.0": 25, "4.0": 10, "5.0": 15, "6.0": 10 };

describe("examAllocation", () => {
  it("sums to the requested total", () => {
    const a = examAllocation(WEIGHTS, 100);
    expect(Object.values(a).reduce((s, x) => s + x, 0)).toBe(100);
  });
  it("matches weights exactly at total=100", () => {
    expect(examAllocation(WEIGHTS, 100)).toEqual({
      "1.0": 20, "2.0": 20, "3.0": 25, "4.0": 10, "5.0": 15, "6.0": 10
    });
  });
  it("still sums to total for odd sizes", () => {
    const a = examAllocation(WEIGHTS, 37);
    expect(Object.values(a).reduce((s, x) => s + x, 0)).toBe(37);
  });
});

describe("diagnosticPlan", () => {
  it("respects the minimum and sums to total", () => {
    const p = diagnosticPlan(WEIGHTS, 30, 3);
    expect(Object.values(p).every((v) => v >= 3)).toBe(true);
    expect(Object.values(p).reduce((s, x) => s + x, 0)).toBe(30);
  });
});

describe("priorityOrder", () => {
  it("puts weak high-weight domains first", () => {
    const mastery = { "1.0": 0.9, "2.0": 0.9, "3.0": 0.4, "4.0": 0.9, "5.0": 0.9, "6.0": 0.9 };
    expect(priorityOrder(mastery, WEIGHTS)[0]).toBe("3.0");
  });
  it("weighs exam weight against weakness", () => {
    // equal mastery -> heaviest weight first
    const flat = { "1.0": 0.5, "2.0": 0.5, "3.0": 0.5, "4.0": 0.5, "5.0": 0.5, "6.0": 0.5 };
    expect(priorityOrder(flat, WEIGHTS)[0]).toBe("3.0");
  });
});

describe("band", () => {
  it("maps scores to bands", () => {
    expect(band(0.59)).toBe("red");
    expect(band(0.6)).toBe("yellow");
    expect(band(0.8)).toBe("yellow");
    expect(band(0.81)).toBe("green");
  });
});

describe("overallReadiness", () => {
  it("is a weighted mean", () => {
    const all1 = { "1.0": 1, "2.0": 1, "3.0": 1, "4.0": 1, "5.0": 1, "6.0": 1 };
    expect(overallReadiness(all1, WEIGHTS)).toBeCloseTo(1);
    const all0 = {};
    expect(overallReadiness(all0, WEIGHTS)).toBe(0);
  });
});

describe("srs review (SM-2)", () => {
  it("first good review -> interval 1, second -> 6", () => {
    const c0 = newCard("q", 0);
    const c1 = review(c0, 4, 0);
    expect(c1.interval).toBe(1);
    const c2 = review(c1, 4, 0);
    expect(c2.interval).toBe(6);
  });
  it("a failed review resets reps and interval", () => {
    let c = newCard("q", 0);
    c = review(c, 4, 0);
    c = review(c, 4, 0);
    c = review(c, 1, 0); // again
    expect(c.reps).toBe(0);
    expect(c.interval).toBe(1);
  });
  it("ease factor never drops below 1.3", () => {
    let c = newCard("q", 0);
    for (let i = 0; i < 10; i++) c = review(c, 0, 0);
    expect(c.ef).toBeGreaterThanOrEqual(1.3);
  });
});

describe("gradeItem", () => {
  const single: Question = {
    id: "q-1.6-001", domain: "1.0", subtopic: "1.6", type: "single", difficulty: "easy",
    stem: "?", explanation: "", references: [{ label: "x", url: "https://x" }],
    options: [
      { id: "a", text: "", correct: true, rationale: "" },
      { id: "b", text: "", correct: false, rationale: "" }
    ]
  };
  it("single: correct = 1, wrong = 0", () => {
    expect(gradeItem(single, { selected: ["a"] })).toBe(1);
    expect(gradeItem(single, { selected: ["b"] })).toBe(0);
  });

  const multi: Question = { ...single, id: "q-1.6-002", type: "multi",
    options: [
      { id: "a", text: "", correct: true, rationale: "" },
      { id: "b", text: "", correct: true, rationale: "" },
      { id: "c", text: "", correct: false, rationale: "" }
    ]
  };
  it("multi: all-or-nothing", () => {
    expect(gradeItem(multi, { selected: ["a", "b"] })).toBe(1);
    expect(gradeItem(multi, { selected: ["a"] })).toBe(0);
    expect(gradeItem(multi, { selected: ["a", "b", "c"] })).toBe(0);
  });

  const dnd: Question = {
    id: "q-3.3-001", domain: "3.0", subtopic: "3.3", type: "draganddrop", difficulty: "medium",
    stem: "?", explanation: "", references: [{ label: "x", url: "https://x" }],
    tokens: [{ id: "t0", text: "0" }, { id: "t1", text: "1" }],
    dropZones: [
      { id: "z1", label: "", correctTokenId: "t0" },
      { id: "z2", label: "", correctTokenId: "t1" }
    ]
  };
  it("draganddrop: partial credit", () => {
    expect(gradeItem(dnd, { mapping: { z1: "t0", z2: "t1" } })).toBe(1);
    expect(gradeItem(dnd, { mapping: { z1: "t0", z2: "t0" } })).toBe(0.5);
  });

  const sim: Question = {
    id: "q-2.1-001", domain: "2.0", subtopic: "2.1", type: "sim", difficulty: "medium",
    stem: "?", explanation: "", references: [{ label: "x", url: "https://x" }],
    rubric: [
      { id: "r1", text: "", points: 30 },
      { id: "r2", text: "", points: 70 }
    ]
  };
  it("sim: rubric points proportion", () => {
    expect(gradeItem(sim, { rubricPassed: ["r1", "r2"] })).toBe(1);
    expect(gradeItem(sim, { rubricPassed: ["r2"] })).toBe(0.7);
    expect(gradeItem(sim, { rubricPassed: [] })).toBe(0);
  });
});
