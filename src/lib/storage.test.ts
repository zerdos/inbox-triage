import { beforeEach, describe, expect, it } from "vitest";
import { clearBatch, loadBatch, saveBatch } from "./storage";
import type { TriageBatch } from "../types";

const sampleBatch: TriageBatch = {
  items: [{ id: "1", source: "a", subject: "s", body: "b", receivedAt: "2026-01-01T00:00:00Z" }],
  results: [{ id: "1", category: "fyi", urgency: 1, actionItems: [], summary: "sum" }],
};

beforeEach(() => {
  localStorage.clear();
});

describe("loadBatch/saveBatch/clearBatch", () => {
  it("returns null when nothing has been saved", () => {
    expect(loadBatch()).toBeNull();
  });

  it("round-trips a saved batch", () => {
    saveBatch(sampleBatch);
    expect(loadBatch()).toEqual(sampleBatch);
  });

  it("returns null when the stored value is corrupt JSON", () => {
    localStorage.setItem("inbox-triage:last-batch", "{not valid json");
    expect(loadBatch()).toBeNull();
  });

  it("removes the stored batch on clearBatch", () => {
    saveBatch(sampleBatch);
    clearBatch();
    expect(loadBatch()).toBeNull();
  });
});
