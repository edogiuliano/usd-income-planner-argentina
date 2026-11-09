# USD Income Planner Argentina

Web app for freelancers, contractors, and remote workers in LATAM who earn in USD and need a quick way to estimate income, convert it to local currency, and compare exchange-rate scenarios.

Live demo: https://calculadora-ingresos-usd.vercel.app/

## Version 1.2

- Optional withdrawal simulator inside the salary results, closed by default. The gross salary calculation is unchanged.
- Verified country/provider/method routes, a read-only fee breakdown, and automatic recommendations when known charges and exchange costs allow a comparison on a common basis.
- Deel is the sole origin. Destinations are filtered by country and account eligibility; Payoneer remains a destination and intermediary. Unconfirmed routes are not offered.
- No account connections, credentials, or payment execution. Public market rates value the USD equivalent; they do not pretend to be provider execution quotes.

Coverage, sources, API access requirements, asset permissions and remaining limitations: [Withdrawal simulator](docs/withdrawals-v1.2.md).

The final v1.1 date-controls adjustment was committed and pushed first as `4a8320f` on `main`.

## Version 1.1

- Compact header, top desktop navigation and four mobile tabs; total USD and local income lead the summary.
- Configurable monthly work cycles (default 1 through month-end). Start and close days are independent. For same-month ranges, the shortcuts choose the current and next calendar month; for cross-month ranges, they choose the current or upcoming cycle and its successor. Manual dates and shortcuts never change the saved bounds.
- Fixed salary proration follows the configured work cycle: `monthly salary * included calendar days / total calendar days in that cycle`. Complete cycles contribute one salary. Short months clip unavailable dates without overlapping cycles. Days outside a configured cycle do not contribute to its proration.
- PTO remains paid. VTO is deducted once, proportionally to scheduled workdays, from the prorated base. Manual leave applies to the initial projection cycle only; calendar vacations are additional days.
- The main form only accepts VTO. PTO from older saved calculations is retained with a removable notice; new vacation PTO is managed through Projections and Settings.
- Selling USD uses the entity's buy quote; buying USD uses its sell quote. Single-quote sources are explicitly marked as references. No fees or net-income calculations are included.
- Stable rate identifiers, legacy indexed-ID migration, and separate preferred quotes by country.
- Saved valid forms restore and recalculate automatically. Invalid edits hide results; a reload recovers the last valid form and its matching calculation.
- Configurable PTO per completed month (default 1, fractional rates supported). Only whole PTO days cover whole-day vacations. Set 0 to disable accrual.
- No initial PTO modal. Hire date is requested only when planning vacations; all existing settings remain available.

API field reference: [DolarAPI](https://dolarapi.com/docs/argentina/operations/get-dolares). Lint uses the ESLint CLI because [Next.js 16 removed `next lint`](https://nextjs.org/docs/app/guides/upgrading/version-16).

Validation commands:

```bash
npm test -- --run
npm run lint
npm run typecheck
npm run build
```

Security follow-up: the current dependency audit reports vulnerabilities, including a critical advisory affecting the existing Next.js version. Dependency upgrades are intentionally separate from the 1.1 UI/calculation changes; review and patch them before a public release.

## Why I Built It

Many remote workers in Argentina get paid in USD but plan expenses in ARS. This project turns that everyday problem into a practical calculator with real exchange-rate data, clear income summaries, charts, tests, and an n8n automation workflow.

It is also part of my portfolio as a bilingual healthcare interpreter and AI automation builder, showing how I combine frontend development, API integrations, testing, and workflow automation.

## Features

- Income calculation by minute, hour, day, or fixed monthly salary
- Custom work cycle using start and end dates
- Weekly days off selection
- Bottom task tabs for calculating, projecting, checking rates, and adjusting PTO settings
- Monthly projections for 3, 6, 12, or remaining months in the current year
- PTO accrual estimate using hire date and already-used PTO
- Vacation range planner that ignores weekly days off and warns when PTO is missing
- Worked days, free days, total hours, and USD income summary
- USD to local currency conversion using DolarAPI endpoints
- Multi-country selector for Argentina and several Latin American countries
- Dark mode and responsive UI
- Exchange-rate table and historical chart for Argentina
- n8n workflow that checks app status, fetches rates, and sends a Telegram summary
- Unit tests for date and income calculation logic

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- date-fns
- Vitest
- n8n
- Telegram Bot API
- DolarAPI

## Screenshots

Screenshots will be added after the public portfolio version is finalized.

## n8n Automation

The repo includes an n8n workflow in `automation/n8n/`:

- Checks that the deployed app is online
- Fetches exchange rates from DolarAPI
- Filters relevant USD exchange-rate types
- Builds a formatted Telegram message
- Sends the summary through a Telegram bot

See [automation/n8n/README.md](automation/n8n/README.md) for setup instructions.

## Getting Started

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Tests

```bash
npm test
```

## Production Build

```bash
npm run build
```

## Project Structure

```text
src/
  app/
  components/
  lib/
  types/
tests/
automation/
  n8n/
```

## Limitations

- Exchange rates are informational and depend on third-party API availability.
- The app does not provide financial advice.
- Historical charts are currently focused on Argentina.
- There is no login, database, or user account system.

## Roadmap

- Add screenshots and demo video
- Improve exchange-rate history
- Add local saved calculations
- Add cycle comparison
- Add monthly expenses and savings projections
- Add multiple vacation ranges
- Expand n8n workflow with scheduled alerts

## Disclaimer

Exchange rates are informational and may vary. This tool is not financial advice.
