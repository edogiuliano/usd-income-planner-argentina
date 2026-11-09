import { isIP } from "node:net";
import { NextResponse } from "next/server";

type FeedbackRequest = {
  feedback?: unknown;
  contact?: unknown;
  pageUrl?: unknown;
  source?: unknown;
};

const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_INSTANCE = 60;
const UPSTREAM_ERROR = "No se pudo guardar el feedback en este momento.";

let windowEnd = 0;
let attempts = 0;
const attemptsByIp = new Map<string, number>();

class BodyTooLargeError extends Error {}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getAppsScriptUrl(value: string | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url
      : null;
  } catch {
    return null;
  }
}

async function readFeedbackBody(request: Request): Promise<FeedbackRequest> {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    throw new BodyTooLargeError();

  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request body");

  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {});
        throw new BodyTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  const body: unknown = JSON.parse(text + decoder.decode());
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Invalid feedback payload");
  return body;
}

// This guard is instance-local; only use the IP header on its trusted platform.
function takeSubmissionSlot(request: Request) {
  const now = Date.now();
  if (now >= windowEnd) {
    windowEnd = now + RATE_WINDOW_MS;
    attempts = 0;
    attemptsByIp.clear();
  }
  const forwardedIp =
    process.env.VERCEL === "1"
      ? (request.headers.get("x-vercel-forwarded-for")?.trim() ?? "")
      : "";
  const ip = isIP(forwardedIp) ? forwardedIp : "";
  const ipAttempts = attemptsByIp.get(ip) ?? 0;
  if (attempts >= MAX_PER_INSTANCE || ipAttempts >= MAX_PER_IP)
    return Math.ceil((windowEnd - now) / 1000);

  attempts++;
  if (ip) attemptsByIp.set(ip, ipAttempts + 1);
  return 0;
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json(
      { error: "Solicitud no permitida." },
      { status: 403 },
    );
  }
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    return NextResponse.json(
      { error: "Se esperaba un comentario en formato JSON." },
      { status: 415 },
    );
  }

  let body: FeedbackRequest;

  try {
    body = await readFeedbackBody(request);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return NextResponse.json(
        { error: "El envio es demasiado grande." },
        { status: 413 },
      );
    }
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

  if (contact.length > 320 || pageUrl.length > 2048 || source.length > 64) {
    return NextResponse.json(
      { error: "Los datos del comentario son demasiado largos." },
      { status: 400 },
    );
  }

  const url = getAppsScriptUrl(process.env.GOOGLE_APPS_SCRIPT_FEEDBACK_URL);
  const secret = process.env.GOOGLE_APPS_SCRIPT_FEEDBACK_SECRET;

  if (!url || !secret?.trim()) {
    return NextResponse.json(
      { error: "El envio de feedback no esta disponible en este momento." },
      { status: 503 },
    );
  }

  const retryAfter = takeSubmissionSlot(request);
  if (retryAfter) {
    return NextResponse.json(
      {
        error:
          "Enviaste demasiados comentarios. Intenta de nuevo en unos minutos.",
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        secret,
        feedback,
        contact,
        pageUrl,
        source,
        userAgent: (request.headers.get("user-agent") ?? "").slice(0, 512),
        submittedAt: new Date().toISOString(),
      }),
    });
    const result: unknown = response.ok ? await response.json() : null;
    if (
      result &&
      typeof result === "object" &&
      "ok" in result &&
      result.ok === true
    ) {
      return NextResponse.json({
        message:
          "Gracias. Me ayuda un monton para seguir mejorando la calculadora.",
      });
    }
  } catch {
    // Don't forward upstream responses or exceptions, which may include private data.
  }

  return NextResponse.json({ error: UPSTREAM_ERROR }, { status: 502 });
}
