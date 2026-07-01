import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InputScreen } from "./InputScreen";

describe("InputScreen", () => {
  it("shows 'No items detected yet' and a disabled submit button with empty input", () => {
    render(<InputScreen onSubmit={vi.fn()} isLoading={false} error={null} />);
    expect(screen.getByText("No items detected yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run triage/i })).toBeDisabled();
  });

  it("updates the item-count preview as text is typed and enables submit", async () => {
    const user = userEvent.setup();
    render(<InputScreen onSubmit={vi.fn()} isLoading={false} error={null} />);

    await user.type(screen.getByPlaceholderText(/paste messages/i), "Subject: Hi{enter}{enter}Body text");

    expect(screen.getByText("1 item detected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run triage/i })).toBeEnabled();
  });

  it("calls onSubmit with the raw textarea value when clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InputScreen onSubmit={onSubmit} isLoading={false} error={null} />);

    const textarea = screen.getByPlaceholderText(/paste messages/i);
    await user.type(textarea, "Subject: Hi{enter}{enter}Body text");
    await user.click(screen.getByRole("button", { name: /run triage/i }));

    expect(onSubmit).toHaveBeenCalledWith("Subject: Hi\n\nBody text");
  });

  it("renders the error message when provided", () => {
    render(<InputScreen onSubmit={vi.fn()} isLoading={false} error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("disables the textarea and shows a loading label while isLoading", () => {
    render(<InputScreen onSubmit={vi.fn()} isLoading={true} error={null} />);
    expect(screen.getByPlaceholderText(/paste messages/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /triaging/i })).toBeDisabled();
  });
});
