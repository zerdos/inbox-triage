import { useState } from "react";
import type { InboxItem, TriageResult } from "../types";
import { draftReply } from "../lib/api";

interface DetailViewProps {
  item: InboxItem;
  triage: TriageResult;
  onBack: () => void;
}

export function DetailView({ item, triage, onBack }: DetailViewProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerateDraft() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await draftReply(item, triage);
      setDraft(result.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draft reply");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <button
        type="button"
        className="self-start text-sm font-medium text-slate-500 underline hover:text-slate-800"
        onClick={onBack}
      >
        ← Back to results
      </button>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">{item.subject}</h1>
        <p className="mt-1 text-sm text-slate-500">
          From {item.source} · {new Date(item.receivedAt).toLocaleString()}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{triage.category}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">Urgency {triage.urgency}/5</span>
      </div>

      <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">{triage.summary}</p>

      {triage.actionItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Action items</h2>
          <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
            {triage.actionItems.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-900">Original message</h2>
        <pre className="mt-1 whitespace-pre-wrap rounded-md border border-slate-200 p-3 text-sm text-slate-700">
          {item.body}
        </pre>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Draft reply</h2>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleGenerateDraft}
            disabled={isLoading}
          >
            {isLoading ? "Drafting…" : draft ? "Regenerate" : "Generate Draft Reply"}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {draft !== null && (
          <>
            <textarea
              className="h-40 w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="button"
              className="self-start rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
