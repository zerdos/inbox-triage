import { afterEach, describe, expect, it, vi } from "vitest";
import { callForText, callWithSchema, GeminiApiError } from "./gemini";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetchOnce(response: { ok: boolean; status?: number; text?: () => Promise<string>; json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    text: response.text ?? (async () => ""),
    json: response.json ?? (async () => ({})),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("callWithSchema", () => {
  it("sends the model, headers, and responseSchema, and parses the JSON text response", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"results":[]}' }] } }] }),
    });

    const schema = { type: "OBJECT", properties: {} };
    const result = await callWithSchema(
      "test-key",
      { system: "sys", userContent: "user", maxTokens: 100, schema },
    );

    expect(result).toEqual({ results: [] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent");
    expect(init.headers["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(init.body);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toEqual(schema);
    expect(body.systemInstruction).toEqual({ parts: [{ text: "sys" }] });
  });

  it("throws GeminiApiError when the response text isn't valid JSON", async () => {
    mockFetchOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "not json" }] } }] }),
    });

    await expect(callWithSchema("test-key", { system: "s", userContent: "u", maxTokens: 1, schema: {} })).rejects.toThrow(
      GeminiApiError,
    );
  });
});

describe("callForText", () => {
  it("omits responseSchema/responseMimeType and returns the plain text", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: "Hello there" }] } }] }),
    });

    const result = await callForText("test-key", { system: "sys", userContent: "user", maxTokens: 100 });

    expect(result).toBe("Hello there");
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.generationConfig.responseMimeType).toBeUndefined();
    expect(body.generationConfig.responseSchema).toBeUndefined();
  });

  it("throws GeminiApiError on a non-ok response", async () => {
    mockFetchOnce({ ok: false, status: 401, text: async () => "invalid api key" });

    await expect(callForText("bad-key", { system: "s", userContent: "u", maxTokens: 1 })).rejects.toThrow(
      GeminiApiError,
    );
  });

  it("throws GeminiApiError when no candidate text is present", async () => {
    mockFetchOnce({ ok: true, json: async () => ({ candidates: [] }) });

    await expect(callForText("test-key", { system: "s", userContent: "u", maxTokens: 1 })).rejects.toThrow(
      "Gemini response did not include any content",
    );
  });
});
