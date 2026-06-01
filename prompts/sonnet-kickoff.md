# Sonnet kickoff prompt - CCNA 200-301 Study PWA

> Paste everything below into a fresh Claude Code (Sonnet) session opened in this repo.

---

You are a senior front-end engineer. Build the UI for an existing, scaffolded Progressive Web App that prepares a learner to pass the **Cisco CCNA 200-301 (v1.1)** exam. The architecture, data, and algorithms are already done and tested. Your job is the screens.

## Read first (in this order)
1. `README.md` - file index and build order.
2. `SPEC.md` - the build bible. Stack, file layout, screen-by-screen UI, exact algorithms, PWA config, acceptance criteria. Implement against this.
3. Skim `CCNA-PWA-PLAN.md` for rationale only.

## What is ALREADY done - do not rewrite or change
- Tooling/config: `package.json`, `vite.config.ts` (with vite-plugin-pwa), `tailwind.config.js`, `tsconfig.json`, `index.html`. Stack is **decided**: React 18 + TypeScript + Vite + Tailwind + react-router-dom + idb. Do not swap libraries.
- `src/types/index.ts` - all domain types.
- `src/data/content.ts` - loads + indexes content; exports `blueprint`, `resources`, `questions`, `labs`, `weights`, and helpers (`questionsByDomain`, `questionsBySubtopic`, `getDomain`, `getLab`, `resourcesForDomain`, `subtopicFlatList`, etc.).
- `src/data/db.ts` - IndexedDB layer (attempts, srs, examRuns, diagnostics, settings) with export/import/reset.
- `src/lib/` - `grading.ts`, `readiness.ts`, `diagnostic.ts`, `exam.ts`, `srs.ts` (+ barrel `index.ts`). **Covered by passing tests in `src/lib/algorithms.test.ts`.** Reuse these; do not reimplement allocation, scoring, priority, or SM-2.
- `src/state/ProgressContext.tsx` - `useProgress()` provides `attempts, srs, examRuns, diagnostics, masteryByDomain, masteryBySubtopic, overall` and actions `recordAttempt, addExamRun, addDiagnostic, reload, reset`.
- `src/components/` - `Layout.tsx` (nav + Outlet), `Gauge.tsx`, `PagePlaceholder.tsx`.
- `src/pages/Dashboard.tsx` and `src/pages/Resources.tsx` - **reference implementations**. Match their patterns and style.

## Your task
Implement the 13 placeholder routes. They currently live as stubs in `src/pages/stubs.tsx`.
1. Split each stub into its own file under `src/pages/` (e.g. `Diagnostic.tsx`, `Study.tsx`, `Domain.tsx`, `Subtopic.tsx`, `Practice.tsx`, `PracticeRun.tsx`, `Labs.tsx`, `Lab.tsx`, `Exam.tsx`, `ExamRun.tsx`, `ExamResult.tsx`, `Review.tsx`, `Settings.tsx`).
2. Update the imports in `src/App.tsx` to point at the new files; delete `stubs.tsx` when done.
3. Implement each page per `SPEC.md` Section 5 (routes) and Section 7 (question/lab UX), reusing the data layer, `useProgress()`, and `src/lib/`.
4. Build the shared question UI once (a `QuestionCard` component handling single / multi / draganddrop, plus rationale reveal) and reuse it in Practice, Diagnostic review, and Exam review.
5. Follow `SPEC.md` Section 11 build order, starting at step 4 (steps 1-3 are done): Study tree -> Study cards -> Practice -> Full Exam (timer + navigator + result/review) -> Spaced Review -> Diagnostic -> PWA polish + Settings (reset/export/import).

## Key behaviors (from SPEC, do not deviate)
- **Practice mode** reveals every option's why-right/why-wrong rationale + resource links after each answer; calls `recordAttempt(q, answer, "practice")`.
- **Exam mode**: 120-minute timer (`EXAM_DURATION_SEC`), weighted item set via `buildExam(weights, total)`, flag-for-review + question navigator grid, NO feedback until submit, then `gradeExam(...)`, store via `addExamRun`, route to result with full rationale review.
- **Diagnostic**: `diagnosticPlan` -> `selectDiagnosticQuestions` -> score per domain -> `priorityOrder`; store via `addDiagnostic`; show readiness bands + ranked focus list with deep links to `/study/:domainId`.
- **Review**: SM-2 due queue via `dueQueue(srs, Date.now())`; Again/Hard/Good/Easy buttons mapped to `GRADE`.
- **Readiness, never a pass line**: show bands (red/yellow/green via `band()`), never a fabricated passing score. Cisco does not publish one.
- **Images**: render `question.image` / `lab.topologyImage` from `public/assets/topo/`; render `question.exhibit` in a monospace panel.

## Hard rules
- Do NOT edit `content/*.json` or `schemas/*.json`. The blueprint, links, and seed content are authoritative and every link is verified. If you add questions/labs, follow `SPEC.md` Section 10 and keep `npm run lint:content` green.
- Do NOT invent exam facts, Cisco doc URLs, or device behavior. Use only what is in `content/`.
- Do NOT reproduce real Cisco exam questions or copyrighted exam images. All visuals original.
- Keep `src/lib/algorithms.test.ts` passing. Add tests for any new logic.
- Mobile-first, dark theme, WCAG AA, keyboard navigable, alt text on every image.

## Definition of done
- Every route renders a real page; `stubs.tsx` deleted.
- All three pass: `npm run lint:content`, `npm run test`, `npm run build`.
- App works fully offline (airplane mode: study, practice, full exam, review).
- Lighthouse: PWA installable; initial JS < 250 KB gzipped.
- Acceptance checklist in `SPEC.md` Section 9 fully satisfied.

## Also add (small)
- PWA icons in `public/icons/`: `icon-192.png`, `icon-512.png`, `maskable-512.png` (referenced by the manifest). Generate simple placeholders if none provided.

Start by running `npm install` (if needed) then `npm run dev`, confirm the Dashboard and Resources pages work, then implement the routes in the order above. Ask me only if something contradicts `SPEC.md`; otherwise follow the spec.
