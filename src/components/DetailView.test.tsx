import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DetailView } from "./DetailView";
import type { InboxItem, TriageResult } from "../types";
import * as api from "../lib/api";

vi.mock("../lib/api", () => ({
  draftReply: vi.fn(),
}));

const item: InboxItem = {
  id: "1",
  source: "alice@acme.com",
  subject: "Prod outage",
  body: "Checkout is down.",
  receivedAt: "2026-01-01T00:00:00Z",
};
const triage: TriageResult = {
  id: "1",
  category: "urgent-bug",
  urgency: 5,
  actionItems: ["Investigate the outage"],
  summary: "Checkout API is returning errors.",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("DetailView", () => {
  it("renders the item, triage details, and action items", () => {
    render(<DetailView item={item} triage={triage} onBack={vi.fn()} />);
    expect(screen.getByText("Prod outage")).toBeInTheDocument();
    expect(screen.getByText("urgent-bug")).toBeInTheDocument();
    expect(screen.getByText("Urgency 5/5")).toBeInTheDocument();
    expect(screen.getByText("Investigate the outage")).toBeInTheDocument();
    expect(screen.getByText("Checkout is down.")).toBeInTheDocument();
  });

  it("generates and displays a draft reply, then allows copying it", async () => {
    vi.mocked(api.draftReply).mockResolvedValue({ itemId: "1", draft: "We're on it." });
    const user = userEvent.setup();
    // Must come after userEvent.setup(), which installs its own clipboard stub.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<DetailView item={item} triage={triage} onBack={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /generate draft reply/i }));

    const textarea = await screen.findByDisplayValue("We're on it.");
    expect(textarea).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /copy to clipboard/i }));

    expect(writeText).toHaveBeenCalledWith("We're on it.");
    expect(screen.getByRole("button", { name: /copied!/i })).toBeInTheDocument();
  });

  it("shows an inline error when draft generation fails", async () => {
    vi.mocked(api.draftReply).mockRejectedValue(new Error("Upstream failed"));
    const user = userEvent.setup();

    render(<DetailView item={item} triage={triage} onBack={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /generate draft reply/i }));

    await waitFor(() => expect(screen.getByText("Upstream failed")).toBeInTheDocument());
  });

  it("calls onBack when the back link is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<DetailView item={item} triage={triage} onBack={onBack} />);

    await user.click(screen.getByText(/back to results/i));

    expect(onBack).toHaveBeenCalled();
  });
});
