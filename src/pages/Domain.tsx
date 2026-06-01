import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, FlaskConical, GraduationCap, ChevronDown, ChevronUp } from "lucide-react";
import { getDomain, resourcesForDomain, questionsByDomain, labsByDomain } from "@/data/content";
import { useProgress } from "@/state/ProgressContext";
import { band, bandColor } from "@/lib/readiness";
import { examInsights } from "@/data/examInsights";

export default function Domain() {
  const { domainId } = useParams<{ domainId: string }>();
  const { masteryBySubtopic, loading } = useProgress();
  const [insightOpen, setInsightOpen] = useState(false);
  const domain = getDomain(domainId ?? "");
  const domainRes = resourcesForDomain(domainId ?? "");
  const qs = questionsByDomain(domainId ?? "");
  const domainLabs = labsByDomain(domainId ?? "");

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;
  if (!domain) return <div className="p-6 text-slate-400">Domain not found.</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <Link to="/study" className="flex items-center gap-1 hover:text-slate-200">
          <ArrowLeft size={14} /> Study
        </Link>
        <ChevronRight size={14} />
        <span className="text-slate-200">{domain.id} {domain.name}</span>
      </nav>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">{domain.name}</h1>
          <span className="rounded bg-slate-700 px-2 py-0.5 text-sm text-slate-300">
            {domain.weightPct}% of exam
          </span>
        </div>
        <div className="mt-1 flex gap-4 text-sm text-slate-400">
          <span>{qs.length} question{qs.length !== 1 ? "s" : ""}</span>
          {domainLabs.length > 0 && <span>{domainLabs.length} lab{domainLabs.length !== 1 ? "s" : ""}</span>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Topics</h2>
        {domain.subtopics.map((topic) => {
          const score = masteryBySubtopic[topic.id] ?? 0;
          const b = band(score);
          const hasChildren = topic.children && topic.children.length > 0;

          return (
            <div key={topic.id} className="rounded-lg border border-slate-700 bg-surface">
              <Link
                to={`/study/${domainId}/${topic.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 font-mono text-xs text-slate-500">{topic.id}</span>
                    <span className="text-sm">{topic.title}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1 w-20 overflow-hidden rounded-full bg-slate-700">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${score * 100}%`, background: bandColor[b] }}
                      />
                    </span>
                    <span className="text-xs text-slate-500">{Math.round(score * 100)}%</span>
                  </div>
                </div>
                <ChevronRight size={14} className="ml-3 shrink-0 text-slate-500" />
              </Link>

              {hasChildren && (
                <ul className="border-t border-slate-700/50">
                  {topic.children!.map((child) => {
                    const childScore = masteryBySubtopic[child.id] ?? 0;
                    const cb = band(childScore);
                    return (
                      <li key={child.id}>
                        <Link
                          to={`/study/${domainId}/${child.id}`}
                          className="flex items-center justify-between px-4 py-2.5 pl-8 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="shrink-0 font-mono text-xs text-slate-600">{child.id}</span>
                            <span className="text-sm text-slate-300">{child.title}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <span className="h-1 w-12 overflow-hidden rounded-full bg-slate-700">
                              <span
                                className="block h-full rounded-full"
                                style={{ width: `${childScore * 100}%`, background: bandColor[cb] }}
                              />
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {examInsights[domainId ?? ""] && (
        <section className="rounded-lg border border-slate-700 bg-surface overflow-hidden">
          <button
            onClick={() => setInsightOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-accent" />
              <span className="text-sm font-medium text-slate-200">What to expect on the real exam</span>
            </div>
            {insightOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
          </button>

          {insightOpen && (() => {
            const ins = examInsights[domainId ?? ""];
            return (
              <div className="border-t border-slate-700 px-4 py-4 space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">{ins.summary}</p>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Question types you will see</p>
                  <ul className="space-y-1">
                    {ins.questionTypes.map((qt) => (
                      <li key={qt} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {qt}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Hot topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ins.hotTopics.map((t) => (
                      <span key={t} className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                        {t.split(":")[0]}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {ins.hotTopics.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-accent">Exam tips</p>
                  <ul className="space-y-1.5">
                    {ins.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-slate-200">
                        <span className="mt-0.5 shrink-0 text-accent">→</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-600">
                  Guidance based on the official Cisco CCNA 200-301 v1.1 exam blueprint. No real exam questions reproduced.
                </p>
              </div>
            );
          })()}
        </section>
      )}

      {domainLabs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Labs</h2>
          {domainLabs.map((lab) => (
            <Link
              key={lab.id}
              to={`/labs/${lab.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3 hover:border-slate-500 transition-colors"
            >
              <FlaskConical size={16} className="shrink-0 text-accent" />
              <span className="text-sm">{lab.title}</span>
              <span className="ml-auto rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                {lab.type}
              </span>
            </Link>
          ))}
        </section>
      )}

      {domainRes && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Resources</h2>
          {domainRes.ciscoDocs.slice(0, 4).map((doc) => (
            <a
              key={doc.url}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-slate-700 bg-surface px-4 py-3 text-sm hover:border-slate-500 transition-colors"
            >
              <span className="text-slate-200">{doc.title}</span>
              <span className="ml-2 text-xs text-slate-500">{doc.topic}</span>
            </a>
          ))}
          <Link to="/resources" className="text-xs text-accent hover:underline">
            All resources
          </Link>
        </section>
      )}
    </div>
  );
}
