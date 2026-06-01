import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Question, Answer } from "@/types";
import QuestionCard from "@/components/QuestionCard";
import Gauge from "@/components/Gauge";
import { useProgress } from "@/state/ProgressContext";
import { diagnosticPlan, selectDiagnosticQuestions, scoreDiagnostic, priorityOrder } from "@/lib/diagnostic";
import { band, bandColor, overallReadiness } from "@/lib/readiness";
import { getDomain, weights } from "@/data/content";
import { gradeItem } from "@/lib/grading";
import BookmarkButton from "@/components/BookmarkButton";
import { getFavorites } from "@/lib/favorites";

type Phase = "intro" | "running" | "result";

interface ResultState {
  byDomain: Record<string, number>;
  priority: string[];
  overall: number;
}

export default function Diagnostic() {
  const { recordAttempt, addDiagnostic } = useProgress();

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ResultState | null>(null);
  const [favIds, setFavIds] = useState<string[]>([]);

  const plan = useMemo(() => diagnosticPlan(weights), []);

  useEffect(() => { getFavorites().then(setFavIds); }, []);

  function startDiagnostic() {
    const qs = selectDiagnosticQuestions(plan);
    setQuestions(qs);
    setIdx(0);
    setAnswers({});
    setRevealed(new Set());
    setPhase("running");
  }

  const q = questions[idx];
  const answer = q ? (answers[q.id] ?? {}) : {};
  const isRevealed = q ? revealed.has(q.id) : false;

  function hasAnswer(a: Answer): boolean {
    if (!q) return false;
    if (q.type === "single" || q.type === "multi") return (a.selected?.length ?? 0) > 0;
    if (q.type === "draganddrop") return Object.keys(a.mapping ?? {}).length > 0;
    return false;
  }

  async function handleSubmit() {
    if (!q || !hasAnswer(answer)) return;
    await recordAttempt(q, answer, "diagnostic");
    setRevealed((prev) => new Set(prev).add(q.id));
  }

  async function handleNext() {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      // Finish - compute results
      const scored = questions.map((item) => ({
        domain: item.domain,
        score: gradeItem(item, answers[item.id] ?? {})
      }));

      const byDomain = scoreDiagnostic(scored);
      const priority = priorityOrder(byDomain, weights);
      const overall = overallReadiness(byDomain, weights);

      const record = { ts: Date.now(), byDomain, priority, overall };
      await addDiagnostic(record);

      setResult({ byDomain, priority, overall });
      setPhase("result");
    }
  }

  if (phase === "intro") {
    const total = Object.values(plan).reduce((s, x) => s + x, 0);
    return (
      <div className="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
        <section>
          <h1 className="text-2xl font-semibold">Diagnostic Assessment</h1>
          <p className="mt-1 text-sm text-slate-400">
            A {total}-question pre-assessment that identifies where to focus.
          </p>
        </section>

        <section className="rounded-lg border border-slate-700 bg-surface p-5 space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">How it works</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex gap-2">
              <span className="text-accent">1.</span>
              <span>~{total} questions spread across all 6 domains (proportional to exam weight).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">2.</span>
              <span>Each question reveals a rationale so you learn as you go.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent">3.</span>
              <span>Results show per-domain readiness bands and a prioritized study plan.</span>
            </li>
          </ul>

          <div className="border-t border-slate-700 pt-3 text-xs text-slate-500">
            Distribution: {Object.entries(plan).map(([d, n]) => `${d}: ${n}`).join(", ")}
          </div>
        </section>

        <button
          onClick={startDiagnostic}
          className="w-full rounded-lg bg-accent py-3 font-medium text-white hover:bg-accent/90 transition-colors"
        >
          Start Diagnostic
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
        <section className="flex flex-col items-center gap-4 sm:flex-row">
          <Gauge value={result.overall} label="Overall readiness" />
          <div>
            <h1 className="text-xl font-semibold">Diagnostic complete</h1>
            <p className="mt-1 text-sm text-slate-400">
              {questions.length} questions answered.
            </p>
            <button
              onClick={startDiagnostic}
              className="mt-3 rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:border-slate-500"
            >
              Retake diagnostic
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Per-domain results</h2>
          {Object.entries(result.byDomain).map(([domainId, score]) => {
            const d = getDomain(domainId);
            const b = band(score);
            return (
              <div key={domainId} className="flex items-center gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      <span className="font-mono text-slate-500 mr-1">{domainId}</span>
                      {d?.name ?? domainId}
                    </span>
                    <span className="text-sm font-medium" style={{ color: bandColor[b] }}>
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                    <div className="h-full rounded-full" style={{ width: `${score * 100}%`, background: bandColor[b] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Priority study order
          </h2>
          <p className="text-xs text-slate-500">
            Priority = exam weight x (1 - mastery). Domains with the most room for improvement rank first.
          </p>
          <ol className="space-y-2">
            {result.priority.map((domainId, i) => {
              const d = getDomain(domainId);
              const score = result.byDomain[domainId] ?? 0;
              const b = band(score);
              return (
                <li key={domainId}>
                  <Link
                    to={`/study/${domainId}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3 hover:border-slate-500 transition-colors"
                  >
                    <span className="shrink-0 text-slate-500 font-medium">{i + 1}.</span>
                    <div className="flex-1">
                      <span className="text-sm">{d?.name}</span>
                      <span className="ml-2 text-xs text-slate-500">({weights[domainId]}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
                        <span className="block h-full rounded-full" style={{ width: `${score * 100}%`, background: bandColor[b] }} />
                      </span>
                      <span className="w-9 text-right text-xs" style={{ color: bandColor[b] }}>
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-slate-500" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="flex gap-3">
          <Link to="/study" className="flex-1 rounded-lg border border-slate-700 py-2 text-center text-sm hover:border-slate-500">
            Start studying
          </Link>
          <Link to="/" className="flex-1 rounded-lg bg-accent py-2 text-center text-sm font-medium text-white hover:bg-accent/90">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Running phase
  if (!q) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium text-slate-400">Diagnostic</h1>
        <span className="text-sm text-slate-400">{idx + 1} / {questions.length}</span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">{q.subtopic} - {q.difficulty}</span>
          <div className="flex items-center gap-2">
            <BookmarkButton questionId={q.id} saved={favIds.includes(q.id)} onToggle={setFavIds} size="sm" />
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400 capitalize">
              {q.type === "draganddrop" ? "drag & drop" : q.type}
            </span>
          </div>
        </div>

        <QuestionCard
          question={q}
          answer={answer}
          onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
          revealed={isRevealed}
        />
      </div>

      <div className="flex justify-end gap-3">
        {!isRevealed ? (
          <button
            onClick={handleSubmit}
            disabled={!hasAnswer(answer)}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-lg bg-slate-700 px-6 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
          >
            {idx < questions.length - 1 ? "Next" : "See results"}
          </button>
        )}
      </div>
    </div>
  );
}
