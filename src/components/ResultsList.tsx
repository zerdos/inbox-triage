import { useMemo, useState } from "react";
import type { InboxItem, TriageResult } from "../types";

interface ResultsListProps {
  items: InboxItem[];
  results: TriageResult[];
  onSelect: (itemId: string) => void;
  onStartOver: () => void;
}

const URGENCY_STYLES: Record<number, string> = {
  5: "bg-red-100 text-red-800",
  4: "bg-orange-100 text-orange-800",
  3: "bg-amber-100 text-amber-800",
  2: "bg-sky-100 text-sky-800",
  1: "bg-slate-100 text-slate-600",
};

export function ResultsList({ items, results, onSelect, onStartOver }: ResultsListProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const categories = useMemo(() => Array.from(new Set(results.map((r) => r.category))).sort(), [results]);

  const rows = useMemo(() => {
    return results
      .filter((r) => categoryFilter === "all" || r.category === categoryFilter)
      .sort((a, b) => b.urgency - a.urgency);
  }, [results, categoryFilter]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Triage Results</h1>
        <button
          type="button"
          className="text-sm font-medium text-slate-500 underline hover:text-slate-800"
          onClick={onStartOver}
        >
          Start over
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-500" htmlFor="category-filter">
          Category
        </label>
        <select
          id="category-filter"
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All ({results.length})</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category} ({results.filter((r) => r.category === category).length})
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 && <p className="text-sm text-slate-500">No results match this filter.</p>}

      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
        {rows.map((result) => {
          const item = itemsById.get(result.id);
          if (!item) return null;
          return (
            <li key={result.id}>
              <button
                type="button"
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                onClick={() => onSelect(result.id)}
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${URGENCY_STYLES[result.urgency]}`}
                >
                  U{result.urgency}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-slate-900">{item.subject}</span>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                      {result.category}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-slate-500">{result.summary}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
