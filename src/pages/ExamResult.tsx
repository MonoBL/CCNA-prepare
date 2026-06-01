import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useProgress } from "@/state/ProgressContext";
import { getDomain, getQuestion } from "@/data/content";
import { band, bandColor } from "@/lib/readiness";
import Gauge from "@/components/Gauge";
import QuestionCard from "@/components/QuestionCard";
import type { Answer } from "@/types";

export default function ExamResult() {
  const { runId } = useParams<{ runId: string }>();
  const { examRuns, loading } = useProgress();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  const run = examRuns.find((r) => r.id === Number(runId));
  if (!run) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>Result not found.</p>
        <Link to="/exam" className="mt-3 block text-sm text-accent hover:underline">
          Start a new exam
        </Link>
      </div>
    );
  }

  const mins = run.durationUsedSec !== undefined ? Math.floor(run.durationUsedSec / 60) : null;
  const secs = run.durationUsedSec !== undefined ? run.durationUsedSec % 60 : null;

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center">
          <Gauge value={run.overall} label="Overall score" />
          {mins !== null && (
            <p className="mt-2 text-xs text-slate-500">
              Time used: {mins}m {secs}s
            </p>
          )}
        </div>
        <div className="w-full sm:flex-1 sm:pl-6">
          <h1 className="text-xl font-semibold">Exam Result</h1>
          <p className="mt-1 text-sm text-slate-400">
            {run.items.length} questions graded.
          </p>
          <div className="mt-4 flex gap-3">
            <Link to="/exam" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
              New exam
            </Link>
            <Link to="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500">
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Per-domain breakdown</h2>
        {Object.entries(run.byDomain).map(([domainId, score]) => {
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
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score * 100}%`, background: bandColor[b] }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <p className="text-xs text-slate-500">
          Cisco does not publish a fixed passing score. These readiness bands reflect your performance per domain.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Question review ({run.items.length} items)
        </h2>

        {run.items.map((item, i) => {
          const q = getQuestion(item.questionId);
          if (!q) return null;
          const isOpen = expanded.has(item.questionId);
          const correct = item.score >= 1;
          const partial = item.score > 0 && item.score < 1;

          return (
            <div
              key={item.questionId}
              className={`rounded-lg border ${correct ? "border-green-700/50" : partial ? "border-yellow-700/50" : "border-red-700/50"} bg-surface overflow-hidden`}
            >
              <button
                onClick={() => toggle(item.questionId)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`shrink-0 text-sm font-medium ${correct ? "text-green-400" : partial ? "text-yellow-400" : "text-red-400"}`}>
                    {correct ? "✓" : partial ? "~" : "✗"}
                  </span>
                  <span className="text-xs text-slate-500 shrink-0">Q{i + 1}</span>
                  <span className="truncate text-sm text-slate-300">{q.stem.slice(0, 80)}{q.stem.length > 80 ? "..." : ""}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 ml-2">
                  <span className="text-xs text-slate-500">{Math.round(item.score * 100)}%</span>
                  {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-700/50 p-4">
                  <QuestionCard
                    question={q}
                    answer={{} as Answer}
                    onChange={() => {}}
                    revealed={true}
                    readOnly={true}
                  />
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
