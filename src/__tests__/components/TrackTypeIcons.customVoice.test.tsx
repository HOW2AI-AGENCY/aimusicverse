/**
 * Regression: tracks generated with a cloned custom voice must render the
 * custom-voice marker icon in TrackTypeIcons.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrackTypeIcons } from "@/components/library/TrackTypeIcons";
import { shouldShowVoiceDisclaimer, markVoiceDisclaimerShown } from "@/components/voice-clone/VoiceCloneDisclaimerDialog";

const baseTrack = {
  id: "t1",
  has_vocals: true,
  has_stems: false,
} as never;

describe("TrackTypeIcons — custom voice marker", () => {
  it("shows the marker when custom_voice_id is set", () => {
    render(<TrackTypeIcons track={{ ...(baseTrack as object), custom_voice_id: "voice_123" } as never} />);
    expect(screen.getByTestId("custom-voice-icon")).toBeInTheDocument();
  });

  it("hides the marker without custom_voice_id", () => {
    render(<TrackTypeIcons track={{ ...(baseTrack as object), custom_voice_id: null } as never} />);
    expect(screen.queryByTestId("custom-voice-icon")).not.toBeInTheDocument();
  });
});

describe("voice clone disclaimer throttling", () => {
  it("shows once, then stays hidden until the interval passes", () => {
    localStorage.removeItem("mv:voice-clone-disclaimer-shown-at");
    const now = Date.now();
    expect(shouldShowVoiceDisclaimer(now)).toBe(true);
    markVoiceDisclaimerShown(now);
    expect(shouldShowVoiceDisclaimer(now + 1000)).toBe(false);
    expect(shouldShowVoiceDisclaimer(now + 8 * 24 * 60 * 60 * 1000)).toBe(true);
  });
});
