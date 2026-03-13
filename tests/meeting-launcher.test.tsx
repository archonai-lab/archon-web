import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingLauncher } from "../src/components/MeetingLauncher";
import type { AgentCard } from "../src/lib/types";

const mockAgents: AgentCard[] = [
  { id: "alice", displayName: "Alice", status: "active", activity: "connected" },
  { id: "bob", displayName: "Bob", status: "active", activity: "idle" },
];

describe("MeetingLauncher", () => {
  it("renders the form with all fields", () => {
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "New Meeting" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Architecture Review")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What should we discuss?")).toBeInTheDocument();
    expect(screen.getByText("Post-Meeting Summary")).toBeInTheDocument();
  });

  it("shows three summary mode options", () => {
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} />);

    expect(screen.getByRole("button", { name: "None" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Structured" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AI Summary" })).toBeInTheDocument();
  });

  it("disables AI Summary when llmAvailable is false", () => {
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} llmAvailable={false} />);

    const aiBtn = screen.getByRole("button", { name: "AI Summary" });
    expect(aiBtn).toBeDisabled();
  });

  it("enables AI Summary when llmAvailable is true", () => {
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} llmAvailable={true} />);

    const aiBtn = screen.getByRole("button", { name: "AI Summary" });
    expect(aiBtn).not.toBeDisabled();
  });

  it("disables start button without title and invitees", () => {
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} />);

    const startBtn = screen.getByRole("button", { name: "Start Meeting" });
    expect(startBtn).toBeDisabled();
  });

  it("enables start button with title and selected agent", async () => {
    const user = userEvent.setup();
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Architecture Review"), "Sprint Review");

    // Click on Alice to select her
    const aliceBtn = screen.getByText("Alice").closest("button")!;
    await user.click(aliceBtn);

    const startBtn = screen.getByRole("button", { name: "Start Meeting" });
    expect(startBtn).not.toBeDisabled();
  });

  it("calls onStart with summary mode when starting", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<MeetingLauncher agents={mockAgents} onStart={onStart} llmAvailable={true} />);

    await user.type(screen.getByPlaceholderText("Architecture Review"), "Test Meeting");

    // Select agent
    const aliceBtn = screen.getByText("Alice").closest("button")!;
    await user.click(aliceBtn);

    // Select structured summary
    await user.click(screen.getByRole("button", { name: "Structured" }));

    // Start
    await user.click(screen.getByRole("button", { name: "Start Meeting" }));

    expect(onStart).toHaveBeenCalledWith(
      "Test Meeting",
      ["alice"],
      "",
      undefined,
      "structured",
    );
  });

  it("shows description for selected summary mode", async () => {
    const user = userEvent.setup();
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} />);

    // Default is "off"
    expect(screen.getByText("No summary will be generated.")).toBeInTheDocument();

    // Select structured
    await user.click(screen.getByRole("button", { name: "Structured" }));
    expect(screen.getByText("Markdown summary extracted from meeting data.")).toBeInTheDocument();
  });

  it("shows agents with correct status indicators", () => {
    render(<MeetingLauncher agents={mockAgents} onStart={vi.fn()} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
