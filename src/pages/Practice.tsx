import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { blueprint, questions as allQuestions } from "@/data/content";
import type { QuestionType, Difficulty } from "@/types";

type DifficultyFilter = Difficulty | "all";
type TypeFilter = QuestionType | "all";

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { domainId?: string; subtopicId?: string } | null;

  const [domainId, setDomainId] = useState<string>(locationState?.domainId ?? "all");
  const [subtopicId] = useState<string>(locationState?.subtopicId ?? "");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [count, setCount] = useState(10);

  // Build filtered pool
  let pool = allQuestions;
  if (domainId !== "all") pool = pool.filter((q) => q.domain === domainId);
  if (subtopicId) pool = pool.filter((q) => q.subtopic === subtopicId);
  if (difficulty !== "all") pool = pool.filter((q) => q.difficulty === difficulty);
  if (type !== "all") pool = pool.filter((q) => q.type === type);

  const available = pool.length;
  const actualCount = Math.min(count, available);

  function start() {
    if (available === 0) return;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    navigate("/practice/run", {
      state: { questions: shuffled.slice(0, actualCount), mode: "practice" }
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
      <section>
        <h1 className="text-2xl font-semibold">Practice Setup</h1>
        <p className="mt-1 text-sm text-slate-400">
          Customize your practice session, then start.
        </p>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-700 bg-surface p-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Domain</label>
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-accent focus:outline-none"
          >
            <option value="all">All domains</option>
            {blueprint.domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
          <div className="flex gap-2">
            {(["all", "easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                  difficulty === d
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-slate-600 text-slate-400 hover:border-slate-400"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Question type</label>
          <div className="flex flex-wrap gap-2">
            {(["all", "single", "multi", "draganddrop"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  type === t
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-slate-600 text-slate-400 hover:border-slate-400"
                }`}
              >
                {t === "draganddrop" ? "Drag & drop" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Questions: <span className="text-accent">{Math.min(count, available)}</span>
            {available < count && available > 0 && (
              <span className="ml-2 text-xs text-slate-500">(only {available} available)</span>
            )}
          </label>
          <input
            type="range"
            min={5}
            max={Math.max(5, available)}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>5</span>
            <span>{Math.max(5, available)}</span>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-slate-700 bg-surface/50 px-4 py-3 text-sm text-slate-400">
        {available === 0 ? (
          <span className="text-yellow-500">No questions match this filter. Adjust the filters above.</span>
        ) : (
          <span>
            <span className="text-slate-200 font-medium">{available}</span> questions match the current filter.
            Session will use <span className="text-slate-200 font-medium">{actualCount}</span>.
          </span>
        )}
      </div>

      <button
        onClick={start}
        disabled={available === 0}
        className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Start Practice ({actualCount} question{actualCount !== 1 ? "s" : ""})
      </button>
    </div>
  );
}
