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
  whatsapp-dollar-alerts.workflow.json
  feedback-to-google-sheets.workflow.json
```

## Feedback to Google Sheets

`feedback-to-google-sheets.workflow.json` adds the v4.5 feedback automation:

1. Receives feedback from the bottom dock in the web app.
2. Maps the comment, optional contact, page URL, source, user agent, and timestamp.
3. Appends a row to the first Google Sheets tab (`gid=0`).
4. Responds to the web app with a success message.

### Web App Environment Variable

Set this variable in Vercel or `.env.local`:

```text
N8N_FEEDBACK_WEBHOOK_URL=https://YOUR_N8N_DOMAIN/webhook/usd-planner-feedback
```

If the variable is missing, the app accepts the form in demo mode but does not save to Google Sheets.

### Google Sheets Setup

1. Create a Google Sheet and keep the feedback destination tab as the first tab (`gid=0`).
2. Suggested columns: `submittedAt`, `feedback`, `contact`, `pageUrl`, `source`, `userAgent`.
3. Import `feedback-to-google-sheets.workflow.json` into n8n.
4. Confirm the Google Sheets node points to your target workbook.
5. Bind or confirm your Google Sheets credential in n8n.
6. Activate the workflow.
7. Copy the production webhook URL from the `Feedback Webhook` node.
8. Paste that URL into `N8N_FEEDBACK_WEBHOOK_URL`.

## WhatsApp Dollar Alerts Argentina

`whatsapp-dollar-alerts.workflow.json` adds the v4 automation:

1. Receives WhatsApp subscriptions from the web app through a webhook.
2. Stores subscribers in n8n workflow static data.
3. Checks ArgentinaDatos every 2 hours for the dólar cripto history.
4. Sends a WhatsApp message when the latest sell rate is the highest value in the last 30 days.

### Web App Environment Variable

Set this variable in Vercel:

```text
N8N_WHATSAPP_ALERT_WEBHOOK_URL=https://YOUR_N8N_DOMAIN/webhook/usd-planner-whatsapp-alerts
```

If the variable is missing, the app accepts the form in demo mode but does not call n8n.

### WhatsApp Cloud API Environment Variables

Set these variables in n8n:

```text
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
```

The workflow uses Meta WhatsApp Cloud API through an HTTP Request node.

### Importing the WhatsApp Workflow

1. Open n8n.
2. Import `whatsapp-dollar-alerts.workflow.json`.
3. Activate the workflow.
4. Copy the production webhook URL from the `Subscribe Webhook` node.
5. Paste that URL into `N8N_WHATSAPP_ALERT_WEBHOOK_URL` in Vercel.
6. Configure the WhatsApp Cloud API environment variables in n8n.

### Current Scope

- Argentina only.
- Dólar cripto only.
- Alert condition: latest sell rate equals the maximum sell rate in the last 30 days.
- Subscriber storage: n8n workflow static data.
- No database in the Next.js app.

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
