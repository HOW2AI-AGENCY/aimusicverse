import { memo } from "react";
import { PlayerProgress } from "./PlayerProgress";
import type { WaveformMode } from "@/components/waveform";

interface WaveformProgressBarProps {
  audioUrl?: string | null;
  trackId?: string | null;
  waveformData?: number[] | null;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  buffered?: number;
  className?: string;
  mode?: WaveformMode;
  showLabels?: boolean;
  showBeatGrid?: boolean;
}

export const WaveformProgressBar = memo(function WaveformProgressBar({
  audioUrl,
  trackId,
  waveformData,
  currentTime,
  duration,
  onSeek,
  buffered = 0,
  className,
  mode = "standard",
  showLabels = true,
  showBeatGrid = false,
}: WaveformProgressBarProps) {
  return (
    <PlayerProgress
      audioUrl={audioUrl}
      trackId={trackId}
      waveformData={waveformData}
      currentTime={currentTime}
      duration={duration}
      onSeek={onSeek}
      buffered={buffered}
      className={className}
      mode={mode}
      density={mode === "minimal" ? "compact" : "default"}
      showLabels={showLabels}
      showBeatGrid={showBeatGrid}
    />
  );
});

export default WaveformProgressBar;
