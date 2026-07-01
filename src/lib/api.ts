import type { DraftReply, InboxItem, TriageResult } from "../types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function triageItems(items: InboxItem[]): Promise<{ results: TriageResult[] }> {
  return postJson("/api/triage", { items });
}

export function draftReply(item: InboxItem, triage: TriageResult): Promise<DraftReply> {
  return postJson<{ draft: string }>("/api/draft-reply", { item, triage }).then((res) => ({
    itemId: item.id,
    draft: res.draft,
  }));
}
