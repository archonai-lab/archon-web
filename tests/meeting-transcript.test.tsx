import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetingTranscript } from "../src/components/MeetingTranscript";
import type { TranscriptEntry } from "../src/lib/types";

const baseData = {
  meeting: {
    id: "m1",
    title: "Architecture Review",
    status: "completed",
    methodology: "general",
    initiatorId: "ceo",
    agenda: "Review system architecture",
    decisions: [],
    actionItems: [],
    summary: null,
    createdAt: "2026-03-13T10:00:00Z",
    completedAt: "2026-03-13T11:00:00Z",
  },
  messages: [] as TranscriptEntry[],
  participants: ["ceo", "alice", "bob"],
};

describe("MeetingTranscript", () => {
  it("renders meeting title", () => {
    render(<MeetingTranscript data={baseData} onBack={vi.fn()} />);
    expect(screen.getByText("Architecture Review")).toBeInTheDocument();
  });

  it("shows meeting status badge", () => {
    render(<MeetingTranscript data={baseData} onBack={vi.fn()} />);
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("shows methodology and initiator", () => {
    render(<MeetingTranscript data={baseData} onBack={vi.fn()} />);
    expect(screen.getByText("general")).toBeInTheDocument();
    expect(screen.getByText("Initiated by ceo")).toBeInTheDocument();
  });

  it("shows participant count", () => {
    render(<MeetingTranscript data={baseData} onBack={vi.fn()} />);
    expect(screen.getByText("3 participants")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(<MeetingTranscript data={baseData} onBack={vi.fn()} />);
    expect(screen.getByText("No messages in this meeting.")).toBeInTheDocument();
  });

  it("renders messages grouped by phase", () => {
    const data = {
      ...baseData,
      messages: [
        { id: 1, agentId: "alice", displayName: "Alice", phase: "present", content: "Here's my update.", tokenCount: 10, relevance: null, createdAt: "2026-03-13T10:05:00Z" },
        { id: 2, agentId: "bob", displayName: "Bob", phase: "present", content: "My update too.", tokenCount: 8, relevance: null, createdAt: "2026-03-13T10:06:00Z" },
        { id: 3, agentId: "alice", displayName: "Alice", phase: "discuss", content: "Let me elaborate.", tokenCount: 12, relevance: null, createdAt: "2026-03-13T10:10:00Z" },
      ],
    };
    render(<MeetingTranscript data={data} onBack={vi.fn()} />);

    expect(screen.getByText("present")).toBeInTheDocument();
    expect(screen.getByText("discuss")).toBeInTheDocument();
    expect(screen.getByText("Here's my update.")).toBeInTheDocument();
    expect(screen.getByText("My update too.")).toBeInTheDocument();
    expect(screen.getByText("Let me elaborate.")).toBeInTheDocument();
  });

  it("shows summary when present", () => {
    const data = {
      ...baseData,
      meeting: { ...baseData.meeting, summary: "The team decided to use PostgreSQL." },
    };
    render(<MeetingTranscript data={data} onBack={vi.fn()} />);
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("The team decided to use PostgreSQL.")).toBeInTheDocument();
  });

  it("does not show summary section when null", () => {
    render(<MeetingTranscript data={baseData} onBack={vi.fn()} />);
    expect(screen.queryByText("Summary")).not.toBeInTheDocument();
  });

  it("shows decisions when present", () => {
    const data = {
      ...baseData,
      meeting: {
        ...baseData.meeting,
        decisions: [{ proposal: "Adopt microservices architecture" }],
      },
    };
    render(<MeetingTranscript data={data} onBack={vi.fn()} />);
    expect(screen.getByText("Decisions")).toBeInTheDocument();
    expect(screen.getByText("Adopt microservices architecture")).toBeInTheDocument();
  });

  it("shows action items when present", () => {
    const data = {
      ...baseData,
      meeting: {
        ...baseData.meeting,
        actionItems: [{ task: "Write migration script", assigneeId: "alice", deadline: "2026-03-20" }],
      },
    };
    render(<MeetingTranscript data={data} onBack={vi.fn()} />);
    expect(screen.getByText("Action Items")).toBeInTheDocument();
    expect(screen.getByText("Write migration script")).toBeInTheDocument();
    expect(screen.getByText("Assigned to alice")).toBeInTheDocument();
    expect(screen.getByText("Due: 2026-03-20")).toBeInTheDocument();
  });

  it("shows agenda when present", () => {
    render(<MeetingTranscript data={baseData} onBack={vi.fn()} />);
    expect(screen.getByText("Review system architecture")).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<MeetingTranscript data={baseData} onBack={onBack} />);

    await user.click(screen.getByText(/Back/));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("shows cancelled status with red badge", () => {
    const data = {
      ...baseData,
      meeting: { ...baseData.meeting, status: "cancelled" },
    };
    render(<MeetingTranscript data={data} onBack={vi.fn()} />);
    const badge = screen.getByText("cancelled");
    expect(badge.className).toContain("text-red-400");
  });
});
