import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhaseIndicator } from "../src/components/PhaseIndicator";

describe("PhaseIndicator", () => {
  it("renders default phases when none provided", () => {
    render(<PhaseIndicator phase="present" status="active" />);

    expect(screen.getByText("PRESENT")).toBeInTheDocument();
    expect(screen.getByText("DISCUSS")).toBeInTheDocument();
    expect(screen.getByText("DECIDE")).toBeInTheDocument();
    expect(screen.getByText("ASSIGN")).toBeInTheDocument();
  });

  it("renders custom phases from methodology", () => {
    const phases = ["brainstorm", "evaluate", "finalize"];
    render(<PhaseIndicator phase="brainstorm" status="active" phases={phases} />);

    expect(screen.getByText("BRAINSTORM")).toBeInTheDocument();
    expect(screen.getByText("EVALUATE")).toBeInTheDocument();
    expect(screen.getByText("FINALIZE")).toBeInTheDocument();
    expect(screen.queryByText("PRESENT")).not.toBeInTheDocument();
  });

  it("highlights active phase with blue styling", () => {
    render(<PhaseIndicator phase="discuss" status="active" />);

    const activePhase = screen.getByText("DISCUSS");
    expect(activePhase.className).toContain("text-blue-400");
  });

  it("shows past phases with emerald styling", () => {
    render(<PhaseIndicator phase="discuss" status="active" />);

    const pastPhase = screen.getByText("PRESENT");
    expect(pastPhase.className).toContain("text-emerald-400");
  });

  it("shows future phases with zinc styling", () => {
    render(<PhaseIndicator phase="present" status="active" />);

    const futurePhase = screen.getByText("DECIDE");
    expect(futurePhase.className).toContain("text-zinc-500");
  });

  it("shows COMPLETED label when meeting is completed", () => {
    render(<PhaseIndicator phase="assign" status="completed" />);
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
  });

  it("all phases are emerald when completed", () => {
    render(<PhaseIndicator phase="assign" status="completed" />);

    expect(screen.getByText("PRESENT").className).toContain("text-emerald-400");
    expect(screen.getByText("DISCUSS").className).toContain("text-emerald-400");
  });

  it("does not show COMPLETED label when active", () => {
    render(<PhaseIndicator phase="discuss" status="active" />);
    expect(screen.queryByText("COMPLETED")).not.toBeInTheDocument();
  });
});
