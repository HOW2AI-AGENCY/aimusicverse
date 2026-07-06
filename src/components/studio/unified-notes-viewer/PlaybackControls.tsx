import { memo } from "react";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/lib/formatters";
import { Pause, Play, VolumeX, Volume2 } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  volume: number;
  isMobile: boolean;
  onTogglePlayback: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
}

export const PlaybackControls = memo(function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  isMuted,
  volume,
  isMobile,
  onTogglePlayback,
  onSeek,
  onToggleMute,
  onVolumeChange,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        variant={isPlaying ? "secondary" : "default"}
        onClick={onTogglePlayback}
        className="h-8 w-8 rounded-full shrink-0"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </Button>

      {/* Progress */}
      <div
        className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          onSeek(percent * duration);
        }}
      >
        <motion.div className="h-full bg-primary" style={{ width: `${(currentTime / duration) * 100}%` }} />
      </div>

      <span className="text-[10px] text-muted-foreground w-16 text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Volume - desktop only */}
      {!isMobile && (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onToggleMute}>
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>
          <Slider
            value={[volume]}
            onValueChange={([v]) => onVolumeChange(v)}
            min={-40}
            max={0}
            step={1}
            disabled={isMuted}
            className="w-16"
          />
        </div>
      )}
    </div>
  );
});
