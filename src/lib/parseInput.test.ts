import { describe, expect, it } from "vitest";
import { parseInboxInput, parsePlainText, tryParseJson } from "./parseInput";

describe("parsePlainText", () => {
  it("extracts From/Subject lines and treats the rest as the body", () => {
    const [item] = parsePlainText("From: alice@acme.com\nSubject: Prod outage\n\nCheckout is down.");
    expect(item.source).toBe("alice@acme.com");
    expect(item.subject).toBe("Prod outage");
    expect(item.body).toBe("Checkout is down.");
  });

  it("splits multiple blank-line-separated blocks into separate items", () => {
    const items = parsePlainText("Subject: First\n\nBody one\n\nSubject: Second\n\nBody two");
    expect(items).toHaveLength(2);
    expect(items[0].subject).toBe("First");
    expect(items[1].subject).toBe("Second");
  });

  it("defaults source to 'pasted' and subject to the first line when no From:/Subject: prefix is given", () => {
    const [item] = parsePlainText("Just a plain message\nwith a second line");
    expect(item.source).toBe("pasted");
    expect(item.subject).toBe("Just a plain message");
    expect(item.body).toBe("with a second line");
  });

  it("assigns a unique id to each parsed item", () => {
    const items = parsePlainText("Subject: A\n\nBody A\n\nSubject: B\n\nBody B");
    expect(items[0].id).not.toBe(items[1].id);
  });
});

describe("tryParseJson", () => {
  it("returns null for invalid JSON", () => {
    expect(tryParseJson("not json")).toBeNull();
  });

  it("returns null for valid JSON that isn't an array", () => {
    expect(tryParseJson('{"foo": "bar"}')).toBeNull();
  });

  it("parses a well-formed array and preserves provided fields", () => {
    const items = tryParseJson(
      JSON.stringify([{ id: "1", source: "bob", subject: "Hi", body: "Hello", receivedAt: "2026-01-01T00:00:00Z" }]),
    );
    expect(items).toEqual([
      { id: "1", source: "bob", subject: "Hi", body: "Hello", receivedAt: "2026-01-01T00:00:00Z" },
    ]);
  });

  it("fills in defaults for missing fields", () => {
    const items = tryParseJson(JSON.stringify([{}]));
    expect(items).not.toBeNull();
    expect(items?.[0].source).toBe("pasted");
    expect(items?.[0].subject).toBe("Item 1");
    expect(items?.[0].body).toBe("");
    expect(items?.[0].id).toBeTruthy();
  });
});

describe("parseInboxInput", () => {
  it("returns an empty array for blank input", () => {
    expect(parseInboxInput("   ")).toEqual([]);
  });

  it("routes JSON-looking input through tryParseJson", () => {
    const items = parseInboxInput(JSON.stringify([{ id: "1", subject: "From JSON" }]));
    expect(items).toHaveLength(1);
    expect(items[0].subject).toBe("From JSON");
  });

  it("falls back to plain-text parsing for non-JSON input", () => {
    const items = parseInboxInput("Subject: Plain\n\nBody text");
    expect(items).toHaveLength(1);
    expect(items[0].subject).toBe("Plain");
  });
});
