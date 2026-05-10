# USD Income Planner Argentina - Spec

## Objective

Build a public web app for freelancers, contractors, and remote workers in Argentina who earn in USD and want to estimate income by work cycle, convert it to ARS, and compare exchange-rate scenarios.

The app should stay lightweight: one main page, no login, no database, and no paid features.

## Target Users

- Freelancers in Argentina who earn in USD
- Remote contractors paid by minute, hour, day, or fixed monthly salary
- Workers who need to plan income in USD and expenses in ARS
- People comparing different exchange-rate types before making financial decisions

## Core Features

- Select payment type: minute, hour, day, or monthly
- Enter rate, hours per day, days off, start date, and end date
- Calculate total days, worked days, free days, total hours, and USD income
- Fetch exchange rates from DolarAPI-compatible endpoints
- Convert estimated USD income into local currency using sell rates
- Display summary cards, exchange-rate tables, and charts
- Keep the calculator usable even if exchange-rate APIs fail

## Current Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- date-fns
- Vitest
- DolarAPI
- n8n for automation
- Telegram Bot API for notifications
- Vercel for deploy

## MVP Scope

The MVP is a single-page calculator with clear results and real exchange-rate data.

Included:

- Income form
- Date-cycle calculation
- USD income calculation
- Exchange-rate fetching
- Conversion table
- Summary cards
- Chart
- Responsive UI
- Unit tests
- Public deploy

Out of scope:

- Login
- Payments
- Multi-user SaaS features
- Backend database
- Financial advice
- Complex forecasting
- Compliance claims

## Calculation Rules

### Cycle Days

`getCycleDays(startDate, endDate, freeWeekdays)` returns:

- total days in the inclusive date range
- worked days
- free days

If a day matches one of the selected free weekdays, it counts as a free day. Otherwise, it counts as a worked day.

### Income

`calculateIncome(input)` supports four payment types:

- Minute: `rate * hoursPerDay * 60 * workedDays`
- Hour: `rate * hoursPerDay * workedDays`
- Day: `rate * workedDays`
- Monthly: `rate`

It also returns:

- total hours
- average daily income
- average hourly income

## Exchange Rates

Exchange rates are fetched from DolarAPI-compatible endpoints.

Each normalized rate includes:

- name
- buy
- sell
- currency code
- locale
- updated timestamp

The app uses the sell rate for conversion.

If the API fails:

- the app must not crash
- USD calculations should still work
- the user should see a clear error message

## n8n Workflow

The n8n workflow is a portfolio extension of the main app.

It:

- checks that the deployed app is online
- fetches USD exchange rates
- filters relevant rate types
- builds a Telegram summary
- sends the summary through Telegram

This demonstrates API integration, workflow automation, and monitoring.

## Testing

Tests cover:

- one-day date ranges
- inclusive start and end dates
- weekend/free-day logic
- invalid date ranges
- minute/hour/day/monthly income calculations
- zero worked days
- zero hours per day

Commands:

```bash
npm test
npm run build
```

## Success Criteria

- The app loads without errors.
- The form calculates income correctly.
- Exchange rates load when the API is available.
- API failures are handled without breaking the app.
- Tests pass.
- Production build succeeds.
- README clearly explains the project, setup, stack, automation, and limitations.
- No secrets or credentials are committed.

## Portfolio Angle

This project should be presented as a practical automation and web tooling project:

- real user problem
- public deployed app
- API integration
- test-covered calculation logic
- n8n workflow
- Telegram automation
- clear roadmap and limitations

It is not a financial product and should not be described as financial advice.
