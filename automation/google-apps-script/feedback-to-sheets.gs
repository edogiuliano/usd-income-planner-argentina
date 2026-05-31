const SHEET_ID = "1zOJ-7njbL8uUMEyKBrenue6Gov-e6cBvgZqi9he3MSk";
const SHEET_NAME = "usd-planner-feedback";
const HEADERS = ["submittedAt", "feedback", "contact", "pageUrl", "source", "userAgent"];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const feedback = cleanString(payload.feedback);

    if (feedback.length < 5 || feedback.length > 1200) {
      return json({ ok: false, error: "Invalid feedback length" });
    }

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];

    ensureHeaders(sheet);

    sheet.appendRow([
      cleanString(payload.submittedAt) || new Date().toISOString(),
      feedback,
      cleanString(payload.contact),
      cleanString(payload.pageUrl),
      cleanString(payload.source) || "web",
      cleanString(payload.userAgent),
    ]);

    return json({ ok: true, message: "Feedback saved" });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasAnyHeader = currentHeaders.some(function (value) {
    return String(value || "").trim() !== "";
  });

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
