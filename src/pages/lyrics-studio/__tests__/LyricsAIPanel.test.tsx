/**
 * Unit tests for LyricsAIPanel sub-component.
 *
 * Verifies the desktop/mobile variants and FAB placement.
 * Mocks the heavy LyricsAIChatAgent / MobileAIAgentPanel children to keep
 * the test focused on LyricsAIPanel's own contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/components/lyrics-workspace/LyricsAIChatAgent", () => ({
  LyricsAIChatAgent: (props: Record<string, unknown>) => (
    <div data-testid="lyrics-ai-chat-agent" data-props={JSON.stringify(props)} />
  ),
}));

vi.mock("@/components/lyrics-workspace/ai-agent/MobileAIAgentPanel", () => ({
  MobileAIAgentPanel: (props: Record<string, unknown>) => (
    <div data-testid="mobile-ai-agent-panel" data-props={JSON.stringify(props)} />
  ),
}));

import { LyricsAIPanel } from "@/pages/lyrics-studio/LyricsAIPanel";

const baseProps = {
  open: true,
  isMobile: false,
  isSaving: false,
  isProjectTrackMode: false,
  existingLyrics: "Verse 1\nTest lyrics",
  selectedSectionForAgent: null,
  globalTags: ["tag1"],
  allSectionNotesForAgent: [],
  projectData: null,
  projectTrack: null,
  title: "Test",
  tracklist: [],
  onClose: vi.fn(),
  onInsertLyrics: vi.fn(),
  onReplaceLyrics: vi.fn(),
  onAddTags: vi.fn(),
  onOpen: vi.fn(),
  onHaptic: vi.fn(),
};

describe("LyricsAIPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders LyricsAIChatAgent on desktop when open", () => {
    render(<LyricsAIPanel {...baseProps} />);
    expect(screen.getByTestId("lyrics-ai-chat-agent")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-ai-agent-panel")).toBeNull();
  });

  it("renders MobileAIAgentPanel on mobile when open", () => {
    render(<LyricsAIPanel {...baseProps} isMobile={true} />);
    expect(screen.getByTestId("mobile-ai-agent-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("lyrics-ai-chat-agent")).toBeNull();
  });

  it("renders nothing when closed and no onOpen provided", () => {
    // @ts-expect-error — strip onOpen for this test
    const { onOpen, ...props } = baseProps;
    render(<LyricsAIPanel {...props} open={false} />);
    expect(screen.queryByTestId("lyrics-ai-chat-agent")).toBeNull();
    expect(screen.queryByTestId("mobile-ai-agent-panel")).toBeNull();
  });

  it("renders mobile FAB on mobile when closed", () => {
    render(<LyricsAIPanel {...baseProps} isMobile={true} open={false} onOpen={vi.fn()} onHaptic={vi.fn()} />);
    // The FAB is a button with Sparkles icon. Find by class.
    const buttons = screen.getAllByRole("button");
    const fab = buttons.find((b) => b.className.includes("rounded-full"));
    expect(fab).toBeDefined();
  });

  it("does NOT render mobile FAB on desktop", () => {
    render(<LyricsAIPanel {...baseProps} open={false} onOpen={vi.fn()} />);
    // The desktop FAB lives in LyricsEditor, not LyricsAIPanel.
    const buttons = screen.queryAllByRole("button");
    const fab = buttons.find((b) => b.className.includes("rounded-full"));
    expect(fab).toBeUndefined();
  });

  it("calls onClose when close button clicked on desktop", () => {
    const onClose = vi.fn();
    render(<LyricsAIPanel {...baseProps} onClose={onClose} />);
    // The close button has X icon
    const closeButtons = screen.getAllByRole("button");
    const closeBtn = closeButtons.find((b) => b.className.includes("h-8"));
    expect(closeBtn).toBeDefined();
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it("passes projectContext to LyricsAIChatAgent when projectData set", () => {
    render(
      <LyricsAIPanel
        {...baseProps}
        isProjectTrackMode={true}
        projectData={{
          id: "p-1",
          title: "Project",
          genre: "Rock",
          mood: "Happy",
          concept: "Fun",
          target_audience: null,
          reference_artists: null,
          language: "en",
          project_type: "album",
          cover_url: null,
        }}
      />,
    );
    const agent = screen.getByTestId("lyrics-ai-chat-agent");
    const props = JSON.parse(agent.getAttribute("data-props") || "{}");
    expect(props.projectContext.projectId).toBe("p-1");
    expect(props.projectContext.genre).toBe("Rock");
  });

  it("omits projectContext when projectData is null", () => {
    render(<LyricsAIPanel {...baseProps} />);
    const agent = screen.getByTestId("lyrics-ai-chat-agent");
    const props = JSON.parse(agent.getAttribute("data-props") || "{}");
    expect(props.projectContext).toBeUndefined();
  });
});
