import { useState } from "react";
import { parseInboxInput } from "../lib/parseInput";

const PLACEHOLDER = `Paste messages separated by a blank line, e.g.

From: alice@acme.com
Subject: Prod outage

The checkout API has been returning 500s for 10 minutes.

From: bob@investor.vc
Subject: Following up

Any update on the Series A deck?

...or paste a JSON array of {id, source, subject, body, receivedAt} objects.`;

interface InputScreenProps {
  onSubmit: (raw: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function InputScreen({ onSubmit, isLoading, error }: InputScreenProps) {
  const [raw, setRaw] = useState("");
  const itemCount = raw.trim() ? parseInboxInput(raw).length : 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Inbox Triage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste a batch of messages. Claude will classify urgency/category, extract action items,
          and let you draft replies for the ones that matter.
        </p>
      </div>

      <textarea
        className="h-72 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
        placeholder={PLACEHOLDER}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        disabled={isLoading}
      />

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? "" : "s"} detected` : "No items detected yet"}
        </span>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={itemCount === 0 || isLoading}
          onClick={() => onSubmit(raw)}
        >
          {isLoading ? "Triaging…" : "Run Triage"}
        </button>
      </div>
    </div>
  );
}
