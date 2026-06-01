import { useState, useRef } from "react";
import { AlertTriangle, Download, Upload, Trash2 } from "lucide-react";
import { useProgress } from "@/state/ProgressContext";
import * as db from "@/data/db";
import type { ProgressExport } from "@/types";

export default function Settings() {
  const { reset, reload } = useProgress();
  const [resetConfirm, setResetConfirm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const data = await db.exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ccna-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Progress exported.");
    } catch {
      setStatus("Export failed.");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: ProgressExport = JSON.parse(text);
      if (typeof data.version !== "number" || !Array.isArray(data.attempts)) {
        throw new Error("Invalid format");
      }
      await db.importAll(data);
      await reload();
      setStatus("Progress imported successfully.");
    } catch {
      setStatus("Import failed: invalid or corrupt file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleReset() {
    await reset();
    setResetConfirm(false);
    setStatus("All progress reset.");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 sm:p-6">
      <section>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your progress data.</p>
      </section>

      {status && (
        <div className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-200">
          {status}
          <button onClick={() => setStatus(null)} className="ml-3 text-slate-400 hover:text-slate-200">
            Dismiss
          </button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Progress data</h2>

        <button
          onClick={handleExport}
          className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3 text-left text-sm hover:border-slate-500 transition-colors"
        >
          <Download size={16} className="shrink-0 text-accent" />
          <div>
            <div className="font-medium text-slate-200">Export progress</div>
            <div className="text-xs text-slate-500">
              Downloads a JSON file with all attempts, SRS cards, exam runs, and diagnostics.
            </div>
          </div>
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-surface px-4 py-3 text-left text-sm hover:border-slate-500 transition-colors"
        >
          <Upload size={16} className="shrink-0 text-accent" />
          <div>
            <div className="font-medium text-slate-200">Import progress</div>
            <div className="text-xs text-slate-500">
              Replaces all current progress with data from a previously exported file.
            </div>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
          aria-hidden="true"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">Danger zone</h2>

        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="flex w-full items-center gap-3 rounded-lg border border-red-700/50 bg-red-900/10 px-4 py-3 text-left text-sm hover:border-red-600 transition-colors"
          >
            <Trash2 size={16} className="shrink-0 text-red-400" />
            <div>
              <div className="font-medium text-red-300">Reset all progress</div>
              <div className="text-xs text-red-400/70">
                Permanently deletes all attempts, SRS cards, exam runs, and diagnostics.
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-lg border border-red-600 bg-red-900/20 p-4 space-y-3">
            <div className="flex items-start gap-2 text-sm text-red-300">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>This will permanently delete all your progress. This cannot be undone. Are you sure?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setResetConfirm(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm hover:border-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Yes, reset everything
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-700 bg-surface p-4 space-y-2 text-xs text-slate-500">
        <p className="font-medium text-slate-400">About</p>
        <p>CCNA 200-301 Trainer - targeting exam version v1.1 (effective 2024-08-20).</p>
        <p>All progress is stored locally in your browser (IndexedDB). No data is sent to any server.</p>
        <p className="text-slate-600">
          Next exam version: 200-301 v2.0 goes live 2027-02-03 (restructured into 5 domains).
        </p>
      </section>
    </div>
  );
}
