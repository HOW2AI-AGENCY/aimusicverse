import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AIAgentActivityPanel } from "./AIAgentActivityPanel";
import type { AIAgentContext, AgentAction } from "./types";

describe("AIAgentActivityPanel", () => {
  const emptyContext: AIAgentContext = {};

  const fullContext: AIAgentContext = {
    existingLyrics: "hello world",
    projectContext: {
      projectId: "p1",
      projectTitle: "Test Project",
    },
    trackContext: {
      position: 0,
      title: "Intro",
    },
    selectedSection: {
      type: "verse",
      content: "line",
    },
  };

  const actions: AgentAction[] = [
    {
      id: "a1",
      type: "tool",
      label: "Wrote lyrics",
      status: "completed",
      timestamp: new Date("2026-07-08T10:00:00"),
    },
  ];

  it("renders nothing when there is no context, active tool, or actions", () => {
    const { container } = render(<AIAgentActivityPanel context={emptyContext} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the working file and context badges", () => {
    const { container } = render(<AIAgentActivityPanel context={fullContext} />);
    expect(container).toHaveTextContent("Test Project / #1 Intro / verse");
    expect(screen.getByText("verse")).toBeInTheDocument();
  });

  it("shows the active tool name when a tool is running", () => {
    render(<AIAgentActivityPanel context={emptyContext} activeTool="write" />);
    expect(screen.getByText("Написать")).toBeInTheDocument();
  });

  it("toggles expanded state when the header is clicked", () => {
    render(<AIAgentActivityPanel context={fullContext} actions={actions} />);
    const header = screen.getByRole("button", { expanded: true });
    expect(header).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("renders recent actions with timestamps", () => {
    render(<AIAgentActivityPanel context={fullContext} actions={actions} />);
    expect(screen.getByText("Wrote lyrics")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });
});
