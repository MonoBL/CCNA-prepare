// Domain model for the CCNA PWA. Mirrors schemas/*.schema.json.

export type DomainId = "1.0" | "2.0" | "3.0" | "4.0" | "5.0" | "6.0";
export type QuestionType = "single" | "multi" | "draganddrop" | "sim" | "simlet" | "testlet";
export type Difficulty = "easy" | "medium" | "hard";
export type Band = "red" | "yellow" | "green";
export type Mode = "practice" | "diagnostic" | "exam";

// ---- Blueprint ----
export interface TopicChild {
  id: string;
  title: string;
}
export interface Topic {
  id: string;
  title: string;
  children?: TopicChild[];
}
export interface Domain {
  id: DomainId;
  name: string;
  weightPct: number;
  subtopics: Topic[];
}
export interface Blueprint {
  _meta?: Record<string, unknown>;
  domains: Domain[];
}

// ---- Shared ----
export interface Ref {
  label: string;
  url: string;
}

// ---- Questions ----
export interface Option {
  id: string;
  text: string;
  correct: boolean;
  rationale: string;
}
export interface Token {
  id: string;
  text: string;
}
export interface DropZone {
  id: string;
  label: string;
  correctTokenId: string;
}
export interface RubricItem {
  id: string;
  text: string;
  points: number;
  verifyRegex?: string;
}
export interface Question {
  id: string;
  domain: DomainId;
  subtopic: string;
  type: QuestionType;
  difficulty: Difficulty;
  stem: string;
  image?: string;
  exhibit?: string;
  options?: Option[];
  tokens?: Token[];
  dropZones?: DropZone[];
  rubric?: RubricItem[];
  explanation: string;
  references: Ref[];
  tags?: string[];
}

// ---- Labs ----
export interface LabTask {
  id: number;
  text: string;
  points: number;
}
export interface LabRubricItem {
  id: string;
  text: string;
  points: number;
  verifyCmd?: string;
  verifyRegex?: string;
}
export interface LabSolution {
  config: Record<string, string>;
  explanation: string;
}
export interface Lab {
  id: string;
  domain: DomainId;
  subtopics: string[];
  title: string;
  type: "sim" | "simlet" | "testlet";
  topologyImage?: string;
  scenario: string;
  startingConfigs?: Record<string, string>;
  tasks: LabTask[];
  rubric: LabRubricItem[];
  solution: LabSolution;
  references: Ref[];
  packetTracerFile?: string;
}

// ---- Resources ----
export interface ResourceLink {
  topic: string;
  title: string;
  url: string;
  resourceType: string;
  verified?: boolean;
}
export interface DomainResources {
  id: DomainId;
  name: string;
  ciscoDocs: ResourceLink[];
  jitsCoverage?: string;
  courseModules?: string[];
}
export interface GlobalLink {
  label: string;
  url: string;
  type: string;
}
export interface Resources {
  _meta?: Record<string, unknown>;
  global: GlobalLink[];
  domains: DomainResources[];
}

// ---- Answers & progress ----
export interface Answer {
  selected?: string[]; // option ids (single/multi)
  mapping?: Record<string, string>; // dropZoneId -> tokenId (draganddrop)
  rubricPassed?: string[]; // rubric item ids the user satisfied (sim types)
}
export interface Attempt {
  id?: number;
  questionId: string;
  type: QuestionType;
  selected?: string[];
  mapping?: Record<string, string>;
  rubricPassed?: string[];
  correct: boolean;
  score: number; // 0..1
  ts: number;
  mode: Mode;
  domain: DomainId;
  subtopic: string;
}
export interface SrsCard {
  questionId: string;
  ef: number;
  interval: number;
  reps: number;
  due: number;
}
export interface ExamRunItem {
  questionId: string;
  score: number;
}
export interface ExamRun {
  id?: number;
  ts: number;
  durationUsedSec?: number;
  overall: number;
  byDomain: Record<string, number>;
  items: ExamRunItem[];
}
export interface DiagnosticRecord {
  id?: number;
  ts: number;
  byDomain: Record<string, number>;
  priority: string[];
  overall: number;
}
export interface ProgressExport {
  version: number;
  exportedAt?: number;
  attempts: Attempt[];
  srs: SrsCard[];
  examRuns: ExamRun[];
  diagnostics: DiagnosticRecord[];
  settings: Record<string, unknown>;
}
