import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const url = "https://script.google.com/macros/s/test-only/exec";
const secret = "test-only-secret";
const validBody = JSON.stringify({ feedback: "Un comentario valido" });
const fetchMock = vi.fn<typeof fetch>();
let post: typeof import("../src/app/api/feedback/route").POST;

function request(body = validBody, headers: Record<string, string> = {}) {
  return new Request("https://example.test/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("GOOGLE_APPS_SCRIPT_FEEDBACK_URL", url);
  vi.stubEnv("GOOGLE_APPS_SCRIPT_FEEDBACK_SECRET", secret);
  vi.stubEnv("VERCEL", undefined);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetchMock);
  ({ POST: post } = await import("../src/app/api/feedback/route"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("feedback endpoint", () => {
  it("sends the server secret and original fields, returning only the public success message", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ ok: true, secret, url }));
    const response = await post(
      request(
        JSON.stringify({
          feedback: "  Funciona bien  ",
          contact: "  test@example.test  ",
          pageUrl: "  https://example.test/  ",
          source: "floating-widget",
          secret: "client-value",
          userAgent: "client-value",
          submittedAt: "client-value",
        }),
        {
          "User-Agent": "Test browser",
          "Content-Type": "application/json; charset=utf-8",
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message:
        "Gracias. Me ayuda un monton para seguir mejorando la calculadora.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [destination, options] = fetchMock.mock.calls[0];
    expect(String(destination)).toBe(url);
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: expect.any(AbortSignal),
    });
    expect(JSON.parse(options?.body as string)).toEqual({
      secret,
      feedback: "Funciona bien",
      contact: "test@example.test",
      pageUrl: "https://example.test/",
      source: "floating-widget",
      userAgent: "Test browser",
      submittedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.+Z$/),
    });
  });

  it.each([
    [undefined, secret],
    [url, undefined],
    [url, "   "],
    ["not a URL", secret],
    ["http://script.google.com/macros/s/test-only/exec", secret],
  ])(
    "fails closed when server configuration is missing or invalid (%#)",
    async (configuredUrl, configuredSecret) => {
      vi.stubEnv("GOOGLE_APPS_SCRIPT_FEEDBACK_URL", configuredUrl);
      vi.stubEnv("GOOGLE_APPS_SCRIPT_FEEDBACK_SECRET", configuredSecret);
      const response = await post(request());
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: expect.any(String) });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    "",
    "<html>Sign in</html>",
    "null",
    "{}",
    '{"ok":false}',
    '{"ok":"true"}',
    '{"ok":1}',
  ])(
    "rejects a response without the boolean acknowledgement (%#)",
    async (body) => {
      fetchMock.mockResolvedValueOnce(new Response(body));
      const response = await post(request());
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: expect.any(String) });
    },
  );

  it("rejects an upstream HTTP error even if its body claims success", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ ok: true }, { status: 500 }),
    );
    expect((await post(request())).status).toBe(502);
  });

  it.each([
    new Error(`Connection failed: ${url} ${secret}`),
    new DOMException("Timed out", "TimeoutError"),
  ])(
    "handles connection failures and timeouts without retries or private details (%#)",
    async (error) => {
      fetchMock.mockRejectedValueOnce(error);
      const response = await post(request());
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
        error: "No se pudo guardar el feedback en este momento.",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    "{",
    "null",
    "[]",
    '{"feedback":"  ok  "}',
    JSON.stringify({ feedback: "a".repeat(1201) }),
    JSON.stringify({
      feedback: "Un comentario valido",
      contact: "x".repeat(321),
    }),
  ])(
    "rejects invalid submissions before contacting Google (%#)",
    async (body) => {
      expect((await post(request(body))).status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("rejects oversized requests with or without a declared length", async () => {
    expect(
      (await post(request(validBody, { "Content-Length": "20000" }))).status,
    ).toBe(413);
    const oversized = request(
      JSON.stringify({ feedback: "\u00e1".repeat(8200) }),
    );
    expect(oversized.headers.has("content-length")).toBe(false);
    expect((await post(oversized)).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects cross-site browser posts and non-JSON submissions", async () => {
    expect(
      (await post(request(validBody, { "Sec-Fetch-Site": "cross-site" })))
        .status,
    ).toBe(403);
    expect(
      (await post(request(validBody, { "Content-Type": "text/plain" }))).status,
    ).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits submissions per trusted IP and allows retries after the window resets", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.useFakeTimers({ toFake: ["Date"] });
    const headers = { "x-vercel-forwarded-for": "203.0.113.10" };
    for (let index = 0; index < 5; index++) {
      expect((await post(request(validBody, headers))).status).toBe(200);
    }
    const blocked = await post(request(validBody, headers));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("600");
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(
      (
        await post(
          request(validBody, { "x-vercel-forwarded-for": "203.0.113.20" }),
        )
      ).status,
    ).toBe(200);
    vi.setSystemTime(Date.now() + 10 * 60 * 1000);
    expect((await post(request(validBody, headers))).status).toBe(200);
  });

  it("caps submissions per instance even when no trusted IP is available", async () => {
    for (let index = 0; index < 60; index++) {
      expect((await post(request())).status).toBe(200);
    }
    expect((await post(request())).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(60);
  });
});
