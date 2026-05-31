# Feedback to Google Sheets - Google Apps Script

This is the current feedback pipeline for the deployed USD Income Planner.

## Flow

```text
Vercel /api/feedback
  -> Google Apps Script web app
  -> Google Sheets
```

This avoids exposing local n8n to the internet.

## Setup

1. Open the feedback Google Sheet.
2. Go to **Extensions -> Apps Script**.
3. Paste the code from `feedback-to-sheets.gs`.
4. Save the project.
5. Click **Deploy -> New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to `Me`.
8. Set **Who has access** to `Anyone`.
9. Deploy and authorize the script.
10. Copy the Web app URL.

## Vercel Environment Variable

Add this in Vercel for Production:

```text
GOOGLE_APPS_SCRIPT_FEEDBACK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

After saving the variable, redeploy the app.

## Sheet Columns

The script writes these columns:

```text
submittedAt, feedback, contact, pageUrl, source, userAgent
```

If the first row is empty, the script creates the headers automatically.
