// IndexedDB layer (idb). Persists progress fully offline.
// Each signed-in user gets their own database (see auth.ts dbName),
// so progress never mixes between users.
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { currentUser } from "@/auth/auth";
import type {
  Attempt,
  SrsCard,
  ExamRun,
  DiagnosticRecord,
  ProgressExport
} from "@/types";

interface CcnaDB extends DBSchema {
  attempts: { key: number; value: Attempt; indexes: { byQuestion: string; byDomain: string } };
  srs: { key: string; value: SrsCard };
  examRuns: { key: number; value: ExamRun };
  diagnostics: { key: number; value: DiagnosticRecord };
  settings: { key: string; value: { key: string; value: unknown } };
}

const DB_VERSION = 1;

let dbp: Promise<IDBPDatabase<CcnaDB>> | null = null;

function db(): Promise<IDBPDatabase<CcnaDB>> {
  if (!dbp) {
    // The login gate renders before any page touches the DB, so a user
    // is always set here. Fall back to the original DB name just in case.
    const dbName = currentUser()?.dbName ?? "ccna-pwa";
    dbp = openDB<CcnaDB>(dbName, DB_VERSION, {
      upgrade(d) {
        const a = d.createObjectStore("attempts", { keyPath: "id", autoIncrement: true });
        a.createIndex("byQuestion", "questionId");
        a.createIndex("byDomain", "domain");
        d.createObjectStore("srs", { keyPath: "questionId" });
        d.createObjectStore("examRuns", { keyPath: "id", autoIncrement: true });
        d.createObjectStore("diagnostics", { keyPath: "id", autoIncrement: true });
        d.createObjectStore("settings", { keyPath: "key" });
      }
    });
  }
  return dbp;
}

// ---- attempts ----
export async function addAttempt(a: Attempt): Promise<number> {
  return (await db()).add("attempts", a) as Promise<number>;
}
export async function getAttempts(): Promise<Attempt[]> {
  return (await db()).getAll("attempts");
}

// ---- srs ----
export async function getSrs(questionId: string): Promise<SrsCard | undefined> {
  return (await db()).get("srs", questionId);
}
export async function putSrs(card: SrsCard): Promise<void> {
  await (await db()).put("srs", card);
}
export async function getAllSrs(): Promise<SrsCard[]> {
  return (await db()).getAll("srs");
}

// ---- exam runs ----
export async function addExamRun(r: ExamRun): Promise<number> {
  return (await db()).add("examRuns", r) as Promise<number>;
}
export async function getExamRuns(): Promise<ExamRun[]> {
  return (await db()).getAll("examRuns");
}
export async function getExamRun(id: number): Promise<ExamRun | undefined> {
  return (await db()).get("examRuns", id);
}

// ---- diagnostics ----
export async function addDiagnostic(d2: DiagnosticRecord): Promise<number> {
  return (await db()).add("diagnostics", d2) as Promise<number>;
}
export async function getDiagnostics(): Promise<DiagnosticRecord[]> {
  return (await db()).getAll("diagnostics");
}

// ---- settings ----
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await (await db()).get("settings", key);
  return row?.value as T | undefined;
}
export async function setSetting(key: string, value: unknown): Promise<void> {
  await (await db()).put("settings", { key, value });
}

// ---- export / import / reset ----
export async function exportAll(): Promise<ProgressExport> {
  const d = await db();
  const settingsRows = await d.getAll("settings");
  return {
    version: 1,
    exportedAt: Date.now(),
    attempts: await d.getAll("attempts"),
    srs: await d.getAll("srs"),
    examRuns: await d.getAll("examRuns"),
    diagnostics: await d.getAll("diagnostics"),
    settings: Object.fromEntries(settingsRows.map((r) => [r.key, r.value]))
  };
}

export async function importAll(data: ProgressExport): Promise<void> {
  const d = await db();
  const tx = d.transaction(["attempts", "srs", "examRuns", "diagnostics", "settings"], "readwrite");
  await Promise.all([
    tx.objectStore("attempts").clear(),
    tx.objectStore("srs").clear(),
    tx.objectStore("examRuns").clear(),
    tx.objectStore("diagnostics").clear(),
    tx.objectStore("settings").clear()
  ]);
  for (const a of data.attempts) await tx.objectStore("attempts").put(a);
  for (const s of data.srs) await tx.objectStore("srs").put(s);
  for (const e of data.examRuns) await tx.objectStore("examRuns").put(e);
  for (const dg of data.diagnostics) await tx.objectStore("diagnostics").put(dg);
  for (const [key, value] of Object.entries(data.settings ?? {}))
    await tx.objectStore("settings").put({ key, value });
  await tx.done;
}

export async function resetAll(): Promise<void> {
  const d = await db();
  const tx = d.transaction(["attempts", "srs", "examRuns", "diagnostics", "settings"], "readwrite");
  await Promise.all([
    tx.objectStore("attempts").clear(),
    tx.objectStore("srs").clear(),
    tx.objectStore("examRuns").clear(),
    tx.objectStore("diagnostics").clear(),
    tx.objectStore("settings").clear()
  ]);
  await tx.done;
}
