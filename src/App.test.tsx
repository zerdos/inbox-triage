import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import * as api from "./lib/api";
import * as storage from "./lib/storage";
import type { TriageBatch } from "./types";

vi.mock("./lib/api", () => ({
  triageItems: vi.fn(),
}));

vi.mock("./lib/storage", () => ({
  loadBatch: vi.fn(),
  saveBatch: vi.fn(),
  clearBatch: vi.fn(),
}));

const sampleBatch: TriageBatch = {
  items: [{ id: "1", source: "a", subject: "Prod outage", body: "Checkout is down.", receivedAt: "2026-01-01T00:00:00Z" }],
  results: [{ id: "1", category: "urgent-bug", urgency: 5, actionItems: [], summary: "Checkout is broken." }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(storage.loadBatch).mockReturnValue(null);
});

describe("App", () => {
  it("renders InputScreen when there is no stored batch", () => {
    render(<App />);
    expect(screen.getByText("Inbox Triage")).toBeInTheDocument();
  });

  it("jumps straight to ResultsList when a batch is already in storage", () => {
    vi.mocked(storage.loadBatch).mockReturnValue(sampleBatch);
    render(<App />);
    expect(screen.getByText("Triage Results")).toBeInTheDocument();
    expect(screen.getByText("Prod outage")).toBeInTheDocument();
  });

  it("triages input, saves the batch, and shows results", async () => {
    vi.mocked(api.triageItems).mockResolvedValue({ results: sampleBatch.results });
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByPlaceholderText(/paste messages/i), "Subject: Prod outage{enter}{enter}Checkout is down.");
    await user.click(screen.getByRole("button", { name: /run triage/i }));

    expect(await screen.findByText("Triage Results")).toBeInTheDocument();
    expect(api.triageItems).toHaveBeenCalled();
    expect(storage.saveBatch).toHaveBeenCalled();
  });

  it("navigates into a result's detail view and back", async () => {
    vi.mocked(storage.loadBatch).mockReturnValue(sampleBatch);
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByText("Prod outage"));

    expect(await screen.findByRole("heading", { name: "Prod outage" })).toBeInTheDocument();

    await user.click(screen.getByText(/back to results/i));

    expect(await screen.findByText("Triage Results")).toBeInTheDocument();
  });

  it("clears storage and returns to InputScreen on Start over", async () => {
    vi.mocked(storage.loadBatch).mockReturnValue(sampleBatch);
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /start over/i }));

    expect(storage.clearBatch).toHaveBeenCalled();
    expect(await screen.findByText("Inbox Triage")).toBeInTheDocument();
  });
});
