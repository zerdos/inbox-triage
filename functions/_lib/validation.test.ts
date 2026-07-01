import { describe, expect, it } from "vitest";
import { draftReplyRequestSchema, triageRequestSchema, triageResultSchema } from "./validation";

const item = { id: "1", source: "a", subject: "s", body: "b", receivedAt: "2026-01-01T00:00:00Z" };
const result = { id: "1", category: "fyi", urgency: 1, actionItems: [], summary: "sum" };

describe("triageRequestSchema", () => {
  it("accepts a well-formed request", () => {
    expect(triageRequestSchema.safeParse({ items: [item] }).success).toBe(true);
  });

  it("rejects an empty items array", () => {
    expect(triageRequestSchema.safeParse({ items: [] }).success).toBe(false);
  });

  it("rejects more than 50 items", () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ ...item, id: String(i) }));
    expect(triageRequestSchema.safeParse({ items }).success).toBe(false);
  });

  it("rejects an item missing a required field", () => {
    const { body: _body, ...withoutBody } = item;
    expect(triageRequestSchema.safeParse({ items: [withoutBody] }).success).toBe(false);
  });

  it("rejects a non-array items field", () => {
    expect(triageRequestSchema.safeParse({ items: "not-an-array" }).success).toBe(false);
  });
});

describe("triageResultSchema", () => {
  it("accepts a well-formed result", () => {
    expect(triageResultSchema.safeParse(result).success).toBe(true);
  });

  it("rejects urgency outside 1-5", () => {
    expect(triageResultSchema.safeParse({ ...result, urgency: 6 }).success).toBe(false);
  });

  it("rejects a non-string actionItems entry", () => {
    expect(triageResultSchema.safeParse({ ...result, actionItems: [1, 2] }).success).toBe(false);
  });
});

describe("draftReplyRequestSchema", () => {
  it("accepts a well-formed request", () => {
    expect(draftReplyRequestSchema.safeParse({ item, triage: result }).success).toBe(true);
  });

  it("rejects a missing triage field", () => {
    expect(draftReplyRequestSchema.safeParse({ item }).success).toBe(false);
  });

  it("rejects a malformed nested item", () => {
    expect(draftReplyRequestSchema.safeParse({ item: { id: "1" }, triage: result }).success).toBe(false);
  });
});
