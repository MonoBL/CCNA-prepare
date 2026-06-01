import { Link } from "react-router-dom";
import { useProgress } from "@/state/ProgressContext";
import { blueprint, weights, getDomain } from "@/data/content";
import { priorityOrder } from "@/lib/diagnostic";
import { dueQueue } from "@/lib/srs";
import { band, bandColor } from "@/lib/readiness";
import Gauge from "@/components/Gauge";

export default function Dashboard() {
  const { loading, overall, masteryByDomain, srs, examRuns } = useProgress();
  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  const order = priorityOrder(masteryByDomain, weights);
  const due = dueQueue(srs, Date.now()).length;
  const lastExam = examRuns.length ? examRuns[examRuns.length - 1] : null;
  const hasData = Object.keys(masteryByDomain).length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <section className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <Gauge value={overall} label="Overall readiness" />
        <div className="flex flex-col gap-2">
          {!hasData && (
            <Link to="/diagnostic" className="rounded-lg bg-accent px-4 py-2 text-center font-medium text-white">
              Start the diagnostic
            </Link>
          )}
          <Link to="/study" className="rounded-lg border border-slate-700 px-4 py-2 text-center">Continue studying</Link>
          <Link to="/review" className="rounded-lg border border-slate-700 px-4 py-2 text-center">
            Review {due > 0 ? `(${due} due)` : ""}
          </Link>
          <Link to="/exam" className="rounded-lg border border-slate-700 px-4 py-2 text-center">Take a full exam</Link>
        </div>
      </section>

      {lastExam && (
        <section className="rounded-lg border border-slate-700 bg-surface p-4">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Last exam</h2>
          <p className="mt-1 text-lg">{Math.round(lastExam.overall * 100)}% overall</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-slate-400">Focus order (priority)</h2>
        <ol className="space-y-2">
          {order.map((id, i) => {
            const d = getDomain(id);
            const score = masteryByDomain[id] ?? 0;
            return (
              <li key={id}>
                <Link
                  to={`/study/${id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-surface px-4 py-3 hover:border-slate-500"
                >
                  <span>
                    <span className="text-slate-500">{i + 1}.</span> {d?.name}{" "}
                    <span className="text-xs text-slate-500">({weights[id]}%)</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-24 overflow-hidden rounded bg-slate-700">
                      <span className="block h-full" style={{ width: `${score * 100}%`, background: bandColor[band(score)] }} />
                    </span>
                    <span className="w-10 text-right text-sm text-slate-400">{Math.round(score * 100)}%</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Priority = exam weight x (1 - mastery). Weak, high-weight domains rank first.
        </p>
      </section>

      <p className="text-center text-xs text-slate-600">
        Targeting CCNA 200-301 v1.1. {blueprint.domains.length} domains. Cisco does not publish a fixed passing score.
      </p>
    </div>
  );
}
