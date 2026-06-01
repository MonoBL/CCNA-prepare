import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Question, Answer, Mode } from "@/types";
import QuestionCard from "@/components/QuestionCard";
import { useProgress } from "@/state/ProgressContext";

interface RunState {
  questions: Question[];
  mode: Mode;
}

export default function PracticeRun() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RunState | null;
  const { recordAttempt } = useProgress();

  const questions = state?.questions ?? [];
  const mode = state?.mode ?? "practice";

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Record<string, number>>({});

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl p-4 sm:p-6 text-center">
        <p className="text-slate-400">No questions. Go back and configure a session.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500"
        >
          Back
        </button>
      </div>
    );
  }

  const q = questions[idx];
  const answer = answers[q.id] ?? {};
  const isRevealed = revealed.has(q.id);
  const isLast = idx === questions.length - 1;
  const done = Object.keys(scores).length === questions.length;

  function hasAnswer(a: Answer): boolean {
    if (q.type === "single" || q.type === "multi") return (a.selected?.length ?? 0) > 0;
    if (q.type === "draganddrop") return Object.keys(a.mapping ?? {}).length > 0;
    return false;
  }

  async function handleSubmit() {
    if (!hasAnswer(answer)) return;
    const score = await recordAttempt(q, answer, mode);
    setRevealed((prev) => new Set(prev).add(q.id));
    setScores((prev) => ({ ...prev, [q.id]: typeof score === "number" ? score : 0 }));
  }

  function handleNext() {
    if (isLast) {
      // Show summary - all answered
      if (done || Object.keys(scores).length === questions.length) {
        setIdx(questions.length); // trigger done screen
      } else {
        setIdx(questions.length);
      }
    } else {
      setIdx(idx + 1);
    }
  }

  // Done screen
  if (idx >= questions.length) {
    const total = questions.length;
    const answered = Object.keys(scores).length;
    const correct = Object.values(scores).filter((s) => s >= 1).length;
    const partial = Object.values(scores).filter((s) => s > 0 && s < 1).length;
    const overallPct = answered > 0 ? (Object.values(scores).reduce((s, x) => s + x, 0) / answered) * 100 : 0;

    return (
      <div className="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
        <section className="text-center">
          <h1 className="text-2xl font-semibold">Session complete</h1>
          <p className="mt-1 text-sm text-slate-400">
            {answered}/{total} questions answered
          </p>
        </section>

        <section className="rounded-lg border border-slate-700 bg-surface p-4 sm:p-6 text-center">
          <div className="text-5xl font-bold text-slate-100">{Math.round(overallPct)}%</div>
          <p className="mt-1 text-sm text-slate-400">overall score</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <span className="text-green-400">{correct} correct</span>
            {partial > 0 && <span className="text-yellow-400">{partial} partial</span>}
            <span className="text-red-400">{answered - correct - partial} wrong</span>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="flex-1 rounded-lg border border-slate-700 py-2 text-sm hover:border-slate-500 transition-colors"
          >
            New session
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/practice")}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
          >
            <ChevronLeft size={16} /> Exit
          </button>
          <span className="h-4 w-px bg-slate-700" />
          <span className="text-sm text-slate-400">
            {idx + 1} / {questions.length}
          </span>
        </div>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 w-4 rounded-full transition-colors ${
                i === idx
                  ? "bg-accent"
                  : revealed.has(questions[i].id)
                  ? scores[questions[i].id] >= 1
                    ? "bg-green-600"
                    : scores[questions[i].id] > 0
                    ? "bg-yellow-600"
                    : "bg-red-600"
                  : "bg-slate-700"
              }`}
              aria-label={`Question ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-surface p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Q{idx + 1} - {q.subtopic} - {q.difficulty}
          </span>
          <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400 capitalize">
            {q.type === "draganddrop" ? "drag & drop" : q.type}
          </span>
        </div>

        <QuestionCard
          question={q}
          answer={answer}
          onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
          revealed={isRevealed}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-40 hover:border-slate-500 transition-colors"
        >
          <ChevronLeft size={16} /> Prev
        </button>

        {!isRevealed ? (
          <button
            onClick={handleSubmit}
            disabled={!hasAnswer(answer)}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-slate-700 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
          >
            {isLast ? "Finish" : "Next"} <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
