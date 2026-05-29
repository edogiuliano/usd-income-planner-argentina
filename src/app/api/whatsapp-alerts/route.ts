import { NextResponse } from "next/server";

type WhatsAppAlertRequest = {
  phone?: unknown;
  country?: unknown;
  source?: unknown;
};

const PHONE_PATTERN = /^\+?\d{8,18}$/;

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[^\d+]/g, "").trim();
}

export async function POST(request: Request) {
  let body: WhatsAppAlertRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const phone = normalizePhone(body.phone);
  const country = typeof body.country === "string" ? body.country : "";

  if (country !== "ar") {
    return NextResponse.json(
      { error: "Las alertas por WhatsApp están disponibles solo para Argentina por ahora." },
      { status: 400 },
    );
  }

  if (!PHONE_PATTERN.test(phone)) {
    return NextResponse.json(
      { error: "Número inválido. Usá código de país, por ejemplo +549..." },
      { status: 400 },
    );
  }

  const webhookUrl = process.env.N8N_WHATSAPP_ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        message:
          "Solicitud recibida en modo demo. Configurá N8N_WHATSAPP_ALERT_WEBHOOK_URL para activar n8n.",
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
      phone,
      country,
      source: typeof body.source === "string" ? body.source : "web",
      subscribedAt: new Date().toISOString(),
      alert: {
        market: "cripto",
        condition: "monthly_high",
        lookbackDays: 30,
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "No se pudo conectar con el workflow de n8n." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: "Listo. Te avisamos por WhatsApp cuando el dólar cripto toque máximo mensual.",
  });
}
