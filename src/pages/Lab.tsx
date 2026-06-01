import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, FlaskConical } from "lucide-react";
import { getLab, getDomain } from "@/data/content";

export default function Lab() {
  const { labId } = useParams<{ labId: string }>();
  const lab = getLab(labId ?? "");

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!lab) {
    return (
      <div className="p-6 text-center text-slate-400">
        Lab not found.{" "}
        <Link to="/labs" className="text-accent hover:underline">Back to labs</Link>
      </div>
    );
  }

  const domain = getDomain(lab.domain);
  const totalPoints = lab.rubric.reduce((s, r) => s + r.points, 0);
  const earnedPoints = lab.rubric
    .filter((r) => checked.has(r.id))
    .reduce((s, r) => s + r.points, 0);
  const score = totalPoints > 0 ? earnedPoints / totalPoints : 0;

  function toggle(id: string) {
    if (submitted) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/labs" className="flex items-center gap-1 hover:text-slate-200">
          <ArrowLeft size={14} /> Labs
        </Link>
        <span>/</span>
        <span className="text-slate-200">{lab.title}</span>
      </nav>

      <section>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-accent" />
            <h1 className="text-xl font-semibold">{lab.title}</h1>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded bg-slate-700 px-2 py-0.5 capitalize text-slate-300">{lab.type}</span>
            <span className="rounded bg-slate-700 px-2 py-0.5 text-slate-300">
              {domain?.name ?? lab.domain}
            </span>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
          {lab.subtopics.map((s) => <span key={s}>{s}</span>)}
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-surface p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">Scenario</h2>
        <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-line">{lab.scenario}</p>
      </section>

      {lab.topologyImage && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">Topology</h2>
          <img
            src={lab.topologyImage}
            alt="Lab topology diagram"
            className="max-w-full rounded-lg border border-slate-700"
          />
        </section>
      )}

      {lab.startingConfigs && Object.keys(lab.startingConfigs).length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">Starting configs</h2>
          {Object.entries(lab.startingConfigs).map(([device, cfg]) => (
            <div key={device} className="mb-2">
              <p className="mb-1 text-xs text-slate-400">{device}</p>
              <pre className="overflow-x-auto rounded border border-slate-700 bg-slate-900 p-3 text-xs text-green-300">
                {cfg}
              </pre>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">Tasks</h2>
        <ol className="space-y-2">
          {lab.tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3"
            >
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                {task.id}
              </span>
              <span className="text-sm text-slate-200">{task.text}</span>
            </li>
          ))}
        </ol>
        {lab.packetTracerFile && (
          <p className="mt-3 text-xs text-slate-500">
            Packet Tracer file: <span className="text-slate-400">{lab.packetTracerFile}</span>
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-700 bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Self-check rubric
          </h2>
          {submitted && (
            <span className={`text-sm font-semibold ${score >= 0.8 ? "text-green-400" : score >= 0.6 ? "text-yellow-400" : "text-red-400"}`}>
              {Math.round(score * 100)}%
            </span>
          )}
        </div>

        <p className="mb-4 text-xs text-slate-500">
          Complete each task in Packet Tracer, then check the items you have verified.
        </p>

        <div className="space-y-2">
          {lab.rubric.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isChecked
                    ? "border-green-600/50 bg-green-900/10"
                    : "border-slate-700 bg-surface/50 hover:border-slate-500"
                } ${submitted ? "cursor-default" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(item.id)}
                  disabled={submitted}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                />
                <div className="flex-1">
                  <span className="text-sm text-slate-200">{item.text}</span>
                  <span className="ml-2 text-xs text-slate-500">{item.points} pt{item.points !== 1 ? "s" : ""}</span>
                </div>
              </label>
            );
          })}
        </div>

        {!submitted && (
          <button
            onClick={() => setSubmitted(true)}
            className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            Grade lab ({earnedPoints}/{totalPoints} pts)
          </button>
        )}

        {submitted && (
          <div className={`mt-4 rounded-lg border p-3 text-sm ${score >= 0.8 ? "border-green-600/50 bg-green-900/10 text-green-400" : score >= 0.6 ? "border-yellow-600/50 bg-yellow-900/10 text-yellow-400" : "border-red-600/50 bg-red-900/10 text-red-400"}`}>
            Score: {earnedPoints}/{totalPoints} pts ({Math.round(score * 100)}%)
            {score < 1 && (
              <p className="mt-1 text-xs opacity-80">
                Review missed items, then check the solution below.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-700 bg-surface overflow-hidden">
        <button
          onClick={() => setSolutionOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
        >
          <span className="text-sm font-medium text-slate-300">Solution</span>
          {solutionOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>

        {solutionOpen && (
          <div className="border-t border-slate-700 px-5 py-4 space-y-4">
            {Object.entries(lab.solution.config).map(([device, cfg]) => (
              <div key={device}>
                <p className="mb-1 text-xs font-medium text-slate-400">{device}</p>
                <pre className="overflow-x-auto rounded border border-slate-700 bg-slate-900 p-3 text-xs text-green-300">
                  {cfg}
                </pre>
              </div>
            ))}
            <div>
              <p className="mb-1 text-xs font-medium text-slate-400">Explanation</p>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {lab.solution.explanation}
              </p>
            </div>
          </div>
        )}
      </section>

      {lab.references.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">References</h2>
          {lab.references.map((ref) => (
            <a
              key={ref.url}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <ExternalLink size={13} />
              {ref.label}
            </a>
          ))}
        </section>
      )}
    </div>
  );
}
