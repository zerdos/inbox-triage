import { afterEach, describe, expect, it, vi } from "vitest";
import { draftReply, triageItems } from "./api";
import type { InboxItem, TriageResult } from "../types";

const item: InboxItem = { id: "1", source: "a", subject: "s", body: "b", receivedAt: "2026-01-01T00:00:00Z" };
const triage: TriageResult = { id: "1", category: "fyi", urgency: 1, actionItems: [], summary: "sum" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("triageItems", () => {
  it("posts to /api/triage and returns the parsed results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [triage] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await triageItems([item]);

    expect(result).toEqual({ results: [triage] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/triage");
    expect(JSON.parse(init.body)).toEqual({ items: [item] });
  });

  it("throws the server-provided error message on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ error: "Invalid request body" }),
      }),
    );

    await expect(triageItems([item])).rejects.toThrow("Invalid request body");
  });

  it("falls back to the response's statusText when the error body isn't parseable JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("not json");
        },
      }),
    );

    await expect(triageItems([item])).rejects.toThrow("Internal Server Error");
  });

  it("falls back to a status-based message when the error body has no 'error' field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({}),
      }),
    );

    await expect(triageItems([item])).rejects.toThrow("Request failed with status 500");
  });
});

describe("draftReply", () => {
  it("posts to /api/draft-reply and returns a DraftReply keyed by itemId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ draft: "Thanks, on it." }),
      }),
    );

    const result = await draftReply(item, triage);

    expect(result).toEqual({ itemId: "1", draft: "Thanks, on it." });
  });
});
