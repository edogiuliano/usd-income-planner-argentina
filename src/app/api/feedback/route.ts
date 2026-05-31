import { NextResponse } from "next/server";

type FeedbackRequest = {
  feedback?: unknown;
  contact?: unknown;
  pageUrl?: unknown;
  source?: unknown;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  let body: FeedbackRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const feedback = cleanString(body.feedback);
  const contact = cleanString(body.contact);
  const pageUrl = cleanString(body.pageUrl);
  const source = cleanString(body.source) || "web";

  if (feedback.length < 5) {
    return NextResponse.json(
      { error: "El comentario es demasiado corto." },
      { status: 400 },
    );
  }

  if (feedback.length > 1200) {
    return NextResponse.json(
      { error: "El comentario es demasiado largo." },
      { status: 400 },
    );
  }

  const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_FEEDBACK_URL;

  if (!appsScriptUrl) {
    return NextResponse.json(
      {
        message:
          "Feedback recibido en modo demo. Configura GOOGLE_APPS_SCRIPT_FEEDBACK_URL para guardarlo en Google Sheets.",
        demo: true,
      },
      { status: 202 },
    );
  }

  const response = await fetch(appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      feedback,
      contact,
      pageUrl,
      source,
      userAgent: request.headers.get("user-agent") ?? "",
      submittedAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "No se pudo guardar el feedback en este momento." },
      { status: 502 },
    );
  }

  const responseText = await response.text();

  if (responseText) {
    try {
      const data = JSON.parse(responseText) as { ok?: boolean };

      if (data.ok === false) {
        return NextResponse.json(
          { error: "No se pudo guardar el feedback en Google Sheets." },
          { status: 502 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Google Apps Script devolvio una respuesta invalida." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    message: "Gracias. Me ayuda un monton para seguir mejorando la calculadora.",
  });
}
