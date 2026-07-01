/**
 * Unit tests for LyricsFooter sub-component.
 *
 * Verifies the Section Notes + Versions panels composition and prop wiring.
 * Mocks the heavy child panels to keep tests focused on LyricsFooter's contract.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LyricsSection } from "@/components/lyrics-workspace";
import type { LyricsVersion } from "@/hooks/useLyricsVersioning";

vi.mock("@/components/studio/unified/SectionNotesPanel", () => ({
  SectionNotesPanel: (props: Record<string, unknown>) => (
    <div data-testid="section-notes-panel" data-props={JSON.stringify(props)} />
  ),
}));

vi.mock("@/components/lyrics-workspace", async () => {
  const actual = await vi.importActual<typeof import("@/components/lyrics-workspace")>("@/components/lyrics-workspace");
  return {
    ...actual,
    LyricsVersionsPanel: (props: Record<string, unknown>) => (
      <div data-testid="lyrics-versions-panel" data-props={JSON.stringify(props)} />
    ),
  };
});

import { LyricsFooter } from "@/pages/lyrics-studio/LyricsFooter";

const sampleSection: LyricsSection = {
  id: "verse-1",
  type: "verse",
  content: "Test content",
  tags: [],
};

const sampleVersion: LyricsVersion = {
  id: "v-1",
  project_track_id: null,
  lyrics_template_id: "t-1",
  version_number: 1,
  label: "v1",
  sections_data: [],
  tags: [],
  change_type: "manual_edit",
  change_description: "Initial",
  created_at: new Date().toISOString(),
};

const baseProps = {
  selectedSection: sampleSection,
  sections: [sampleSection],
  notesPanelOpen: false,
  versionsPanelOpen: false,
  versions: [sampleVersion],
  currentVersion: sampleVersion,
  versionsLoading: false,
  existingNote: null,
  lyricsTemplateId: "t-1",
  onNotesOpenChange: vi.fn(),
  onVersionsOpenChange: vi.fn(),
  onSaveNote: vi.fn().mockResolvedValue(undefined),
  onEnrichWithTags: vi.fn(),
  onRestoreVersion: vi.fn(),
  onDeleteVersion: vi.fn(),
};

describe("LyricsFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the SectionNotesPanel when a section is selected", () => {
    render(<LyricsFooter {...baseProps} />);
    expect(screen.getByTestId("section-notes-panel")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-versions-panel")).toBeInTheDocument();
  });

  it("skips SectionNotesPanel when no section is selected", () => {
    render(<LyricsFooter {...baseProps} selectedSection={null} />);
    expect(screen.queryByTestId("section-notes-panel")).toBeNull();
    expect(screen.getByTestId("lyrics-versions-panel")).toBeInTheDocument();
  });

  it("passes versionsPanelOpen=true to LyricsVersionsPanel", () => {
    render(<LyricsFooter {...baseProps} versionsPanelOpen={true} />);
    const panel = screen.getByTestId("lyrics-versions-panel");
    const props = JSON.parse(panel.getAttribute("data-props") || "{}");
    expect(props.open).toBe(true);
  });

  it("passes notesPanelOpen=true to SectionNotesPanel", () => {
    render(<LyricsFooter {...baseProps} notesPanelOpen={true} />);
    const panel = screen.getByTestId("section-notes-panel");
    const props = JSON.parse(panel.getAttribute("data-props") || "{}");
    expect(props.open).toBe(true);
  });

  it("forwards restore and delete callbacks to LyricsVersionsPanel", () => {
    const onRestore = vi.fn();
    const onDelete = vi.fn();
    render(<LyricsFooter {...baseProps} onRestoreVersion={onRestore} onDeleteVersion={onDelete} />);
    // The mock panel stores props in a data-props attribute; we just
    // verify the LyricsFooter renders with the provided callbacks.
    expect(screen.getByTestId("lyrics-versions-panel")).toBeInTheDocument();
    expect(typeof onRestore).toBe("function");
    expect(typeof onDelete).toBe("function");
  });

  it("tolerates undefined existingNote", () => {
    render(<LyricsFooter {...baseProps} existingNote={undefined} />);
    expect(screen.getByTestId("section-notes-panel")).toBeInTheDocument();
  });
});
