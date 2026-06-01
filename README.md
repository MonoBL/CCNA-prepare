# CCNA 200-301 Study PWA

An offline-capable Progressive Web App to prepare a learner to pass the **Cisco CCNA 200-301 (v1.1)** exam: pre-assessment, topic study, a question bank with full rationales, hands-on labs, and a 120-minute full-exam simulation.

> **For the coding agent (Sonnet):** everything you need to build the app is in this repo. Read `SPEC.md` first (the build bible), then implement against the data in `content/` and the contracts in `schemas/`. Do not re-research exam facts; they are already verified here. Do not invent links or device behavior.

## File index

| File | Role |
|---|---|
| `SPEC.md` | **Build bible.** Stack, file layout, screens, exact algorithms (TS), PWA config, acceptance criteria, build order. Implement from this. |
| `CCNA-PWA-PLAN.md` | Rationale and the full content-to-resource map (human-readable). |
| `content/blueprint.json` | Official exam blueprint: 6 domains, weights, every sub-topic (verbatim from Cisco v1.1 PDF). The app's content backbone. |
| `content/resources.json` | Verified link map per domain (Cisco docs + JITS + Cisco course modules). Every URL returned HTTP 200. |
| `content/questions.seed.json` | Seed question bank (13 items) with per-option why-right/why-wrong rationales and source links. Extend this. |
| `content/labs.seed.json` | Seed labs (6 items) with scenario, tasks, grading rubric, solution config, references. Extend this. |
| `schemas/*.schema.json` | JSON Schemas for blueprint, question, lab, resources, progress. Generate TS types from these and validate content. |
| `scripts/lint-content.ts` | Ajv validator + semantic checks (weights sum to 100, unique ids, subtopics exist). Wire as `npm run lint:content`. |

## Tech stack (decided in SPEC.md)
React 18 + TypeScript + Vite + Tailwind + react-router + vite-plugin-pwa (Workbox) + IndexedDB (idb). No backend in v1; all state is local. Vitest for tests.

## Build order (summary; full detail in SPEC.md Section 11)
1. Scaffold Vite + React + TS + Tailwind + router + vite-plugin-pwa + manifest.
2. TS types from `schemas/`; wire `content.ts` (import JSON) and `db.ts` (idb).
3. Implement `src/lib/` algorithms (diagnostic, exam allocation, grading, SM-2, readiness) with Vitest tests.
4. Dashboard, Study tree, Study cards, Resources.
5. Practice runner, Full Exam (timer + navigator + result/review), Spaced Review, Diagnostic.
6. PWA polish: offline test, Lighthouse, icons, settings (reset/export/import progress).

## Content lint
```
npm i -D ajv ajv-formats tsx
npm run lint:content        # -> "CONTENT LINT PASSED"
```
Add to CI so new questions/labs fail the build on schema violations. Authoring rules are in `SPEC.md` Section 10.

## Truth and sourcing policy
- Exam blueprint, weights, and sub-topics are verbatim from the official Cisco PDF (linked in `content/resources.json`).
- Every Cisco documentation URL was tested and returned **HTTP 200** with a browser user-agent. A `403` from an automated fetch is Cisco's CDN bot-block, not a dead page.
- Cisco does **not** publish the exam's exact question count or passing score, so the app shows readiness bands, never a fake pass line.
- Do **not** reproduce real Cisco exam questions or copyrighted exam images. All questions and topology diagrams must be original.

## Exam version note
- Current live exam: **200-301 v1.1** (since 2024-08-20). This repo targets v1.1.
- Next: **200-301 v2.0** goes live **2027-02-03** (restructured into 5 domains, heavier troubleshooting + AI). Because the blueprint is data (`content/blueprint.json`), a v2.0 update is a JSON swap, not a code change.
