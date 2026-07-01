import { useEffect, useState } from "react";
import { InputScreen } from "./components/InputScreen";
import { ResultsList } from "./components/ResultsList";
import { DetailView } from "./components/DetailView";
import { parseInboxInput } from "./lib/parseInput";
import { triageItems } from "./lib/api";
import { loadBatch, saveBatch, clearBatch } from "./lib/storage";
import type { InboxItem, TriageResult } from "./types";

type View = { name: "input" } | { name: "results" } | { name: "detail"; itemId: string };

function App() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [results, setResults] = useState<TriageResult[]>([]);
  const [view, setView] = useState<View>({ name: "input" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const batch = loadBatch();
    if (batch && batch.items.length > 0) {
      setItems(batch.items);
      setResults(batch.results);
      setView({ name: "results" });
    }
  }, []);

  async function handleSubmit(raw: string) {
    const parsedItems = parseInboxInput(raw);
    if (parsedItems.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const { results: triageResults } = await triageItems(parsedItems);
      setItems(parsedItems);
      setResults(triageResults);
      saveBatch({ items: parsedItems, results: triageResults });
      setView({ name: "results" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to triage items");
    } finally {
      setIsLoading(false);
    }
  }

  function handleStartOver() {
    clearBatch();
    setItems([]);
    setResults([]);
    setError(null);
    setView({ name: "input" });
  }

  if (view.name === "input") {
    return <InputScreen onSubmit={handleSubmit} isLoading={isLoading} error={error} />;
  }

  if (view.name === "detail") {
    const item = items.find((i) => i.id === view.itemId);
    const triage = results.find((r) => r.id === view.itemId);
    if (item && triage) {
      return <DetailView item={item} triage={triage} onBack={() => setView({ name: "results" })} />;
    }
  }

  return (
    <ResultsList
      items={items}
      results={results}
      onSelect={(itemId) => setView({ name: "detail", itemId })}
      onStartOver={handleStartOver}
    />
  );
}

export default App;
