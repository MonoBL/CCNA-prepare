import { useState } from "react";
import { Link } from "react-router-dom";
import { RotateCw } from "lucide-react";
import { useProgress } from "@/state/ProgressContext";
import { getQuestion } from "@/data/content";
import { dueQueue, GRADE, review as srsReview } from "@/lib/srs";
import * as db from "@/data/db";
import QuestionCard from "@/components/QuestionCard";

const GRADE_LABELS = [
  { grade: GRADE.again, label: "Again", sub: "Complete blank", cls: "border-red-600 bg-red-900/20 text-red-400 hover:bg-red-900/40" },
  { grade: GRADE.hard, label: "Hard", sub: "Difficult recall", cls: "border-yellow-600 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/40" },
  { grade: GRADE.good, label: "Good", sub: "Correct with effort", cls: "border-blue-600 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40" },
  { grade: GRADE.easy, label: "Easy", sub: "Instant recall", cls: "border-green-600 bg-green-900/20 text-green-400 hover:bg-green-900/40" },
] as const;

export default function Review() {
  const { srs, loading, reload } = useProgress();
  const [flipped, setFlipped] = useState(false);
  const [sessionIdx, setSessionIdx] = useState(0);
  const [done, setDone] = useState(false);

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  const queue = dueQueue(srs, Date.now());

  if (queue.length === 0 || done) {
    return (
      <div className="mx-auto max-w-xl p-6 text-center space-y-4">
        <RotateCw size={40} className="mx-auto text-accent" />
        <h1 className="text-2xl font-semibold">{done ? "Session complete!" : "All caught up!"}</h1>
        <p className="text-slate-400">
          {done
            ? `Reviewed ${sessionIdx} card${sessionIdx !== 1 ? "s" : ""} this session.`
            : "No cards due for review right now. Come back later or study new topics to build your review queue."}
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/study" className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500">
            Study
          </Link>
          <Link to="/" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Slice from sessionIdx so we can track per-session progress
  const remaining = queue.slice(sessionIdx);

  if (remaining.length === 0) {
    if (!done) setDone(true);
    return null;
  }

  const card = remaining[0];
  const q = getQuestion(card.questionId);

  if (!q) {
    // Orphaned card - skip it
    setSessionIdx((i) => i + 1);
    return null;
  }

  const progress = sessionIdx;
  const total = queue.length;

  async function gradeCard(g: number) {
    const updated = srsReview(card, g, Date.now());
    await db.putSrs(updated);
    await reload();
    setFlipped(false);
    if (sessionIdx + 1 >= total) {
      setDone(true);
    } else {
      setSessionIdx((i) => i + 1);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Spaced Review</h1>
        <span className="text-sm text-slate-400">
          {progress + 1} / {total}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(progress / total) * 100}%` }}
        />
      </div>

      <div className="rounded-lg border border-slate-700 bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs text-slate-500">{q.subtopic} - {q.difficulty}</span>
          <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400 capitalize">
            {q.type === "draganddrop" ? "drag & drop" : q.type}
          </span>
        </div>

        {!flipped ? (
          <div className="space-y-4">
            <p className="text-base leading-relaxed text-slate-100">{q.stem}</p>
            {q.exhibit && (
              <pre className="overflow-x-auto rounded border border-slate-700 bg-slate-900 p-3 text-xs text-green-300">
                {q.exhibit}
              </pre>
            )}
            <button
              onClick={() => setFlipped(true)}
              className="w-full rounded-lg bg-slate-700 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
            >
              Show Answer
            </button>
          </div>
        ) : (
          <QuestionCard
            question={q}
            answer={{}}
            onChange={() => {}}
            revealed={true}
            readOnly={true}
          />
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADE_LABELS.map(({ grade, label, sub, cls }) => (
            <button
              key={grade}
              onClick={() => gradeCard(grade)}
              className={`rounded-lg border px-3 py-3 text-center transition-colors ${cls}`}
            >
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs opacity-70 mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-600">
        SM-2 algorithm: Again=reset, Hard=3, Good=4, Easy=5
      </p>
    </div>
  );
}
