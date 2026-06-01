import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, ExternalLink, BookOpen } from "lucide-react";
import { blueprint, getDomain, resourcesForDomain, questionsBySubtopic } from "@/data/content";
import { useProgress } from "@/state/ProgressContext";
import { band, bandColor } from "@/lib/readiness";

function findTopicTitle(domainId: string, subtopicId: string): string {
  const d = blueprint.domains.find((d) => d.id === domainId);
  if (!d) return subtopicId;
  for (const t of d.subtopics) {
    if (t.id === subtopicId) return t.title;
    for (const c of t.children ?? []) {
      if (c.id === subtopicId) return c.title;
    }
  }
  return subtopicId;
}

function findParentTopic(domainId: string, subtopicId: string): { id: string; title: string } | null {
  const d = blueprint.domains.find((d) => d.id === domainId);
  if (!d) return null;
  for (const t of d.subtopics) {
    for (const c of t.children ?? []) {
      if (c.id === subtopicId) return { id: t.id, title: t.title };
    }
  }
  return null;
}

export default function Subtopic() {
  const { domainId = "", subtopicId = "" } = useParams<{ domainId: string; subtopicId: string }>();
  const { masteryBySubtopic, loading } = useProgress();

  const domain = getDomain(domainId);
  const topicTitle = findTopicTitle(domainId, subtopicId);
  const parentTopic = findParentTopic(domainId, subtopicId);
  const domainRes = resourcesForDomain(domainId);
  const qs = questionsBySubtopic(subtopicId);
  const score = masteryBySubtopic[subtopicId] ?? 0;
  const b = band(score);

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  // Filter resources relevant to this topic (all from domain for now)
  const relatedDocs = domainRes?.ciscoDocs ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-400">
        <Link to="/study" className="flex items-center gap-1 hover:text-slate-200">
          <ArrowLeft size={14} /> Study
        </Link>
        <ChevronRight size={14} />
        <Link to={`/study/${domainId}`} className="hover:text-slate-200">
          {domain?.name ?? domainId}
        </Link>
        {parentTopic && (
          <>
            <ChevronRight size={14} />
            <Link to={`/study/${domainId}/${parentTopic.id}`} className="hover:text-slate-200 max-w-xs truncate">
              {parentTopic.id} {parentTopic.title}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-slate-300">{subtopicId}</span>
      </nav>

      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-sm text-slate-500">{subtopicId}</span>
            <h1 className="mt-0.5 text-xl font-semibold leading-snug">{topicTitle}</h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs text-slate-400">{Math.round(score * 100)}% mastery</span>
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-700">
              <span className="block h-full rounded-full" style={{ width: `${score * 100}%`, background: bandColor[b] }} />
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-accent" />
          <h2 className="text-sm font-medium text-slate-200">Study guidance</h2>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          This subtopic covers <strong className="text-slate-200">{topicTitle}</strong> as part of the CCNA 200-301 v1.1 blueprint
          under domain {domain?.name}. Cisco allocates {domain?.weightPct}% of exam weight to this domain. Review
          the resources below, then practice questions to build mastery.
        </p>
        {qs.length > 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            {qs.length} question{qs.length !== 1 ? "s" : ""} available in this subtopic.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-600">No questions yet for this exact subtopic. Try practising the full domain.</p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {qs.length > 0 && (
          <Link
            to="/practice"
            state={{ subtopicId, domainId }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            Practice ({qs.length} questions)
          </Link>
        )}
        <Link
          to={`/practice`}
          state={{ domainId }}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:border-slate-500 transition-colors"
        >
          Practice whole domain
        </Link>
      </div>

      {relatedDocs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Domain resources ({domain?.name})
          </h2>
          {relatedDocs.map((doc) => (
            <a
              key={doc.url}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3 hover:border-slate-500 transition-colors"
            >
              <div>
                <span className="block text-sm text-slate-200">{doc.title}</span>
                <span className="block text-xs text-slate-500">{doc.topic} - {doc.resourceType}</span>
              </div>
              <ExternalLink size={14} className="mt-0.5 shrink-0 text-slate-500" />
            </a>
          ))}
        </section>
      )}

      {domainRes?.jitsCoverage && (
        <p className="text-xs text-slate-500">JITS coverage: {domainRes.jitsCoverage}</p>
      )}
      {domainRes?.courseModules && domainRes.courseModules.length > 0 && (
        <p className="text-xs text-slate-500">
          Cisco course modules: {domainRes.courseModules.join("; ")}
        </p>
      )}
    </div>
  );
}
