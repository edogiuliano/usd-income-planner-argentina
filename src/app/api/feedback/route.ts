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

  const webhookUrl = process.env.N8N_FEEDBACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        message:
          "Feedback recibido en modo demo. Configura N8N_FEEDBACK_WEBHOOK_URL para guardarlo en Google Sheets.",
        demo: true,
      },
      { status: 202 },
    );
  }

  const response = await fetch(webhookUrl, {
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

  return NextResponse.json({
    message: "Gracias. Me ayuda un monton para seguir mejorando la calculadora.",
  });
}
