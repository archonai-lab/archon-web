import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkflowBoard } from "../src/components/WorkflowBoard";
import type { MeetingSummary, WorkflowTask } from "../src/lib/types";

const baseTasks: WorkflowTask[] = [
  {
    id: "task-1",
    title: "Deploy staging environment",
    description: "Deploy the staging stack and verify health checks.",
    status: "failed",
    assignedTo: "rune",
    assignedBy: "ceo",
    meetingId: "meeting-1",
    repoScope: { targetRepo: "/home/leviathanst/worktrees/archon-web-workflow-observability-2026-04-09" },
    result: "Error: Health check failed",
    version: 3,
    changedBy: "rune",
    createdAt: "2026-04-09T10:00:00.000Z",
    updatedAt: "2026-04-09T11:00:00.000Z",
  },
  {
    id: "task-2",
    title: "Refactor auth middleware",
    description: null,
    status: "in_progress",
    assignedTo: "alice",
    assignedBy: "ceo",
    meetingId: null,
    repoScope: { targetRepo: "/home/leviathanst/archon-agent" },
    result: null,
    version: 1,
    changedBy: null,
    createdAt: "2026-04-09T09:00:00.000Z",
    updatedAt: "2026-04-09T09:10:00.000Z",
  },
];

const meetingHistory: MeetingSummary[] = [
  {
    id: "meeting-1",
    title: "Auth Sprint Planning",
    phase: "assign",
    methodology: "general",
    status: "completed",
    initiatorId: "ceo",
    participants: ["ceo", "rune"],
    agenda: null,
    decisions: [],
    actionItems: [],
    summary: null,
    createdAt: "2026-04-09T08:00:00.000Z",
    completedAt: "2026-04-09T08:30:00.000Z",
  },
];

describe("WorkflowBoard", () => {
  it("renders status tiles and grouped sections", () => {
    render(
      <WorkflowBoard
        tasks={baseTasks}
        total={baseTasks.length}
        meetingHistory={meetingHistory}
        onRefresh={vi.fn()}
        onOpenMeeting={vi.fn()}
      />,
    );

    expect(screen.getByText("Workflow Board")).toBeInTheDocument();
    expect(screen.getAllByText("Failed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Done").length).toBeGreaterThan(0);
  });

  it("opens a centered modal with meeting title and result content", async () => {
    const user = userEvent.setup();
    const onOpenMeeting = vi.fn();

    render(
      <WorkflowBoard
        tasks={baseTasks}
        total={baseTasks.length}
        meetingHistory={meetingHistory}
        onRefresh={vi.fn()}
        onOpenMeeting={onOpenMeeting}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Deploy staging environment/i }));

    const dialog = screen.getByRole("dialog", { name: /Deploy staging environment details/i });
    const modal = within(dialog);

    expect(modal.getByText("Project & Workflow")).toBeInTheDocument();
    expect(modal.getAllByText("Auth Sprint Planning").length).toBeGreaterThan(0);
    expect(modal.getByText("Error output")).toBeInTheDocument();
    expect(modal.getByText(/Health check failed/)).toBeInTheDocument();
    expect(modal.getByRole("button", { name: /Resize task detail panels/i })).toBeInTheDocument();

    await user.click(modal.getByRole("button", { name: /Open transcript/i }));
    expect(onOpenMeeting).toHaveBeenCalledWith("meeting-1");
  });
});
