import { memo, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Volume2,
  VolumeX,
  MoreHorizontal,
  Music2,
  Download,
  Sparkles,
  Sliders,
  Wand2,
  FileMusic,
  Loader2,
  Trash2,
  Guitar,
} from "@/lib/icons";
import type { TrackStem } from "@/hooks/useTrackStems";
import type { StemTranscription } from "@/hooks/useStemTranscription";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { UnifiedWaveform } from "@/components/waveform/UnifiedWaveform";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { stemConfig, type StemState } from "../stemTrackConfig";

interface StemTrackRowMobileProps {
  stem: TrackStem;
  state: StemState;
  transcription?: StemTranscription | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onToggle: (type: "mute" | "solo") => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onAction: (action: "midi" | "reference" | "download" | "effects" | "view-notes" | "delete" | "arrangement") => void;
}

export const StemTrackRowMobile = memo(function StemTrackRowMobile({
  stem,
  state,
  transcription,
  isPlaying,
  currentTime,
  duration,
  onToggle,
  onVolumeChange,
  onSeek,
  onAction,
}: StemTrackRowMobileProps) {
  const [showVolume, setShowVolume] = useState(false);
  const haptic = useHapticFeedback();
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;

  const handleToggle = (type: "mute" | "solo") => {
    haptic.select();
    onToggle(type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn("relative group", state.muted && "opacity-40")}
    >
      {/* Track lane */}
      <div
        className={cn(
          "flex flex-col rounded-xl overflow-hidden",
          "bg-gradient-to-r",
          config.gradient,
          "border border-border/30",
        )}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Stem icon + label */}
          <div className={cn("flex items-center gap-2 min-w-0 flex-1")}>
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", config.accent)}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-mono font-semibold tracking-wider truncate">{config.shortLabel}</span>
            {/* Transcription indicators */}
            {transcription &&
              (transcription.midi_url || transcription.pdf_url || transcription.gp5_url || transcription.mxml_url) && (
                <div className="flex items-center gap-0.5">
                  {transcription.midi_url && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[8px] bg-primary/10 border-primary/30 text-primary"
                    >
                      <Music2 className="w-2.5 h-2.5 mr-0.5" />
                      MIDI
                    </Badge>
                  )}
                  {transcription.gp5_url && (
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[8px] bg-amber-500/10 border-amber-500/30 text-amber-500"
                    >
                      <Guitar className="w-2.5 h-2.5 mr-0.5" />
                      TAB
                    </Badge>
                  )}
                  {(transcription.pdf_url || transcription.mxml_url) &&
                    !transcription.gp5_url &&
                    !transcription.midi_url && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[8px] bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      >
                        <FileMusic className="w-2.5 h-2.5 mr-0.5" />
                        NOTES
                      </Badge>
                    )}
                </div>
              )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Mute - M button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle("mute")}
              className={cn(
                "h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg font-mono text-xs md:text-[10px] font-bold transition-all touch-manipulation",
                state.muted
                  ? "bg-destructive text-destructive-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              M
            </Button>

            {/* Solo - S button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggle("solo")}
              className={cn(
                "h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg font-mono text-xs md:text-[10px] font-bold transition-all touch-manipulation",
                state.solo
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              S
            </Button>

            {/* Volume toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVolume(!showVolume)}
              className={cn(
                "h-9 md:h-7 px-2 rounded-lg text-xs md:text-[10px] font-mono touch-manipulation",
                showVolume ? "bg-muted" : "",
              )}
            >
              {Math.round(state.volume * 100)}
            </Button>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 md:h-7 md:w-7 p-0 rounded-lg touch-manipulation">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onAction("reference")}>
                  <Sparkles className="w-4 h-4 mr-2 text-primary" />
                  Как референс
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("midi")}>
                  <Music2 className="w-4 h-4 mr-2" />
                  MIDI
                </DropdownMenuItem>
                {(stem.stem_type === "vocal" || stem.stem_type === "vocals") && (
                  <DropdownMenuItem onClick={() => onAction("arrangement")}>
                    <Guitar className="w-4 h-4 mr-2 text-amber-500" />
                    Новая аранжировка
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onAction("effects")}>
                  <Sliders className="w-4 h-4 mr-2" />
                  Эффекты
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAction("download")}>
                  <Download className="w-4 h-4 mr-2" />
                  Скачать
                </DropdownMenuItem>
                {stem.source && stem.source !== "separated" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onAction("delete")}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить стем
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Volume slider (expandable) */}
        <AnimatePresence>
          {showVolume && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-3 pb-2 overflow-hidden"
            >
              <Slider
                value={[state.volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => onVolumeChange(v[0])}
                className="w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform */}
        <div className="h-14 relative">
          <UnifiedWaveform
            url={stem.audio_url}
            stemType={stem.stem_type as StemType}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            height={56}
            onSeek={onSeek}
            compact
          />
        </div>
      </div>
    </motion.div>
  );
});
