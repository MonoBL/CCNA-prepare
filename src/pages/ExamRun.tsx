import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Flag, Grid3x3, X } from "lucide-react";
import type { Question, Answer } from "@/types";
import QuestionCard from "@/components/QuestionCard";
import { gradeExam, EXAM_DURATION_SEC } from "@/lib/exam";
import * as db from "@/data/db";
import { useProgress } from "@/state/ProgressContext";

interface RunState {
  questions: Question[];
  startedAt: number;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ExamRun() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RunState | null;
  const { reload } = useProgress();

  const questions = state?.questions ?? [];
  const startedAt = state?.startedAt ?? Date.now();

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showNav, setShowNav] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);

  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  const initial = Math.max(0, EXAM_DURATION_SEC - elapsed);
  const [remaining, setRemaining] = useState(initial);

  const submitExam = useCallback(
    async (remainingSec: number) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitted(true);
      const used = EXAM_DURATION_SEC - remainingSec;
      const run = gradeExam(questions, answers, used);
      const id = await db.addExamRun(run);
      await reload();
      navigate(`/exam/result/${id}`, { replace: true });
    },
    [questions, answers, navigate, reload]
  );

  useEffect(() => {
    if (remaining <= 0) {
      submitExam(0);
      return;
    }
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { submitExam(0); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [remaining, submitExam]);

  if (questions.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400">
        No exam loaded. <button onClick={() => navigate("/exam")} className="text-accent underline">Start a new exam.</button>
      </div>
    );
  }

  if (submitted) {
    return <div className="p-6 text-center text-slate-400">Grading exam...</div>;
  }

  const q = questions[idx];
  const answer = answers[q.id] ?? {};
  const isFlagged = flagged.has(q.id);
  const answeredCount = Object.keys(answers).filter((id) => {
    const a = answers[id];
    return (a.selected?.length ?? 0) > 0 || Object.keys(a.mapping ?? {}).length > 0;
  }).length;

  function toggleFlag() {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }

  function getStatus(qid: string): "answered" | "flagged" | "unanswered" {
    const a = answers[qid];
    const hasAns = (a?.selected?.length ?? 0) > 0 || Object.keys(a?.mapping ?? {}).length > 0;
    if (flagged.has(qid)) return "flagged";
    if (hasAns) return "answered";
    return "unanswered";
  }

  const urgent = remaining <= 300; // last 5 min

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col">
      {/* Top bar */}
      <div className="sticky top-14 z-10 flex items-center justify-between border-b border-slate-800 bg-bg/95 px-4 py-2 backdrop-blur">
        <span className="text-sm text-slate-400">
          Q {idx + 1} / {questions.length}
          <span className="ml-3 text-xs text-slate-500">{answeredCount} answered</span>
        </span>
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-lg font-semibold tabular-nums ${urgent ? "text-red-400" : "text-slate-200"}`}
            aria-live="polite"
          >
            {formatTime(remaining)}
          </span>
          <button
            onClick={() => setShowNav((v) => !v)}
            className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-slate-500"
            aria-label="Toggle navigator"
          >
            <Grid3x3 size={14} />
          </button>
        </div>
      </div>

      {/* Navigator overlay */}
      {showNav && (
        <div className="sticky top-[7rem] z-10 border-b border-slate-800 bg-slate-900 p-3">
          <div className="flex flex-wrap gap-1">
            {questions.map((item, i) => {
              const status = getStatus(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => { setIdx(i); setShowNav(false); }}
                  className={`h-8 w-8 rounded text-xs font-medium transition-colors touch-manipulation ${
                    i === idx
                      ? "bg-accent text-white"
                      : status === "answered"
                      ? "bg-green-800 text-green-200"
                      : status === "flagged"
                      ? "bg-yellow-800 text-yellow-200"
                      : "bg-slate-700 text-slate-400"
                  }`}
                  aria-label={`Question ${i + 1} ${status}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-green-800" /> Answered</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-yellow-800" /> Flagged</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-slate-700" /> Unanswered</span>
          </div>
        </div>
      )}

      {/* Question */}
      <div className="flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">{q.subtopic} - {q.difficulty}</span>
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
                isFlagged
                  ? "border-yellow-600 bg-yellow-900/30 text-yellow-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-500"
              }`}
              aria-label={isFlagged ? "Remove flag" : "Flag for review"}
            >
              <Flag size={12} /> {isFlagged ? "Flagged" : "Flag"}
            </button>
          </div>

          <QuestionCard
            question={q}
            answer={answer}
            onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
            revealed={false}
          />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-20 border-t border-slate-800 bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:opacity-40 hover:border-slate-500 transition-colors"
          >
            Previous
          </button>

          {idx < questions.length - 1 ? (
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="rounded-lg bg-slate-700 px-6 py-2 text-sm font-medium hover:bg-slate-600 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              Submit Exam
            </button>
          )}
        </div>
      </div>

      {/* Submit confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">Submit exam?</h2>
              <button onClick={() => setShowConfirm(false)} aria-label="Close">
                <X size={18} className="text-slate-400 hover:text-slate-200" />
              </button>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-slate-400">
              <p>Answered: <span className="text-slate-200">{answeredCount} / {questions.length}</span></p>
              <p>Flagged: <span className="text-slate-200">{flagged.size}</span></p>
              <p>Time remaining: <span className="text-slate-200">{formatTime(remaining)}</span></p>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Unanswered questions will be graded as incorrect.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm hover:border-slate-500"
              >
                Keep going
              </button>
              <button
                onClick={() => { setShowConfirm(false); submitExam(remaining); }}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent/90"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
