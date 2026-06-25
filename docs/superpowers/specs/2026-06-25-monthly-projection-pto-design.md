# Monthly projection and PTO design

## Goal

Add a task-based version of the USD salary calculator with a fixed top HUD, bottom task tabs, monthly income projections, and a simple PTO/vacation planner.

## UI direction

The app moves from one dense page to four task tabs:

- `Calcular`: current cycle form and current income result.
- `Proyectar`: monthly projection, vacation range, PTO/VTO impact.
- `Cotizaciones`: exchange-rate table and Argentina history chart.
- `Ajustes`: hire date, already-used PTO, local saved data, and the estimation disclaimer.

Country and theme stay in a fixed top HUD so the user does not have to hunt for basic controls. The HUD can also show the last calculated USD/local summary.

## PTO rules

- PTO accrues as `1 paid day off` per complete worked month.
- Example: hire date `2026-01-01` unlocks first PTO on `2026-02-01`.
- PTO already used is a saved local setting and defaults to `0`.
- PTO available for a vacation range is calculated as of the vacation start date.
- If a vacation range requires more PTO than available, the app shows the missing amount and the date when the missing PTO would unlock.

## Vacation rules

- The first version supports one vacation range.
- The range is crossed with the configured weekly days off.
- Days that fall on weekly days off do not consume PTO.
- Covered working vacation days consume PTO.
- Missing covered days can be counted as VTO only if the user chooses to keep the range.
- Copy must state that the result is an orientation/example and does not replace company policy.

## Projection rules

- Projections start from the current month.
- Horizon options are `3`, `6`, `12`, and remaining calendar year.
- Each month reuses the existing `getCycleDays` and `calculateIncome` logic.
- Monthly projection cards show month, scheduled work days, days off, PTO, VTO, estimated USD income, and local currency conversion when a rate is available.

## Implementation boundaries

- No login, backend, database, PDF export, or multi-range vacation planner.
- No replacement of the exchange-rate API.
- Preserve existing saved calculator state and add new local settings for hire date, PTO used, active tab, projection horizon, and vacation preference.
