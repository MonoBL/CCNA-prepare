import { resources } from "@/data/content";
import { ExternalLink, BookMarked } from "lucide-react";

function LinkRow({ label, url, sub, highlight }: { label: string; url: string; sub?: string; highlight?: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-colors hover:border-slate-500 ${
        highlight
          ? "border-accent/40 bg-accent/5"
          : "border-slate-700 bg-surface"
      }`}
    >
      <span>
        <span className="block text-sm">{label}</span>
        {sub && <span className="block text-xs text-slate-500 mt-0.5">{sub}</span>}
      </span>
      <ExternalLink size={15} className="mt-0.5 shrink-0 text-slate-500" />
    </a>
  );
}

const OFFICIAL_START = [
  {
    label: "CCNA 200-301 Exam Topics & Study Guide",
    url: "https://learningnetwork.cisco.com/s/ccna-exam-topics",
    sub: "Official Cisco learning network - exam blueprint, topics, and study resources",
    highlight: true
  },
  {
    label: "Official Exam Topics PDF (v1.1)",
    url: "https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf",
    sub: "Direct PDF - exam domains, weights, and all sub-topics (v1.1, effective 2024-08-20)"
  }
];

export default function Resources() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 sm:p-6">
      <section>
        <h1 className="text-2xl font-semibold">Resources</h1>
        <p className="mt-1 text-sm text-slate-400">
          Verified links. All open in a new tab and require network.
        </p>
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <BookMarked size={16} className="text-accent" />
          <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Start here - official Cisco
          </h2>
        </div>
        {OFFICIAL_START.map((r) => (
          <LinkRow key={r.url} label={r.label} url={r.url} sub={r.sub} highlight={r.highlight} />
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm uppercase tracking-wide text-slate-400">Course + videos</h2>
        {resources.global.map((g) => (
          <LinkRow key={g.url} label={g.label} url={g.url} sub={g.type} />
        ))}
      </section>

      {resources.domains.map((d) => (
        <section key={d.id} className="space-y-2">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">
            {d.id} {d.name}
          </h2>
          {d.ciscoDocs.map((doc) => (
            <LinkRow key={doc.url} label={doc.title} url={doc.url} sub={`${doc.topic} · ${doc.resourceType}`} />
          ))}
          {d.jitsCoverage && <p className="px-1 text-xs text-slate-500">JITS: {d.jitsCoverage}</p>}
          {d.courseModules && d.courseModules.length > 0 && (
            <p className="px-1 text-xs text-slate-500">Cisco course modules: {d.courseModules.join("; ")}</p>
          )}
        </section>
      ))}
    </div>
  );
}
