import type { InboxItem } from "../types";

/** Parses a pasted JSON array of items. Returns null if the text isn't valid JSON. */
export function tryParseJson(raw: string): InboxItem[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const now = new Date().toISOString();
  return parsed.map((entry, index) => {
    const record = entry as Partial<InboxItem>;
    return {
      id: record.id ?? crypto.randomUUID(),
      source: record.source ?? "pasted",
      subject: record.subject ?? `Item ${index + 1}`,
      body: record.body ?? "",
      receivedAt: record.receivedAt ?? now,
    };
  });
}

/**
 * Parses blank-line-separated text blocks. Each block may start with a
 * "From: ..." line and a "Subject: ..." line; everything after is the body.
 */
export function parsePlainText(raw: string): InboxItem[] {
  const now = new Date().toISOString();
  const blocks = raw
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split("\n");
    let source = "pasted";
    let subject = "";

    while (lines.length > 0) {
      const line = lines[0];
      const fromMatch = line.match(/^from:\s*(.+)$/i);
      const subjectMatch = line.match(/^subject:\s*(.+)$/i);
      if (fromMatch) {
        source = fromMatch[1].trim();
        lines.shift();
      } else if (subjectMatch) {
        subject = subjectMatch[1].trim();
        lines.shift();
      } else {
        break;
      }
    }

    if (!subject) {
      subject = lines.shift() ?? `Item ${index + 1}`;
    }

    return {
      id: crypto.randomUUID(),
      source,
      subject,
      body: lines.join("\n").trim(),
      receivedAt: now,
    };
  });
}

export function parseInboxInput(raw: string): InboxItem[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    const fromJson = tryParseJson(trimmed);
    if (fromJson) return fromJson;
  }
  return parsePlainText(trimmed);
}
