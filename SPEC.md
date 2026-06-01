# CCNA 200-301 Study PWA - Build Specification (the build bible)

> This is the single source of truth a coding agent (Sonnet) implements from. It contains the chosen stack, file layout, data contracts, screen-by-screen UI, exact algorithms (copy-pasteable TypeScript), and acceptance criteria. Pair it with `CCNA-PWA-PLAN.md` (rationale) and the files in `content/` + `schemas/`.
>
> **Truth rule for the coder**: never invent exam facts or device behavior. All blueprint data is in `content/blueprint.json`. All resource links are in `content/resources.json` (every link verified HTTP 200). When authoring more questions/labs, each must cite a source from `resources.json` or the Cisco Official Cert Guide.

---

## 1. What we are building

A Progressive Web App that takes a learner from zero to passing the **Cisco CCNA 200-301 v1.1** exam. Offline-capable, installable, mobile-first.

Five pillars:
1. **Diagnostic / pre-assessment** that ranks where to focus (combines exam weight with measured weakness).
2. **Topic study** following the official blueprint tree.
3. **Question bank** with per-option why-right / why-wrong rationales.
4. **Labs** (topology + tasks + rubric + solution) emulating Sim/Simlet/Testlet.
5. **Full exam mode**: 120-minute timer, weighted item mix, score report + review.

### Non-goals (do not build in v1)
- No backend / accounts / cloud sync (all state is local). Architect so sync can be added later.
- No real Packet Tracer emulation inside the app. Labs link out to `.pkt` files and grade via a checklist the user confirms or via parsing a pasted `show` output (see 7.4).
- Do not reproduce real Cisco exam questions or copyrighted exam images. All items original.

### Target exam (verified, see PLAN.md Section 2)
- Code/version: **200-301 v1.1**. Duration: **120 min**. Cost: USD $300.
- Question count and passing score are **not published by Cisco** - never display a fake pass line; show readiness bands instead.
- Version note: 200-301 **v2.0** goes live **2027-02-03** (5 domains). Keep blueprint as data so a v2.0 swap is a JSON change.

---

## 2. Tech stack (decided - do not re-litigate)

| Concern | Choice |
|---|---|
| Language | **TypeScript** (strict) |
| Framework | **React 18** |
| Build | **Vite** |
| Routing | **react-router-dom v6** |
| Styling | **Tailwind CSS** |
| PWA / service worker | **vite-plugin-pwa** (Workbox under the hood) |
| Local storage | **IndexedDB** via **idb** (Jake Archibald's wrapper) |
| State | React Context + hooks (no Redux needed at this size) |
| Charts/gauges | lightweight: **recharts** or hand-rolled SVG (prefer SVG for bundle size) |
| Schema validation (dev) | **ajv** against `schemas/*.schema.json` in a content lint script |
| Tests | **Vitest** + **@testing-library/react** |
| Icons | open-source set (lucide-react). Network topology icons: draw original SVGs in `public/assets/topo/`. |

Node 20+. Package manager: npm. No paid services.

---

## 3. Project structure (create exactly this)

```
ccna-pwa/
├── README.md                    # index + build order (exists)
├── CCNA-PWA-PLAN.md             # rationale (exists)
├── SPEC.md                      # this file
├── package.json
├── vite.config.ts               # includes vite-plugin-pwa config (see 8)
├── tailwind.config.js
├── tsconfig.json
├── index.html
├── public/
│   ├── manifest.webmanifest     # see 8.1
│   ├── icons/                   # 192/512 png + maskable
│   └── assets/
│       ├── topo/                # topology SVGs for questions/labs
│       └── pt/                  # Packet Tracer .pkt lab files (linked, optional)
├── content/                     # AUTHORITATIVE DATA (already provided)
│   ├── blueprint.json
│   ├── resources.json
│   ├── questions.seed.json
│   └── labs.seed.json
├── schemas/                     # JSON Schemas (already provided)
│   ├── blueprint.schema.json
│   ├── question.schema.json
│   ├── lab.schema.json
│   ├── resources.schema.json
│   └── progress.schema.json
├── scripts/
│   └── lint-content.ts          # ajv-validate content/*.json against schemas/
└── src/
    ├── main.tsx
    ├── App.tsx                  # router + providers
    ├── index.css                # tailwind entry
    ├── types/                   # TS types mirroring schemas
    │   └── index.ts
    ├── data/
    │   ├── content.ts           # load + index blueprint/resources/questions/labs
    │   └── db.ts                # idb open, stores, CRUD for progress
    ├── lib/
    │   ├── diagnostic.ts        # item selection + scoring + priority
    │   ├── exam.ts              # full-exam allocation + grading
    │   ├── grading.ts           # per-type answer grading
    │   ├── srs.ts               # SM-2 spaced repetition
    │   └── readiness.ts         # bands + overall gauge
    ├── state/
    │   └── ProgressContext.tsx  # progress provider backed by idb
    ├── components/              # reusable UI (QuestionCard, Timer, Gauge, ...)
    └── pages/                   # one per route (see 5)
```

---

## 4. Data layer

### 4.1 Content loading (`src/data/content.ts`)
- Bundle the four `content/*.json` at build time (import as JSON) OR fetch from `/content/` and cache via SW. **Decision: import at build time** for v1 (simplest, fully offline). Expose:
  - `blueprint`: typed object (see `schemas/blueprint.schema.json`).
  - `resources`: typed (see `schemas/resources.schema.json`).
  - `questions`: array; build `Map` indexes by `id`, by `domain`, by `subtopic`, by `type`, by `difficulty`.
  - `labs`: array; index by `id`, by `domain`.
- Provide helpers: `questionsByDomain(id)`, `questionsBySubtopic(id)`, `resourcesForDomain(id)`, `resourcesForSubtopic(id)`, `subtopicFlatList()`.

### 4.2 Progress persistence (`src/data/db.ts`) - IndexedDB via `idb`
Database `ccna-pwa`, version 1. Object stores:

| Store | keyPath | Holds |
|---|---|---|
| `attempts` | `id` (auto) | each answered item: `{questionId, type, selected, correct:boolean, score:0..1, ts, mode:'practice'|'diagnostic'|'exam', domain, subtopic}` |
| `srs` | `questionId` | SM-2 card state `{ef, interval, reps, due}` |
| `examRuns` | `id` (auto) | a completed full-exam: `{ts, durationUsed, overall:0..1, byDomain:{}, items:[{questionId,score}]}` |
| `diagnostics` | `id` (auto) | `{ts, byDomain:{score}, priority:[domainId], overall}` |
| `settings` | `key` | misc key/value (theme, examItemCount, etc.) |

All writes async. ProgressContext wraps these and exposes memoized selectors (mastery per subtopic = rolling mean of last N attempts; default N=10).

The on-disk shapes must validate against `schemas/progress.schema.json`.

---

## 5. Screens / routes

| Route | Page | Purpose |
|---|---|---|
| `/` | **Dashboard** | Readiness gauge (overall + per-domain), priority list, "continue studying", last exam score, due-for-review count. |
| `/diagnostic` | **Diagnostic** | Run the pre-assessment; on finish show per-domain bands + ranked focus list with deep links. |
| `/study` | **Domains index** | 6 domain cards with weight, mastery bar, topic count. |
| `/study/:domainId` | **Domain** | Blueprint sub-topic tree (from blueprint.json), each row: mastery, links to study cards / questions / labs / resources. |
| `/study/:domainId/:subtopicId` | **Study cards** | Concept cards + worked examples + resource links (Cisco doc, JITS, course module). |
| `/practice` | **Practice setup** | Pick domain(s)/subtopic(s)/type/difficulty/count -> start a practice session. |
| `/practice/run` | **Practice runner** | Answer questions; immediate per-option rationale after each (practice mode reveals instantly). |
| `/labs` | **Labs index** | List labs by domain. |
| `/labs/:labId` | **Lab runner** | Scenario + topology image + tasks + rubric; user works in Packet Tracer, then self-checks or pastes `show` output (7.4); reveal solution + explanation. |
| `/exam` | **Exam intro** | Rules, item count selector (default 100), Start. |
| `/exam/run` | **Exam runner** | 120-min timer, weighted item set, no rationale until submit, flag-for-review, navigator grid. |
| `/exam/result/:runId` | **Exam result** | Overall + per-domain readiness, then full review with rationales + links. |
| `/review` | **Spaced review** | SM-2 due queue (flashcard front/back), Again/Hard/Good/Easy buttons. |
| `/resources` | **Resources** | Master verified link list grouped by domain (from resources.json) + global links (exam page, PDF, JITS, Cisco course). |
| `/settings` | **Settings** | Theme, default exam size, reset progress (confirm), export/import progress JSON. |

Navigation: bottom tab bar on mobile (Dashboard, Study, Practice, Exam, Review), hamburger for the rest.

---

## 6. Core algorithms (implement as written)

### 6.1 Readiness bands (`src/lib/readiness.ts`)
```ts
export type Band = 'red' | 'yellow' | 'green';
export function band(score: number): Band {
  if (score < 0.60) return 'red';
  if (score <= 0.80) return 'yellow';
  return 'green';
}
// Overall readiness = weighted sum of per-domain scores.
export function overallReadiness(
  byDomain: Record<string, number>,
  weights: Record<string, number> // weightPct, e.g. {'1.0':20,...}
): number {
  let sum = 0, w = 0;
  for (const d in weights) {
    sum += (byDomain[d] ?? 0) * weights[d];
    w += weights[d];
  }
  return w ? sum / w : 0; // 0..1
}
```

### 6.2 Diagnostic item selection (`src/lib/diagnostic.ts`)
```ts
// ~30 items, proportional to exam weight, minimum 3 per domain.
export function diagnosticPlan(weights: Record<string, number>, total = 30, min = 3) {
  const ids = Object.keys(weights);
  const plan: Record<string, number> = {};
  let assigned = 0;
  for (const d of ids) { plan[d] = Math.max(min, Math.round(total * weights[d] / 100)); assigned += plan[d]; }
  // trim/extend to hit `total` by adjusting the highest-weight domain
  const heaviest = ids.sort((a, b) => weights[b] - weights[a])[0];
  plan[heaviest] += (total - assigned);
  return plan; // {domainId: count}
}
// Pick `count` questions per domain, prefer unseen, spread across subtopics, mixed types.
```

### 6.3 Priority ranking ("focus more" engine)
```ts
// priority = exam weight * (1 - mastery). Higher = study first.
export function priorityOrder(
  byDomain: Record<string, number>,
  weights: Record<string, number>
): string[] {
  return Object.keys(weights).sort(
    (a, b) => (weights[b] * (1 - (byDomain[b] ?? 0))) - (weights[a] * (1 - (byDomain[a] ?? 0)))
  );
}
```

### 6.4 Full-exam item allocation (`src/lib/exam.ts`)
```ts
// Allocate N items across domains by weight (largest-remainder method).
export function examAllocation(weights: Record<string, number>, total = 100): Record<string, number> {
  const ids = Object.keys(weights);
  const exact = ids.map(d => ({ d, raw: total * weights[d] / 100 }));
  const alloc: Record<string, number> = {};
  let used = 0;
  for (const e of exact) { alloc[e.d] = Math.floor(e.raw); used += alloc[e.d]; }
  // distribute leftover to largest fractional remainders
  exact.sort((a, b) => (b.raw - Math.floor(b.raw)) - (a.raw - Math.floor(a.raw)));
  let i = 0;
  while (used < total) { alloc[exact[i % exact.length].d]++; used++; i++; }
  return alloc;
}
// Build the set: draw alloc[d] questions per domain, ensure >=1 sim/simlet/testlet overall if available,
// shuffle order, no immediate feedback. Timer = 120 min (configurable in settings only for practice).
```

### 6.5 Answer grading (`src/lib/grading.ts`)
```ts
// Returns 0..1 score for an item.
export function gradeItem(item: Question, answer: Answer): number {
  switch (item.type) {
    case 'single':
      return answer.selected[0] === correctIds(item)[0] ? 1 : 0;
    case 'multi': {
      const sel = new Set(answer.selected), cor = new Set(correctIds(item));
      return setsEqual(sel, cor) ? 1 : 0; // all-or-nothing (mirror exam strictness)
    }
    case 'draganddrop': {
      const total = item.dropZones!.length;
      let right = 0;
      for (const z of item.dropZones!) if (answer.mapping?.[z.id] === z.correctTokenId) right++;
      return right / total; // partial credit
    }
    case 'sim':
    case 'simlet':
    case 'testlet': {
      // rubric-based: each rubric check the user satisfies adds its points
      const max = item.rubric!.reduce((s, r) => s + r.points, 0);
      const got = (answer.rubricPassed ?? []).reduce((s, id) =>
        s + (item.rubric!.find(r => r.id === id)?.points ?? 0), 0);
      return max ? got / max : 0;
    }
  }
}
```

### 6.6 Spaced repetition - SM-2 (`src/lib/srs.ts`)
```ts
export interface SrsCard { ef: number; interval: number; reps: number; due: number; }
export const newCard = (now: number): SrsCard => ({ ef: 2.5, interval: 0, reps: 0, due: now });

// grade q in 0..5. UI buttons map: Again=1, Hard=3, Good=4, Easy=5.
export function review(card: SrsCard, q: number, now: number, dayMs = 86400000): SrsCard {
  let { ef, interval, reps } = card;
  if (q < 3) { reps = 0; interval = 1; }
  else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ef);
  }
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;
  return { ef, interval, reps, due: now + interval * dayMs };
}
// Due queue = srs cards where due <= now, plus brand-new cards for studied subtopics.
```

---

## 7. Question & lab UX rules

### 7.1 Practice mode
After each answer, reveal: the correct option(s), and **every option's rationale** (why right / why wrong), the overall explanation, and the resource links. Record an `attempts` row and update `srs`.

### 7.2 Exam mode
No feedback during the run. Flag-for-review + question navigator grid (answered/flagged/unseen). On submit (or timer hit 0), grade all, write `examRuns`, route to result.

### 7.3 Images
- `question.image` and `lab.topologyImage` are paths under `public/assets/topo/`. Render as `<img>` with alt text from the item.
- `question.exhibit` is inline text (CLI output) rendered in a monospace, scrollable, copyable panel.
- Drag-and-drop questions: render `tokens` (draggable) and `dropZones` (targets); store mapping in answer.

### 7.4 Lab self-check (two modes)
- **Checklist mode**: show each rubric item as a checkbox; user ticks what they completed; score = ticked points / total. (Honor system, fine for self-study.)
- **Paste-verify mode (optional, nice-to-have)**: user pastes a `show` command output; each rubric item has a `verifyRegex`; if it matches the pasted text, auto-tick. Implement if time allows; checklist mode is the v1 requirement.
Always allow "Reveal solution" -> shows `solution.config` per device + `solution.explanation`.

---

## 8. PWA requirements

### 8.1 `public/manifest.webmanifest`
```json
{
  "name": "CCNA 200-301 Trainer",
  "short_name": "CCNA Trainer",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b1220",
  "theme_color": "#0b1220",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 8.2 Service worker (vite-plugin-pwa)
- `registerType: 'autoUpdate'`.
- Precache the app shell + all `content/*.json` (bundled) + topology SVGs in `assets/topo/`.
- Runtime cache (StaleWhileRevalidate) for any external images, but the app must be **fully functional offline** with zero network (all study/practice/exam content is local).
- The external resource links (Cisco docs, JITS) open in a new tab and require network - that is expected and acceptable; the app must clearly still work offline for studying/testing.

### 8.3 Quality
- Lighthouse PWA installable; performance budget: initial JS < 250 KB gzipped.
- Responsive 360px to desktop. Dark theme default, light optional. WCAG AA contrast, keyboard navigable, alt text on every image.

---

## 9. Acceptance criteria (definition of done)

- [ ] App installs as a PWA and runs **fully offline** (airplane mode: study, practice, full exam, review all work).
- [ ] `content/*.json` validate against `schemas/*.schema.json` via `npm run lint:content` (script in `scripts/lint-content.ts`).
- [ ] Blueprint tree renders all 6 domains, 53 top topics, 58 children from `blueprint.json` (counts must match).
- [ ] Diagnostic produces per-domain bands and a priority list using the exact formulas in 6.2-6.3.
- [ ] Practice mode shows per-option rationale + resource links after each answer.
- [ ] Full exam: 120-min countdown, weighted allocation (6.4), navigator + flagging, locked feedback, per-domain result + full review.
- [ ] Spaced review implements SM-2 (6.6) with Again/Hard/Good/Easy.
- [ ] Resources page lists every link from `resources.json`, grouped by domain, opening in new tabs.
- [ ] Reset / export / import progress works; export is JSON validating against `progress.schema.json`.
- [ ] No real Cisco exam content reproduced; all images original; every shipped question/lab has a `references` entry.

---

## 10. Content authoring guide (for growing the bank)

- IDs: questions `q-<subtopic>-<seq>` (e.g. `q-1.6-001`); labs `lab-<subtopic>-<seq>`.
- Every question: `domain`, `subtopic`, `type`, `difficulty`, `stem`, `options[]` each with `correct` + `rationale`, `explanation`, `references[]` (>=1 link from `resources.json` or the Odom Official Cert Guide). Add `image`/`exhibit`/`tokens`/`dropZones` per type.
- Every lab: `domain`, `subtopics[]`, `title`, `type`, `scenario`, `tasks[]`, `rubric[]` (with `verifyRegex` if paste-verify), `solution.config{device}`, `solution.explanation`, `references[]`. Optional `topologyImage`, `packetTracerFile`.
- Target bank size for exam-readiness: >= 40 questions/domain and >= 3 labs/domain (grow beyond the seed in `*.seed.json`).
- Run `npm run lint:content` before committing new content. CI should fail on schema violations.
- Truth: verify each technical claim against the linked Cisco doc. If a doc does not support it, do not ship the item.

---

## 11. Build order for the coding agent
1. Scaffold Vite + React + TS + Tailwind + router; add `vite-plugin-pwa` and manifest.
2. Generate `src/types/index.ts` from the schemas; wire `content.ts` (import JSON) and `db.ts` (idb stores).
3. Implement `lib/` algorithms (Section 6) with **Vitest unit tests** (allocation sums to total, SM-2 intervals, priority order, banding).
4. Build ProgressContext + Dashboard.
5. Build Study tree + Study cards + Resources (read-only, fast wins).
6. Build Practice runner (reuses QuestionCard + grading).
7. Build Full Exam (timer, navigator, allocation, result/review).
8. Build Spaced Review (SRS).
9. Build Diagnostic (reuses practice engine + diagnostic plan + result screen with priority).
10. PWA polish: offline test, Lighthouse, icons, settings (reset/export/import).
11. `lint:content` script + seed validation in CI.
