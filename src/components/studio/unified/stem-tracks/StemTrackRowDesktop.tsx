import { memo } from "react";
import { motion } from "@/lib/motion";
import { Music2, Download, Sparkles, Guitar, FileMusic, Eye, Trash2 } from "@/lib/icons";
import type { TrackStem } from "@/hooks/useTrackStems";
import type { StemTranscription } from "@/hooks/useStemTranscription";
import { UnifiedWaveform } from "@/components/waveform/UnifiedWaveform";
import type { StemType } from "@/components/waveform/UnifiedWaveform";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { stemConfig, type StemState } from "../stemTrackConfig";

interface StemTrackRowDesktopProps {
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

export const StemTrackRowDesktop = memo(function StemTrackRowDesktop({
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
}: StemTrackRowDesktopProps) {
  const config = stemConfig[stem.stem_type.toLowerCase()] || stemConfig.other;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 group",
        "border-b border-border/20 last:border-0",
        "hover:bg-muted/20 transition-colors",
        state.muted && "opacity-40",
      )}
    >
      {/* Track label */}
      <div className="flex items-center gap-2 w-32 shrink-0">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", config.accent)}>
          <Icon className="w-3 h-3" />
        </div>
        <span className="text-[0.6875rem] font-mono font-semibold tracking-wider">{config.shortLabel}</span>
        {/* Transcription indicators */}
        {transcription &&
          (transcription.midi_url || transcription.pdf_url || transcription.gp5_url || transcription.mxml_url) && (
            <div className="flex items-center gap-0.5">
              {transcription.midi_url && (
                <Badge
                  variant="outline"
                  className="h-4 px-1 text-[0.5rem] bg-primary/10 border-primary/30 text-primary cursor-pointer hover:bg-primary/20"
                  onClick={() => onAction("view-notes")}
                >
                  <Music2 className="w-2.5 h-2.5" />
                </Badge>
              )}
              {transcription.gp5_url && (
                <Badge
                  variant="outline"
                  className="h-4 px-1 text-[0.5rem] bg-amber-500/10 border-amber-500/30 text-amber-500 cursor-pointer hover:bg-amber-500/20"
                  onClick={() => onAction("view-notes")}
                  title="Табулатура (Guitar Pro)"
                >
                  <Guitar className="w-2.5 h-2.5" />
                </Badge>
              )}
              {(transcription.pdf_url || transcription.mxml_url) &&
                !transcription.gp5_url &&
                !transcription.midi_url && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[0.5rem] bg-emerald-500/10 border-emerald-500/30 text-emerald-500 cursor-pointer hover:bg-emerald-500/20"
                    onClick={() => onAction("view-notes")}
                    title="Ноты (PDF/MusicXML)"
                  >
                    <FileMusic className="w-2.5 h-2.5" />
                  </Badge>
                )}
            </div>
          )}
      </div>

      {/* M/S buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle("mute")}
          className={cn(
            "h-5 w-5 p-0 rounded text-[0.5625rem] font-bold transition-all",
            state.muted ? "bg-destructive text-destructive-foreground" : "hover:bg-muted",
          )}
        >
          M
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle("solo")}
          className={cn(
            "h-5 w-5 p-0 rounded text-[0.5625rem] font-bold transition-all",
            state.solo ? "bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          S
        </Button>
      </div>

      {/* Volume */}
      <div className="w-16 shrink-0">
        <Slider
          value={[state.volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(v) => onVolumeChange(v[0])}
          className="w-full"
        />
      </div>

      {/* Waveform */}
      <div className="flex-1 h-8 min-w-0 relative bg-background/30">
        <UnifiedWaveform
          audioUrl={stem.audio_url}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          isMuted={state.muted}
          stemType={stem.stem_type.toLowerCase() as StemType}
          mode="compact"
          height={32}
          onSeek={onSeek}
        />
        {/* Playhead cursor */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-10"
            style={{
              left: `${(currentTime / duration) * 100}%`,
              boxShadow: "0 0 4px hsl(var(--primary))",
            }}
          />
        )}
      </div>

      {/* Notes Preview */}
      {transcription &&
        (transcription.notes ||
          transcription.pdf_url ||
          transcription.midi_url ||
          transcription.gp5_url ||
          transcription.mxml_url) && (
          <div className="w-36 shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
            <Music2 className="w-3 h-3" />
            <span>{transcription.notes_count || 0} нот</span>
            <Button variant="ghost" size="sm" className="h-5 px-2" onClick={() => onAction("view-notes")}>
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        )}

      {/* Quick actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction("reference")}
          className="h-6 w-6 p-0"
          title="Использовать как референс"
        >
          <Sparkles className="w-3 h-3" />
        </Button>
        {(stem.stem_type === "vocal" || stem.stem_type === "vocals") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction("arrangement")}
            className="h-6 w-6 p-0 text-amber-500 hover:text-amber-400"
            title="Новая аранжировка"
          >
            <Guitar className="w-3 h-3" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onAction("download")} className="h-6 w-6 p-0" title="Скачать">
          <Download className="w-3 h-3" />
        </Button>
        {stem.source && stem.source !== "separated" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction("delete")}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Удалить стем"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
});
