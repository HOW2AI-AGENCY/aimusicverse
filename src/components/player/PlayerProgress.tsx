/**
 * PlayerProgress - Bottom controls section of the fullscreen player.
 * Contains waveform timeline, transport controls, and action buttons.
 */

import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { WaveformProgressBar } from "./WaveformProgressBar";
import { UnifiedPlayerControls } from "./UnifiedPlayerControls";
import { PlayerActionsBar } from "./PlayerActionsBar";
import { Track } from "@/types/track";

interface PlayerProgressProps {
  track: Track;
  audioUrl: string | null | undefined;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function PlayerProgress({ track, audioUrl, currentTime, duration, onSeek }: PlayerProgressProps) {
  return (
    <motion.div
      className={cn(
        "relative p-4 space-y-4 border-t border-border/40",
        "bg-gradient-to-b from-background/40 to-background/95 backdrop-blur-2xl",
      )}
      style={{
        paddingBottom:
          "calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))",
      }}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      {/* Subtle aurora glow strip at the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      {/* Waveform Timeline */}
      <div data-testid="player-timeline">
        <WaveformProgressBar
          audioUrl={audioUrl}
          trackId={track.id}
          currentTime={currentTime}
          duration={duration}
          onSeek={(time) => onSeek(time)}
          mode="standard"
          showBeatGrid={true}
          showLabels={true}
          className="px-2"
        />
      </div>

      {/* Main Controls - UnifiedPlayerControls */}
      <div data-testid="player-transport">
        <UnifiedPlayerControls
          variant="fullscreen"
          size="lg"
          showVolume={false}
          showShuffleRepeat={true}
          showSeekButtons={true}
          seekSeconds={10}
        />
      </div>

      {/* Secondary Actions - PlayerActionsBar */}
      <PlayerActionsBar track={track} variant="horizontal" size="md" showStudioButton={true} />
    </motion.div>
  );
}
