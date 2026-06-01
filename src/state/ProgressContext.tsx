import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Attempt,
  SrsCard,
  ExamRun,
  DiagnosticRecord,
  Question,
  Answer,
  Mode
} from "@/types";
import * as db from "@/data/db";
import { weights } from "@/data/content";
import { gradeItem } from "@/lib/grading";
import { masteryByDomain, masteryBySubtopic, overallReadiness } from "@/lib/readiness";
import { newCard, review, GRADE } from "@/lib/srs";

interface ProgressState {
  loading: boolean;
  attempts: Attempt[];
  srs: SrsCard[];
  examRuns: ExamRun[];
  diagnostics: DiagnosticRecord[];
  // derived
  masteryByDomain: Record<string, number>;
  masteryBySubtopic: Record<string, number>;
  overall: number;
  // actions
  recordAttempt: (q: Question, answer: Answer, mode: Mode) => Promise<number>;
  addExamRun: (r: ExamRun) => Promise<void>;
  addDiagnostic: (d: DiagnosticRecord) => Promise<void>;
  reload: () => Promise<void>;
  reset: () => Promise<void>;
}

const Ctx = createContext<ProgressState | null>(null);

// Map a 0..1 item score to an SM-2 grade for spaced repetition.
function scoreToGrade(score: number): number {
  if (score >= 1) return GRADE.good;
  if (score > 0) return GRADE.hard;
  return GRADE.again;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [srs, setSrs] = useState<SrsCard[]>([]);
  const [examRuns, setExamRuns] = useState<ExamRun[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([]);

  async function reload() {
    const [a, s, e, d] = await Promise.all([
      db.getAttempts(),
      db.getAllSrs(),
      db.getExamRuns(),
      db.getDiagnostics()
    ]);
    setAttempts(a);
    setSrs(s);
    setExamRuns(e);
    setDiagnostics(d);
  }

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, []);

  async function recordAttempt(q: Question, answer: Answer, mode: Mode): Promise<number> {
    const score = gradeItem(q, answer);
    const attempt: Attempt = {
      questionId: q.id,
      type: q.type,
      selected: answer.selected,
      mapping: answer.mapping,
      rubricPassed: answer.rubricPassed,
      correct: score >= 1,
      score,
      ts: Date.now(),
      mode,
      domain: q.domain,
      subtopic: q.subtopic
    };
    const id = await db.addAttempt(attempt);

    // Update spaced-repetition card (skip during a formal exam run).
    if (mode !== "exam") {
      const existing = (await db.getSrs(q.id)) ?? newCard(q.id, Date.now());
      await db.putSrs(review(existing, scoreToGrade(score), Date.now()));
    }
    await reload();
    return id;
  }

  async function addExamRun(r: ExamRun) {
    await db.addExamRun(r);
    await reload();
  }
  async function addDiagnostic(d: DiagnosticRecord) {
    await db.addDiagnostic(d);
    await reload();
  }
  async function reset() {
    await db.resetAll();
    await reload();
  }

  const mDomain = useMemo(() => masteryByDomain(attempts), [attempts]);
  const mSub = useMemo(() => masteryBySubtopic(attempts), [attempts]);
  const overall = useMemo(() => overallReadiness(mDomain, weights), [mDomain]);

  const value: ProgressState = {
    loading,
    attempts,
    srs,
    examRuns,
    diagnostics,
    masteryByDomain: mDomain,
    masteryBySubtopic: mSub,
    overall,
    recordAttempt,
    addExamRun,
    addDiagnostic,
    reload,
    reset
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
