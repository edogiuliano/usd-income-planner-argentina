# USD Income Planner Argentina

Web app for freelancers, contractors, and remote workers in Argentina who earn in USD and need a quick way to estimate income, convert it to ARS, and compare exchange-rate scenarios.

Live demo: https://calculadora-ingresos-usd.vercel.app/

## Why I Built It

Many remote workers in Argentina get paid in USD but plan expenses in ARS. This project turns that everyday problem into a practical calculator with real exchange-rate data, clear income summaries, charts, tests, and an n8n automation workflow.

It is also part of my portfolio as a bilingual healthcare interpreter and AI automation builder, showing how I combine frontend development, API integrations, testing, and workflow automation.

## Features

- Income calculation by minute, hour, day, or fixed monthly salary
- Custom work cycle using start and end dates
- Weekly days off selection
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
- Expand n8n workflow with scheduled alerts

## Disclaimer

Exchange rates are informational and may vary. This tool is not financial advice.
