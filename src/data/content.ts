// Loads bundled content JSON and builds lookup indexes.
// Content is imported at build time so the app is fully offline.
import blueprintJson from "@content/blueprint.json";
import resourcesJson from "@content/resources.json";
import questionsJson from "@content/questions.seed.json";
import labsJson from "@content/labs.seed.json";
import type {
  Blueprint,
  Resources,
  Question,
  Lab,
  DomainId,
  Domain,
  DomainResources
} from "@/types";

export const blueprint = blueprintJson as unknown as Blueprint;
export const resources = resourcesJson as unknown as Resources;
export const questions = questionsJson as unknown as Question[];
export const labs = labsJson as unknown as Lab[];

// Exam weights as a map, e.g. { "1.0": 20, ... }
export const weights: Record<string, number> = Object.fromEntries(
  blueprint.domains.map((d) => [d.id, d.weightPct])
);

export const domainIds = blueprint.domains.map((d) => d.id) as DomainId[];

// ---- Indexes ----
const byId = new Map<string, Question>(questions.map((q) => [q.id, q]));
const labById = new Map<string, Lab>(labs.map((l) => [l.id, l]));

export const getQuestion = (id: string): Question | undefined => byId.get(id);
export const getLab = (id: string): Lab | undefined => labById.get(id);

export const getDomain = (id: string): Domain | undefined =>
  blueprint.domains.find((d) => d.id === id);

export const questionsByDomain = (id: string): Question[] =>
  questions.filter((q) => q.domain === id);

export const questionsBySubtopic = (id: string): Question[] =>
  questions.filter((q) => q.subtopic === id);

export const labsByDomain = (id: string): Lab[] => labs.filter((l) => l.domain === id);

export const resourcesForDomain = (id: string): DomainResources | undefined =>
  resources.domains.find((d) => d.id === id);

// Flat list of every blueprint subtopic id (parents + lettered children).
export const subtopicFlatList = (): { id: string; title: string; domain: DomainId }[] => {
  const out: { id: string; title: string; domain: DomainId }[] = [];
  for (const d of blueprint.domains) {
    for (const t of d.subtopics) {
      out.push({ id: t.id, title: t.title, domain: d.id });
      for (const c of t.children ?? []) out.push({ id: c.id, title: c.title, domain: d.id });
    }
  }
  return out;
};
