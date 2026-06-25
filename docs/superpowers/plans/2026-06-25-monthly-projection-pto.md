# Monthly Projection and PTO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved task-tab UI with PTO-aware monthly projections and vacation range handling.

**Architecture:** Add pure calculation modules first, then client components that compose the existing calculator, rates, and summary views. Keep persistence in `localStorage` inside client components.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS v4, date-fns, Vitest.

---

### Task 1: PTO and Vacation Logic

**Files:**
- Create: `src/lib/pto.ts`
- Test: `tests/pto.test.ts`

- [ ] Add failing tests for monthly PTO accrual, used PTO subtraction, days-off exclusion, and missing PTO unlock date.
- [ ] Implement `calculatePtoBalance`, `getPtoUnlockDate`, and `evaluateVacationPlan`.
- [ ] Run `npm test tests/pto.test.ts`.

### Task 2: Monthly Projection Logic

**Files:**
- Create: `src/lib/projections.ts`
- Test: `tests/projections.test.ts`
- Modify: `src/types/index.ts`

- [ ] Add failing tests for 3-month horizon, remaining-year horizon, and vacation PTO/VTO allocation.
- [ ] Implement `generateMonthlyProjections`.
- [ ] Run `npm test tests/projections.test.ts`.

### Task 3: UI Shell

**Files:**
- Create: `src/components/AppHud.tsx`
- Create: `src/components/BottomTabs.tsx`
- Modify: `src/app/page.tsx`

- [ ] Add a fixed top HUD with country/theme controls and a compact income summary.
- [ ] Add bottom tabs for `Calcular`, `Proyectar`, `Cotizaciones`, and `Ajustes`.
- [ ] Preserve existing calculator behavior inside the `Calcular` tab.

### Task 4: Projection and Settings UI

**Files:**
- Create: `src/components/ProjectionPanel.tsx`
- Create: `src/components/SettingsPanel.tsx`
- Modify: `src/app/page.tsx`

- [ ] Add projection horizon controls.
- [ ] Add vacation date range and explicit PTO-shortage callout.
- [ ] Add saved hire date and used PTO inputs.
- [ ] Add clear estimation disclaimer.

### Task 5: Polish and Verification

**Files:**
- Modify: `src/components/SummaryCards.tsx`
- Modify: `src/app/globals.css`
- Modify: `README.md`

- [ ] Remove emoji-based UI markers where touched.
- [ ] Tune responsive spacing and tab-safe bottom padding.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
