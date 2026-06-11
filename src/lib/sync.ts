// Cross-device progress sync against the server API (server/server.mjs).
// Offline-first: IndexedDB stays the source of truth for the UI; the
// server holds a merged copy so PC and phone share the same progress.
//
// Strategy:
//  - pullAndMerge() on app start: download server copy, merge with local
//    (union of attempts/exam runs/diagnostics, freshest SRS card per
//    question, union of favorites), import the merge locally and push it.
//  - schedulePush() after every write: debounced upload of the local export.
//  - All network failures are swallowed: offline use keeps working and the
//    next successful sync reconciles.
import * as db from "@/data/db";
import { authToken, currentUser } from "@/auth/auth";
import type { Attempt, DiagnosticRecord, ExamRun, ProgressExport, SrsCard } from "@/types";

function endpoint(): string | null {
  const user = currentUser();
  return user ? `/api/progress/${user.id}` : null;
}

function headers(): Record<string, string> {
  return { "Content-Type": "application/json", "X-Auth": authToken() ?? "" };
}

const attemptKey = (a: Attempt) => `${a.questionId}|${a.ts}|${a.mode}`;

function mergeExports(local: ProgressExport, remote: ProgressExport): ProgressExport {
  // Attempts / exam runs / diagnostics: union, deduped by content key.
  // Auto-increment ids differ between devices, so strip them and let
  // IndexedDB assign fresh ones on import.
  const attempts = new Map<string, Attempt>();
  for (const a of [...remote.attempts, ...local.attempts]) {
    attempts.set(attemptKey(a), { ...a, id: undefined });
  }

  const examRuns = new Map<number, ExamRun>();
  for (const r of [...remote.examRuns, ...local.examRuns]) {
    examRuns.set(r.ts, { ...r, id: undefined });
  }

  const diagnostics = new Map<number, DiagnosticRecord>();
  for (const d of [...remote.diagnostics, ...local.diagnostics]) {
    diagnostics.set(d.ts, { ...d, id: undefined });
  }

  // SRS: per question keep the card that was reviewed further into the
  // schedule (more reps; due date as tiebreaker).
  const srs = new Map<string, SrsCard>();
  for (const c of [...remote.srs, ...local.srs]) {
    const prev = srs.get(c.questionId);
    if (!prev || c.reps > prev.reps || (c.reps === prev.reps && c.due > prev.due)) {
      srs.set(c.questionId, c);
    }
  }

  // Settings: newer export wins, except favorites which are unioned.
  const localNewer = (local.exportedAt ?? 0) >= (remote.exportedAt ?? 0);
  const settings = { ...(localNewer ? remote.settings : local.settings), ...(localNewer ? local.settings : remote.settings) };
  const favA = (local.settings?.favorites as string[] | undefined) ?? [];
  const favB = (remote.settings?.favorites as string[] | undefined) ?? [];
  settings.favorites = [...new Set([...favA, ...favB])];

  return {
    version: 1,
    exportedAt: Date.now(),
    attempts: [...attempts.values()],
    srs: [...srs.values()],
    examRuns: [...examRuns.values()],
    diagnostics: [...diagnostics.values()],
    settings
  };
}

async function pushNow(): Promise<void> {
  const url = endpoint();
  if (!url) return;
  const data = await db.exportAll();
  data.exportedAt = Date.now();
  await fetch(url, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
}

/** Pull the server copy, merge with local data, store and push the merge. */
export async function pullAndMerge(): Promise<boolean> {
  const url = endpoint();
  if (!url) return false;
  try {
    const res = await fetch(url, { headers: headers() });
    if (res.status === 404) {
      // First sync for this user: seed the server with local data.
      await pushNow();
      return false;
    }
    if (!res.ok) return false;
    const remote: ProgressExport = await res.json();
    const local = await db.exportAll();
    const merged = mergeExports(local, remote);
    await db.importAll(merged);
    await fetch(url, { method: "PUT", headers: headers(), body: JSON.stringify(merged) });
    return true;
  } catch {
    return false; // offline or server down: keep working locally
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced upload of local progress, called after every write. */
export function schedulePush(delayMs = 2000): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    pushNow().catch(() => {});
  }, delayMs);
}

/** Flush a pending push immediately (e.g. when the tab is hidden). */
export function flushPush(): void {
  if (!pushTimer) return;
  clearTimeout(pushTimer);
  pushTimer = null;
  pushNow().catch(() => {});
}
