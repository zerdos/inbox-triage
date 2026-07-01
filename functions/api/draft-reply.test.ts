// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./draft-reply";

const validItem = { id: "1", source: "a", subject: "s", body: "b", receivedAt: "2026-01-01T00:00:00Z" };
const validTriage = { id: "1", category: "fyi", urgency: 1, actionItems: [], summary: "sum" };

function createContext(request: Request, env: Partial<Env> = {}): Parameters<typeof onRequestPost>[0] {
  return {
    request,
    functionPath: "",
    waitUntil: () => {},
    passThroughOnException: () => {},
    next: async () => new Response(),
    env,
    params: {},
    data: {},
  } as unknown as Parameters<typeof onRequestPost>[0];
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/draft-reply", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/draft-reply", () => {
  it("returns 500 when GEMINI_API_KEY is missing", async () => {
    const res = await onRequestPost(createContext(jsonRequest({ item: validItem, triage: validTriage })));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/GEMINI_API_KEY/);
  });

  it("returns 400 for a body that isn't valid JSON", async () => {
    const request = new Request("http://localhost/api/draft-reply", { method: "POST", body: "not json" });
    const res = await onRequestPost(createContext(request, { GEMINI_API_KEY: "test-key" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when the body fails schema validation", async () => {
    const res = await onRequestPost(createContext(jsonRequest({ item: validItem }), { GEMINI_API_KEY: "test-key" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with the draft on a successful upstream call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "Thanks, on it." }] } }] }),
      }),
    );

    const res = await onRequestPost(
      createContext(jsonRequest({ item: validItem, triage: validTriage }), { GEMINI_API_KEY: "test-key" }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ draft: "Thanks, on it." });
  });

  it("returns 502 when the upstream Gemini call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "invalid api key" }),
    );

    const res = await onRequestPost(
      createContext(jsonRequest({ item: validItem, triage: validTriage }), { GEMINI_API_KEY: "bad-key" }),
    );

    expect(res.status).toBe(502);
  });
});
