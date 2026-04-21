# B3 — Dashboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard navigable — alert items link to their instrument, summary cards link to list pages, and the donut legend links to the instruments list pre-filtered by status.

**Architecture:** Add `id` and `href` to the two data types that feed the dashboard (`DashboardAlert`, `DashboardSummaryCard`), then wrap the relevant elements in `dashboard-content.tsx` with `<Link>`. Initialize `calibrationFilter` in `instruments-content.tsx` from the `?status` URL param.

**Tech Stack:** Next.js `<Link>`, `useSearchParams` (next/navigation), Vitest

---

## Files

| File | Change |
|------|--------|
| `lib/dashboard-metrics.ts` | Add `id: number` to `DashboardAlert`; add `href: string` to `DashboardSummaryCard`; pass both in `computeDashboardMetrics` |
| `tests/lib/dashboard-metrics.test.ts` | Add test asserting `alert.id` is present |
| `app/_components/dashboard-content.tsx` | Import `Link`; wrap alerts, summary cards, and legend rows |
| `app/_components/instruments-content.tsx` | Import `useSearchParams`; initialize `calibrationFilter` from `?status` |

---

### Task 1: Add `id` to `DashboardAlert` and `href` to `DashboardSummaryCard`

**Files:**
- Modify: `lib/dashboard-metrics.ts`
- Modify: `tests/lib/dashboard-metrics.test.ts`

- [ ] **Step 1: Write the failing test**

In `tests/lib/dashboard-metrics.test.ts`, add this test inside the existing `describe("dashboard-metrics", ...)` block (after the last `it(...)`):

```ts
it("inclui o id do instrumento em cada alerta", () => {
  const rows = [
    makeRow({ id: 42, tag: "INS-042", tone: "danger", diffInDays: -1, calibrationDateValue: "2026-04-20" })
  ];

  const metrics = computeDashboardMetrics(rows, 0);

  expect(metrics.alerts).toHaveLength(1);
  expect(metrics.alerts[0].id).toBe(42);
  expect(metrics.alerts[0].tag).toBe("INS-042");
});
```

- [ ] **Step 2: Run the test and confirm it fails**

```bash
npx vitest run tests/lib/dashboard-metrics.test.ts
```

Expected: FAIL — property `id` does not exist on the alert object (TypeScript error or `undefined`).

- [ ] **Step 3: Update the `DashboardAlert` type**

In `lib/dashboard-metrics.ts`, change lines 7–13:

```ts
export type DashboardSummaryCard = { title: string; value: string; note?: string; tone: "positive" | "neutral"; href: string };
export type DashboardAlert = { id: number; tag: string; title: string; note: string; badgeLabel: string; tone: "warning" | "danger" };
```

- [ ] **Step 4: Pass `id` and `href` in `computeDashboardMetrics`**

Still in `lib/dashboard-metrics.ts`, update the `summaryCards` array (around line 84):

```ts
const summaryCards: DashboardSummaryCard[] = [
  { title: "Total instrumentos", value: integerFormatter.format(totalInstruments), tone: "positive", href: "/instrumentos" },
  { title: "Categorias", value: integerFormatter.format(totalCategories), tone: "neutral", href: "/categorias" }
];
```

Update the `alerts` mapping (around line 92):

```ts
const alerts = rows
  .filter((row): row is DashboardInstrumentRow & { tone: "warning" | "danger" } => row.tone !== "neutral")
  .sort(compareAlertPriority)
  .slice(0, 5)
  .map((row) => ({
    id: row.id,
    tag: row.tag,
    title: `${row.category} - ${row.manufacturer}`,
    note: formatInstrumentAlertNote(row.calibrationDateValue ?? null, row.diffInDays),
    badgeLabel: row.tone === "danger" ? "Vencido" : "Perto de vencer",
    tone: row.tone
  }));
```

- [ ] **Step 5: Run all tests and confirm they pass**

```bash
npx vitest run tests/lib/dashboard-metrics.test.ts
```

Expected: all 6 tests PASS (5 existing + 1 new).

- [ ] **Step 6: Commit**

```bash
git add lib/dashboard-metrics.ts tests/lib/dashboard-metrics.test.ts
git commit -m "feat: add id to DashboardAlert and href to DashboardSummaryCard"
```

---

### Task 2: Add `<Link>` to `dashboard-content.tsx`

**Files:**
- Modify: `app/_components/dashboard-content.tsx`

- [ ] **Step 1: Add the `Link` import**

At the top of `app/_components/dashboard-content.tsx`, add:

```ts
import Link from "next/link";
import { getDashboardMetrics } from "@/lib/dashboard-metrics";
```

(Replace the existing single import line.)

- [ ] **Step 2: Add the tone-to-status mapping constant**

Inside `DashboardContent`, before the `return`, add:

```ts
const breakdownToneToStatus: Record<string, string> = {
  ok: "neutral",
  warning: "warning",
  danger: "danger"
};
```

- [ ] **Step 3: Convert alert `<article>` elements to `<Link>`**

Find the `.dashboard-alert-list` block (around line 149):

```tsx
<div className="dashboard-alert-list">
  {metrics.alerts.map((alert) => (
    <article key={alert.tag} className={`dashboard-alert-item dashboard-alert-item--${alert.tone}`}>
```

Replace `<article key={alert.tag} ...>` and its closing `</article>` with `<Link>`:

```tsx
<div className="dashboard-alert-list">
  {metrics.alerts.map((alert) => (
    <Link
      key={alert.tag}
      href={`/instrumentos/${alert.id}`}
      className={`dashboard-alert-item dashboard-alert-item--${alert.tone}`}
    >
      <div className="dashboard-alert-item__icon" aria-hidden="true">
        {alert.tone === "danger" ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 7v6M12 17.2h.01M4.9 18.5h14.2c1.1 0 1.8-1.2 1.2-2.1L13.1 4.3a1.3 1.3 0 0 0-2.2 0L3.7 16.4c-.6.9.1 2.1 1.2 2.1Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 6.5v5.3l3.1 1.9M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="dashboard-alert-item__body">
        <div className="dashboard-alert-item__title-row">
          <strong>{alert.tag}</strong>
          <span>{alert.title}</span>
        </div>
        <p>{alert.note}</p>
      </div>

      <span className={`dashboard-alert-item__badge dashboard-alert-item__badge--${alert.tone}`}>
        {alert.badgeLabel}
      </span>
    </Link>
  ))}
</div>
```

- [ ] **Step 4: Convert summary card `<article>` elements to `<Link>`**

Find the `.dashboard-grid__stack` block (around line 59). Replace:

```tsx
{metrics.summaryCards.map((card) => (
  <article
    key={card.title}
    className={`inventory-table-card dashboard-card dashboard-summary-card dashboard-summary-card--${card.tone}`}
  >
```

and its closing `</article>` with:

```tsx
{metrics.summaryCards.map((card) => (
  <Link
    key={card.title}
    href={card.href}
    className={`inventory-table-card dashboard-card dashboard-summary-card dashboard-summary-card--${card.tone}`}
  >
    <div className="dashboard-summary-card__top">
      <div className={`dashboard-summary-card__icon dashboard-summary-card__icon--${card.tone}`}>
        {card.title === "Total instrumentos" ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 5.5h10M8.2 3.5h7.6M9.3 5.5v5.2l-2.4 4.9A2 2 0 0 0 8.7 19h6.6a2 2 0 0 0 1.8-3.4l-2.4-4.9V5.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M9.2 13.1h5.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5.5 7.5h5v5h-5zM13.5 7.5h5v5h-5zM5.5 15.5h5v5h-5zM13.5 15.5h5v5h-5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="dashboard-summary-card__row">
        <span>{card.title}</span>
        {card.note ? <strong>{card.note}</strong> : null}
      </div>
    </div>

    <div className="dashboard-summary-card__body">
      <p>{card.value}</p>
    </div>
  </Link>
))}
```

- [ ] **Step 5: Convert legend rows to `<Link>`**

Find the `.dashboard-status-card__legend` block (around line 226). Replace:

```tsx
{metrics.breakdown.map((item) => (
  <div key={item.label} className="dashboard-status-card__legend-row">
```

and its closing `</div>` with:

```tsx
{metrics.breakdown.map((item) => (
  <Link
    key={item.label}
    href={`/instrumentos?status=${breakdownToneToStatus[item.tone]}`}
    className="dashboard-status-card__legend-row"
  >
    <div className="dashboard-status-card__legend-label">
      <span className={`dashboard-status-card__swatch dashboard-status-card__swatch--${item.tone}`} />
      <p>{item.label}</p>
    </div>

    <div className="dashboard-status-card__legend-values">
      <strong>{item.count} instrumentos</strong>
    </div>
  </Link>
))}
```

- [ ] **Step 6: Run the build to confirm no TypeScript errors**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 7: Commit**

```bash
git add app/_components/dashboard-content.tsx
git commit -m "feat: add navigation links to dashboard alerts, summary cards, and donut legend"
```

---

### Task 3: Initialize `calibrationFilter` from URL param in `instruments-content.tsx`

**Files:**
- Modify: `app/_components/instruments-content.tsx`

- [ ] **Step 1: Add `useSearchParams` import**

Near the top of `app/_components/instruments-content.tsx`, the current imports from `react` and `next/navigation` are:

```ts
import { type FormEvent, useEffect, useMemo, useState } from "react";
```

Add the `useSearchParams` import from `next/navigation` on a new line after the react import:

```ts
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
```

- [ ] **Step 2: Read `?status` before the state declarations**

Inside the `InstrumentsContent` component (client component), before the `useState` declarations, add:

```ts
const searchParams = useSearchParams();
const initialStatus = searchParams.get("status");
const validStatuses: CalibrationFilter[] = ["neutral", "warning", "danger"];
```

- [ ] **Step 3: Initialize `calibrationFilter` from URL**

Find the existing `calibrationFilter` state declaration (currently line 137):

```ts
const [calibrationFilter, setCalibrationFilter] = useState<CalibrationFilter>("all");
```

Replace it with:

```ts
const [calibrationFilter, setCalibrationFilter] = useState<CalibrationFilter>(
  validStatuses.includes(initialStatus as CalibrationFilter)
    ? (initialStatus as CalibrationFilter)
    : "all"
);
```

- [ ] **Step 4: Run the full test suite**

```bash
npm run test
```

Expected: all 81 tests PASS. (`instruments-content` is a client component with no unit tests; the test count should stay the same.)

- [ ] **Step 5: Run the build**

```bash
npm run build
```

Expected: build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add app/_components/instruments-content.tsx
git commit -m "feat: initialize calibration filter from URL status param"
```
