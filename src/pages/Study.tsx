import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { blueprint } from "@/data/content";
import { useProgress } from "@/state/ProgressContext";
import { band, bandColor } from "@/lib/readiness";

export default function Study() {
  const { masteryByDomain, loading } = useProgress();
  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <section>
        <h1 className="text-2xl font-semibold">Study</h1>
        <p className="mt-1 text-sm text-slate-400">
          {blueprint.domains.length} domains, {blueprint.domains.reduce((s, d) => s + d.subtopics.length, 0)} topics.
        </p>
      </section>

      <ol className="space-y-3">
        {blueprint.domains.map((d) => {
          const score = masteryByDomain[d.id] ?? 0;
          const b = band(score);
          const topicCount = d.subtopics.length;
          const childCount = d.subtopics.reduce((s, t) => s + (t.children?.length ?? 0), 0);

          return (
            <li key={d.id}>
              <Link
                to={`/study/${d.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-surface px-4 py-4 hover:border-slate-500 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded bg-slate-700 px-2 py-0.5 text-xs font-mono text-slate-300">
                      {d.id}
                    </span>
                    <span className="truncate font-medium">{d.name}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-700">
                      <span
                        className="block h-full rounded-full transition-all"
                        style={{ width: `${score * 100}%`, background: bandColor[b] }}
                      />
                    </span>
                    <span className="text-xs text-slate-400">{Math.round(score * 100)}% mastery</span>
                  </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-3 text-right">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{d.weightPct}% of exam</div>
                    <div className="text-xs text-slate-500">{topicCount} topics{childCount > 0 ? ` + ${childCount} sub` : ""}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
