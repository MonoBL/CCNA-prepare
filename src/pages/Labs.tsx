import { Link } from "react-router-dom";
import { FlaskConical, ChevronRight } from "lucide-react";
import { blueprint, labsByDomain } from "@/data/content";

export default function Labs() {
  const domainLabs = blueprint.domains.map((d) => ({
    domain: d,
    labs: labsByDomain(d.id)
  })).filter((dl) => dl.labs.length > 0);

  const totalLabs = domainLabs.reduce((s, dl) => s + dl.labs.length, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <section>
        <h1 className="text-2xl font-semibold">Labs</h1>
        <p className="mt-1 text-sm text-slate-400">
          {totalLabs} hands-on lab{totalLabs !== 1 ? "s" : ""} across{" "}
          {domainLabs.length} domain{domainLabs.length !== 1 ? "s" : ""}. Work in Packet Tracer and grade yourself.
        </p>
      </section>

      {domainLabs.map(({ domain, labs }) => (
        <section key={domain.id} className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-slate-400">
            <span className="font-mono">{domain.id}</span>
            <span>{domain.name}</span>
          </h2>

          {labs.map((lab) => (
            <Link
              key={lab.id}
              to={`/labs/${lab.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-4 hover:border-slate-500 transition-colors"
            >
              <FlaskConical size={18} className="shrink-0 text-accent" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{lab.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 capitalize">{lab.type}</span>
                  <span>{lab.tasks.length} task{lab.tasks.length !== 1 ? "s" : ""}</span>
                  <span>{lab.rubric.length} rubric item{lab.rubric.length !== 1 ? "s" : ""}</span>
                  {lab.subtopics.map((s) => (
                    <span key={s} className="text-slate-600">{s}</span>
                  ))}
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-slate-500" />
            </Link>
          ))}
        </section>
      ))}

      {totalLabs === 0 && (
        <div className="rounded-lg border border-slate-700 bg-surface p-4 sm:p-6 text-center text-slate-400">
          No labs available yet.
        </div>
      )}
    </div>
  );
}
