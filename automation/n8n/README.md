# USD Salary Monitor Argentina - n8n Workflow

This folder contains an n8n workflow that extends the USD Income Planner with a simple monitoring and notification automation.

## What It Does

The workflow:

1. Checks that the deployed web app is online.
2. Fetches USD exchange rates from DolarAPI.
3. Filters the relevant exchange-rate types.
4. Builds a formatted summary message.
5. Sends the summary to Telegram.

## Requirements

- n8n local or n8n.cloud
- Telegram bot created with BotFather
- Telegram credentials configured in n8n

## Files

```text
automation/n8n/
  README.md
  usd-salary-monitor.workflow.json
```

## Importing the Workflow

1. Open n8n.
2. Go to **Workflows**.
3. Choose **Import from File**.
4. Select `usd-salary-monitor.workflow.json`.
5. Review each node before enabling it.

## Telegram Setup

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`.
3. Follow the prompts and copy the bot token.
4. Send a message to your new bot.
5. Get your chat ID by visiting:

```text
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

6. In n8n, create a Telegram credential with your bot token.
7. Configure the Telegram node with the correct chat ID.

## Workflow Structure

```text
Manual Trigger
  -> HTTP Request: App Status Check
  -> HTTP Request: DolarAPI
  -> Filter: Dollar Types
  -> Code: Build Message
  -> Telegram: Send Message
```

## Nodes

### Manual Trigger

Starts the workflow manually. This can later be replaced or combined with a scheduled trigger.

### App Status Check

Sends a GET request to the deployed app:

```text
https://calculadora-ingresos-usd.vercel.app/
```

### DolarAPI Request

Fetches exchange-rate data from:

```text
https://dolarapi.com/v1/dolares
```

### Dollar Types Filter

Keeps the most relevant exchange-rate types for the summary, such as official, blue, MEP, and crypto.

### Build Message

Formats the exchange-rate data and adds an example conversion.

### Telegram

Sends the final message through the configured Telegram bot.

## Security Notes

Never commit real credentials, bot tokens, chat IDs, or private webhook URLs.

Use n8n credentials for secrets instead of hardcoding sensitive values inside workflow nodes.

## Suggested Improvements

- Add a scheduled trigger.
- Alert when the app is offline.
- Store exchange-rate snapshots.
- Compare current rates with previous runs.
- Send only meaningful changes instead of daily static messages.
- Add separate workflows for weekly summaries.

## Portfolio Angle

This workflow shows practical automation skills:

- API integration
- uptime check
- data filtering
- message formatting
- Telegram notification
- n8n workflow documentation
