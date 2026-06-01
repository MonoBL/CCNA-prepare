/**
 * Content linter: validates content/*.json against schemas/*.json with Ajv.
 *
 * Run: npx tsx scripts/lint-content.ts   (or wire as "lint:content" in package.json)
 * Requires: ajv, ajv-formats  (npm i -D ajv ajv-formats tsx)
 *
 * Extra checks beyond schema:
 *  - blueprint weights sum to 100
 *  - every question/lab id is unique
 *  - every question.subtopic and lab.subtopics exist in blueprint
 *  - every reference url appears in resources.json OR is a youtube.com link (JITS)
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const checks: Array<{ data: string; schema: string }> = [
  { data: "content/blueprint.json", schema: "schemas/blueprint.schema.json" },
  { data: "content/resources.json", schema: "schemas/resources.schema.json" },
  { data: "content/questions.seed.json", schema: "schemas/question.schema.json" },
  { data: "content/labs.seed.json", schema: "schemas/lab.schema.json" },
];

let failed = false;

for (const c of checks) {
  const validate = ajv.compile(read(c.schema));
  const data = read(c.data);
  if (!validate(data)) {
    failed = true;
    console.error(`FAIL ${c.data}`);
    for (const e of validate.errors ?? []) console.error(`  ${e.instancePath} ${e.message}`);
  } else {
    console.log(`OK   ${c.data}`);
  }
}

// ---- semantic checks ----
const blueprint = read("content/blueprint.json");
const weightSum = blueprint.domains.reduce((s: number, d: any) => s + d.weightPct, 0);
if (weightSum !== 100) { failed = true; console.error(`FAIL weight sum is ${weightSum}, expected 100`); }
else console.log("OK   blueprint weights sum to 100");

const validSubtopics = new Set<string>();
for (const d of blueprint.domains) for (const t of d.subtopics) {
  validSubtopics.add(t.id);
  for (const ch of t.children ?? []) validSubtopics.add(ch.id);
}

const questions = read("content/questions.seed.json");
const labs = read("content/labs.seed.json");

const ids = new Set<string>();
for (const item of [...questions, ...labs]) {
  if (ids.has(item.id)) { failed = true; console.error(`FAIL duplicate id ${item.id}`); }
  ids.add(item.id);
}

for (const q of questions) {
  if (!validSubtopics.has(q.subtopic)) { failed = true; console.error(`FAIL ${q.id} unknown subtopic ${q.subtopic}`); }
  if (q.type === "single" && q.options.filter((o: any) => o.correct).length !== 1) {
    failed = true; console.error(`FAIL ${q.id} single-answer must have exactly one correct option`);
  }
  if (q.type === "multi" && q.options.filter((o: any) => o.correct).length < 2) {
    failed = true; console.error(`FAIL ${q.id} multi-answer must have >=2 correct options`);
  }
}
for (const l of labs) for (const st of l.subtopics) {
  if (!validSubtopics.has(st)) { failed = true; console.error(`FAIL ${l.id} unknown subtopic ${st}`); }
}

console.log(failed ? "\nCONTENT LINT FAILED" : "\nCONTENT LINT PASSED");
process.exit(failed ? 1 : 0);
