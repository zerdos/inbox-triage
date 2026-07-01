import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsList } from "./ResultsList";
import type { InboxItem, TriageResult } from "../types";

const items: InboxItem[] = [
  { id: "1", source: "a", subject: "Low urgency", body: "b", receivedAt: "2026-01-01T00:00:00Z" },
  { id: "2", source: "b", subject: "High urgency", body: "b", receivedAt: "2026-01-01T00:00:00Z" },
];

const results: TriageResult[] = [
  { id: "1", category: "fyi", urgency: 1, actionItems: [], summary: "low" },
  { id: "2", category: "urgent-bug", urgency: 5, actionItems: [], summary: "high" },
];

describe("ResultsList", () => {
  it("sorts rows by urgency descending", () => {
    render(<ResultsList items={items} results={results} onSelect={vi.fn()} onStartOver={vi.fn()} />);
    const subjects = screen.getAllByText(/urgency$/i).map((el) => el.textContent);
    expect(subjects).toEqual(["High urgency", "Low urgency"]);
  });

  it("filters rows by the selected category", async () => {
    const user = userEvent.setup();
    render(<ResultsList items={items} results={results} onSelect={vi.fn()} onStartOver={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText("Category"), "urgent-bug");

    expect(screen.getByText("High urgency")).toBeInTheDocument();
    expect(screen.queryByText("Low urgency")).not.toBeInTheDocument();
  });

  it("calls onSelect with the row's id when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResultsList items={items} results={results} onSelect={onSelect} onStartOver={vi.fn()} />);

    await user.click(screen.getByText("High urgency"));

    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("calls onStartOver when 'Start over' is clicked", async () => {
    const user = userEvent.setup();
    const onStartOver = vi.fn();
    render(<ResultsList items={items} results={results} onSelect={vi.fn()} onStartOver={onStartOver} />);

    await user.click(screen.getByRole("button", { name: /start over/i }));

    expect(onStartOver).toHaveBeenCalled();
  });
});
