// Stub shown for routes the build agent (Sonnet) still needs to implement.
// Replace each with a real page under src/pages/ per SPEC.md Section 5.
export default function PagePlaceholder({ title, spec }: { title: string; spec: string }) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-400">
        To be implemented by the build agent. See <code className="text-accent">{spec}</code>.
      </p>
      <div className="mt-6 rounded-lg border border-slate-700 bg-surface p-4 text-sm text-slate-300">
        Data and algorithms are ready: import from <code>@/data/content</code>,{" "}
        <code>@/lib</code>, and <code>@/state/ProgressContext</code>.
      </div>
    </div>
  );
}
