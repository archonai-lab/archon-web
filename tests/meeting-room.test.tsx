import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingRoom } from "../src/components/MeetingRoom";
import type { MeetingState } from "../src/lib/types";

// jsdom doesn't implement scrollTo
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
});

function makeMeeting(overrides: Partial<MeetingState> = {}): MeetingState {
  return {
    id: "m1",
    title: "Sprint Review",
    initiator: "ceo",
    phase: "discuss",
    status: "active",
    budgetRemaining: 5000,
    messages: [],
    participants: ["ceo", "alice", "bob"],
    proposals: [],
    actionItems: [],
    phases: ["present", "discuss", "decide", "assign"],
    capabilities: [],
    ...overrides,
  };
}

describe("MeetingRoom", () => {
  it("renders meeting title", () => {
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getByText("Sprint Review")).toBeInTheDocument();
  });

  it("shows budget remaining", () => {
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getByText("5,000 tokens")).toBeInTheDocument();
  });

  it("shows waiting message when no messages", () => {
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getByText("Waiting for messages...")).toBeInTheDocument();
  });

  it("renders chat messages", () => {
    const meeting = makeMeeting({
      messages: [
        { id: "msg1", agentId: "alice", content: "Hello everyone!", phase: "discuss", tokenCount: 10, timestamp: new Date() },
        { id: "msg2", agentId: "bob", content: "Good to be here.", phase: "discuss", tokenCount: 8, timestamp: new Date() },
      ],
    });
    render(<MeetingRoom meeting={meeting} onAdvance={vi.fn()} onSpeak={vi.fn()} />);

    expect(screen.getByText("Hello everyone!")).toBeInTheDocument();
    expect(screen.getByText("Good to be here.")).toBeInTheDocument();
  });

  it("shows Advance Phase button when active", () => {
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getByText("Advance Phase")).toBeInTheDocument();
  });

  it("hides Advance Phase button when completed", () => {
    render(<MeetingRoom meeting={makeMeeting({ status: "completed" })} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.queryByText("Advance Phase")).not.toBeInTheDocument();
  });

  it("shows Cancel button when onCancel provided", () => {
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("shows chat input when active", () => {
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getByPlaceholderText("Speak in meeting...")).toBeInTheDocument();
  });

  it("hides chat input when completed", () => {
    render(<MeetingRoom meeting={makeMeeting({ status: "completed" })} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.queryByPlaceholderText("Speak in meeting...")).not.toBeInTheDocument();
  });

  it("calls onSpeak when sending a message", async () => {
    const onSpeak = vi.fn();
    const user = userEvent.setup();
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={onSpeak} />);

    await user.type(screen.getByPlaceholderText("Speak in meeting..."), "My contribution");
    await user.click(screen.getByText("Send"));

    expect(onSpeak).toHaveBeenCalledWith("My contribution");
  });

  it("calls onAdvance when clicking Advance Phase", async () => {
    const onAdvance = vi.fn();
    const user = userEvent.setup();
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={onAdvance} onSpeak={vi.fn()} />);

    await user.click(screen.getByText("Advance Phase"));
    expect(onAdvance).toHaveBeenCalledOnce();
  });

  it("shows Meeting Completed banner when completed", () => {
    render(<MeetingRoom meeting={makeMeeting({ status: "completed" })} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getByText("Meeting Completed")).toBeInTheDocument();
  });

  it("shows summary when meeting is completed with summary", () => {
    const meeting = makeMeeting({
      status: "completed",
      summary: "Key decisions: migrate to PostgreSQL. Action items: alice to update schema.",
    });
    render(<MeetingRoom meeting={meeting} onAdvance={vi.fn()} onSpeak={vi.fn()} />);

    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText(/Key decisions: migrate to PostgreSQL/)).toBeInTheDocument();
  });

  it("does not show summary section when no summary", () => {
    render(<MeetingRoom meeting={makeMeeting({ status: "completed" })} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.queryByText("Summary")).not.toBeInTheDocument();
  });

  it("shows agenda when provided", () => {
    render(<MeetingRoom meeting={makeMeeting({ agenda: "Discuss Q2 targets" })} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    expect(screen.getByText("Discuss Q2 targets")).toBeInTheDocument();
  });

  it("shows phase description when active", () => {
    render(
      <MeetingRoom
        meeting={makeMeeting({ phaseDescription: "Share your updates with the team" })}
        onAdvance={vi.fn()}
        onSpeak={vi.fn()}
      />,
    );
    expect(screen.getByText("Share your updates with the team")).toBeInTheDocument();
  });

  it("shows proposal input when capabilities include proposals", () => {
    const meeting = makeMeeting({ capabilities: ["proposals"] });
    render(<MeetingRoom meeting={meeting} onAdvance={vi.fn()} onSpeak={vi.fn()} onPropose={vi.fn()} />);
    expect(screen.getByPlaceholderText("Submit a proposal...")).toBeInTheDocument();
  });

  it("shows assignment form when capabilities include assignments", () => {
    const meeting = makeMeeting({ capabilities: ["assignments"] });
    render(<MeetingRoom meeting={meeting} onAdvance={vi.fn()} onSpeak={vi.fn()} onAssign={vi.fn()} />);
    expect(screen.getByPlaceholderText("Task description...")).toBeInTheDocument();
    expect(screen.getByText("Assign to...")).toBeInTheDocument();
  });

  it("disables Send button when input is empty", () => {
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} />);
    const sendBtn = screen.getByText("Send");
    expect(sendBtn).toBeDisabled();
  });

  it("clears input after sending", async () => {
    const user = userEvent.setup();
    render(<MeetingRoom meeting={makeMeeting()} onAdvance={vi.fn()} onSpeak={vi.fn()} />);

    const input = screen.getByPlaceholderText("Speak in meeting...");
    await user.type(input, "Hello");
    await user.click(screen.getByText("Send"));

    expect(input).toHaveValue("");
  });
});
