import type { TriageBatch } from "../types";

const STORAGE_KEY = "inbox-triage:last-batch";

export function loadBatch(): TriageBatch | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TriageBatch;
  } catch {
    return null;
  }
}

export function saveBatch(batch: TriageBatch): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batch));
}

export function clearBatch(): void {
  localStorage.removeItem(STORAGE_KEY);
}
