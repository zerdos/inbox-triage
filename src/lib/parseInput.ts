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
 * Parses items separated by blank lines. Each item may start with a "From: ..."
 * and/or "Subject: ..." header line, optionally followed by a blank line, then
 * the body. Items themselves are delimited by blank lines (not by the header/body
 * separator blank line, which is consumed as part of the header).
 */
export function parsePlainText(raw: string): InboxItem[] {
  const now = new Date().toISOString();
  const lines = raw.split("\n");
  const items: InboxItem[] = [];
  let i = 0;

  while (i < lines.length) {
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) break;

    let source = "pasted";
    let subject = "";
    let consumedHeader = false;

    while (i < lines.length) {
      const line = lines[i];
      const fromMatch = line.match(/^from:\s*(.+)$/i);
      const subjectMatch = line.match(/^subject:\s*(.+)$/i);
      if (fromMatch) {
        source = fromMatch[1].trim();
        i++;
        consumedHeader = true;
      } else if (subjectMatch) {
        subject = subjectMatch[1].trim();
        i++;
        consumedHeader = true;
      } else {
        break;
      }
    }

    if (consumedHeader && i < lines.length && lines[i].trim() === "") {
      i++;
    }

    if (!subject) {
      subject = lines[i] ?? `Item ${items.length + 1}`;
      i++;
    }

    const bodyLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      bodyLines.push(lines[i]);
      i++;
    }

    items.push({
      id: crypto.randomUUID(),
      source,
      subject,
      body: bodyLines.join("\n").trim(),
      receivedAt: now,
    });
  }

  return items;
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
