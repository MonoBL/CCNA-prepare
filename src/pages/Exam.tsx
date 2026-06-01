import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timer, AlertTriangle } from "lucide-react";
import { buildExam, EXAM_DURATION_SEC } from "@/lib/exam";
import { weights } from "@/data/content";

export default function Exam() {
  const navigate = useNavigate();
  const [count, setCount] = useState(100);

  function start() {
    const questions = buildExam(weights, count);
    navigate("/exam/run", {
      state: { questions, startedAt: Date.now() }
    });
  }

  const mins = Math.floor(EXAM_DURATION_SEC / 60);

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
      <section className="flex items-start gap-3">
        <Timer size={28} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <h1 className="text-2xl font-semibold">Full Exam Simulation</h1>
          <p className="mt-1 text-sm text-slate-400">
            Replicates the real CCNA 200-301 v1.1 experience.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-surface p-5 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Exam rules</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">•</span>
            <span>{mins}-minute countdown. Timer is always visible.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">•</span>
            <span>No answer feedback during the exam. Rationale revealed only after submission.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">•</span>
            <span>Questions are weighted by exam blueprint (items spread proportionally across all 6 domains).</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">•</span>
            <span>Use the navigator to jump between questions and flag items for review.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">•</span>
            <span>Exam auto-submits when time expires.</span>
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-slate-700 bg-surface p-5">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Number of items: <span className="text-accent font-semibold">{count}</span>
        </label>
        <input
          type="range"
          min={10}
          max={120}
          step={5}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>10</span>
          <span className="text-slate-400">Default: 100</span>
          <span>120</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Cisco does not publish the exact question count or passing score. This app shows
          readiness bands, not a fixed pass threshold.
        </p>
      </section>

      <div className="flex items-start gap-2 rounded-lg border border-yellow-600/30 bg-yellow-900/10 p-3 text-xs text-yellow-400">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span>
          Once started you cannot pause. Make sure you have {mins} minutes uninterrupted.
        </span>
      </div>

      <button
        onClick={start}
        className="w-full rounded-lg bg-accent py-3 font-medium text-white hover:bg-accent/90 transition-colors"
      >
        Start Exam ({count} questions, {mins} min)
      </button>
    </div>
  );
}
