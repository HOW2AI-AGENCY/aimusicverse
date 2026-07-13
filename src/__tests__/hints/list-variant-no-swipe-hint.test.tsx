/**
 * DOM regression: ListVariant must not render any swipe-hint tooltip UI.
 *
 * Renders <ListVariant/> with all heavy deps stubbed and asserts:
 *  - The card mounts without throwing
 *  - No UnifiedTipCard node ([data-testid="unified-tip-card"]) appears
 *  - No literal "свайп" hint copy is present in the rendered DOM
 *  - No role="status" polite live-region added by hint system
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// Stub heavy or side-effectful modules the variant transitively imports.
vi.mock("@/hooks/audio/usePlaybackQueue", () => ({
  usePlaybackQueue: () => ({ addTrack: vi.fn(), queue: [], removeTrack: vi.fn() }),
}));
vi.mock("@/lib/mobile-utils", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, triggerHapticFeedback: vi.fn() };
});
vi.mock("@/components/track-actions", () => ({
  UnifiedTrackMenu: () => null,
  UnifiedTrackSheet: () => null,
}));
vi.mock("@/components/library/SwipeableTrackItem", () => ({
  SwipeableTrackItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/track/track-card-new/hooks/useTrackCardState", () => ({
  useTrackCardState: () => ({
    sheetOpen: false,
    setSheetOpen: vi.fn(),
    isMobile: true,
    isCurrentlyPlaying: false,
    handlePlay: vi.fn(),
    handleCardClick: vi.fn(),
    openSheet: vi.fn(),
    isOwnTrack: true,
  }),
}));

import { ListVariant } from "@/components/track/track-card-new/variants/ListVariant";

const track = {
  id: "t1",
  title: "Test Track",
  user_id: "u1",
  audio_url: "https://example.com/x.mp3",
  cover_url: null,
  duration: 120,
  status: "completed",
  is_public: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  tags: [],
  prompt: null,
  style_prompt: null,
  lyrics: null,
  metadata: {},
} as unknown as Parameters<typeof ListVariant>[0]["track"];

describe("ListVariant — no swipe-hint tooltip in DOM (regression)", () => {
  it("renders without crashing and without any swipe-hint UI", () => {
    const { container, queryByTestId, queryAllByRole } = render(
      <ListVariant track={track} versionCount={1} stemCount={0} />,
    );

    // 1) UnifiedTipCard testid must be absent.
    expect(queryByTestId("unified-tip-card")).toBeNull();

    // 2) No role="status" hint live-region present.
    expect(queryAllByRole("status")).toHaveLength(0);

    // 3) No leftover Russian "свайп" copy from tooltip content.
    expect(container.textContent?.toLowerCase() ?? "").not.toContain("свайп");

    // 4) Sanity: card actually rendered.
    expect(container.firstChild).not.toBeNull();
  });
});
