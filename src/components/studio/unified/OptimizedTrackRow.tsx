/**
 * OptimizedTrackRow - Dense, cover-led track lane card
 *
 * Redesign: cover swatch on the left, single-row dense header,
 * inline status chip, M/S/Vol controls right-aligned, waveform below.
 */

import { memo, useCallback, useState } from "react";
import {
  Volume2,
  VolumeX,
  MoreHorizontal,
  Music,
  Mic2,
  Guitar,
  Drum,
  Waves,
  Sliders,
  GripVertical,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import { UnifiedWaveform, type StemType } from "@/components/waveform/UnifiedWaveform";

const TRACK_CONFIG = {
  main: {
    icon: Music,
    shortLabel: "MAIN",
    cover: "from-primary to-primary/60",
    accent: "text-primary bg-primary/15 border-primary/30",
  },
  vocal: {
    icon: Mic2,
    shortLabel: "VOX",
    cover: "from-blue-500 to-blue-700",
    accent: "text-blue-300 bg-blue-500/15 border-blue-500/30",
  },
  instrumental: {
    icon: Guitar,
    shortLabel: "INS",
    cover: "from-emerald-500 to-emerald-700",
    accent: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
  },
  drums: {
    icon: Drum,
    shortLabel: "DRM",
    cover: "from-orange-500 to-red-600",
    accent: "text-orange-300 bg-orange-500/15 border-orange-500/30",
  },
  bass: {
    icon: Waves,
    shortLabel: "BAS",
    cover: "from-purple-500 to-fuchsia-700",
    accent: "text-purple-300 bg-purple-500/15 border-purple-500/30",
  },
  stem: {
    icon: Sliders,
    shortLabel: "STM",
    cover: "from-cyan-500 to-sky-700",
    accent: "text-cyan-300 bg-cyan-500/15 border-cyan-500/30",
  },
  other: {
    icon: Music,
    shortLabel: "OTH",
    cover: "from-zinc-500 to-zinc-700",
    accent: "text-zinc-300 bg-zinc-500/15 border-zinc-500/30",
  },
} as const;

type TrackType = keyof typeof TRACK_CONFIG;
export type TrackRowStatus = "ready" | "pending" | "processing" | "failed";

const STATUS_META: Record<TrackRowStatus, { label: string; icon: typeof Loader2; className: string }> = {
  ready: {
    label: "Готово",
    icon: CheckCircle2,
    className: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  },
  pending: { label: "В очереди", icon: Clock, className: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  processing: {
    label: "Генерация",
    icon: Loader2,
    className: "text-sky-300 bg-sky-500/10 border-sky-500/30",
  },
  failed: { label: "Ошибка", icon: AlertCircle, className: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
};

export interface OptimizedTrackRowProps {
  id: string;
  name: string;
  type: TrackType;
  audioUrl?: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasSoloTracks?: boolean;
  status?: TrackRowStatus;
  coverUrl?: string;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onSeek: (time: number) => void;
  onOpenMenu?: (id: string) => void;
}

const ControlButton = memo(function ControlButton({
  label,
  active,
  tone,
  onClick,
}: {
  label: string;
  active: boolean;
  tone: "destructive" | "primary";
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-7 w-7 p-0 rounded-md font-mono text-[0.625rem] font-bold touch-manipulation transition-colors",
        active && tone === "destructive" && "bg-destructive text-destructive-foreground",
        active && tone === "primary" && "bg-primary text-primary-foreground",
        !active && "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {label}
    </Button>
  );
});

export const OptimizedTrackRow = memo(function OptimizedTrackRow({
  id,
  name,
  type,
  audioUrl,
  volume,
  muted,
  solo,
  isPlaying,
  currentTime,
  duration,
  hasSoloTracks = false,
  status = "ready",
  coverUrl,
  onToggleMute,
  onToggleSolo,
  onVolumeChange,
  onSeek,
  onOpenMenu,
}: OptimizedTrackRowProps) {
  const [showVolume, setShowVolume] = useState(false);

  const config = TRACK_CONFIG[type] || TRACK_CONFIG.other;
  const Icon = config.icon;
  const statusMeta = STATUS_META[status];
  const StatusIcon = statusMeta.icon;

  const effectiveMuted = muted || (hasSoloTracks && !solo);
  const isBusy = status === "pending" || status === "processing";

  const handleToggleMute = useCallback(() => onToggleMute(id), [id, onToggleMute]);
  const handleToggleSolo = useCallback(() => onToggleSolo(id), [id, onToggleSolo]);
  const handleVolumeChange = useCallback((v: number) => onVolumeChange(id, v), [id, onVolumeChange]);
  const handleOpenMenu = useCallback(() => onOpenMenu?.(id), [id, onOpenMenu]);
  const handleToggleVolume = useCallback(() => setShowVolume((v) => !v), []);

  return (
    <div className={cn("relative", effectiveMuted && "opacity-60")}>
      <div
        className={cn(
          "flex flex-col rounded-xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur",
          "transition-shadow hover:shadow-md",
          status === "failed" && "border-rose-500/40",
        )}
      >
        {/* Dense header row: grip · cover · name+status · controls */}
        <div className="flex items-center gap-2 px-2 py-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab shrink-0" />

          {/* Cover swatch */}
          <div
            className={cn(
              "relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-gradient-to-br",
              config.cover,
              "flex items-center justify-center",
            )}
          >
            {coverUrl ? (
              <LazyImage src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-4 w-4 text-white/90" />
            )}
            <span className="absolute bottom-0 left-0 right-0 text-center text-[0.5rem] font-mono font-bold text-white/90 bg-black/30 leading-tight py-px">
              {config.shortLabel}
            </span>
          </div>

          {/* Name + status */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold truncate">{name}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 h-4 rounded text-[0.5625rem] font-medium border",
                  statusMeta.className,
                )}
              >
                <StatusIcon className={cn("h-2.5 w-2.5", isBusy && "animate-spin")} />
                {statusMeta.label}
              </span>
              <span className={cn("text-[0.625rem] px-1 rounded border", config.accent)}>{config.shortLabel}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <ControlButton label="M" active={muted} tone="destructive" onClick={handleToggleMute} />
            <ControlButton label="S" active={solo} tone="primary" onClick={handleToggleSolo} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleVolume}
              className={cn("h-7 px-2 rounded-md text-[0.625rem] font-mono touch-manipulation", showVolume && "bg-muted")}
            >
              {Math.round(volume * 100)}
            </Button>
            {onOpenMenu && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-md touch-manipulation"
                onClick={handleOpenMenu}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Inline volume slider */}
        {showVolume && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleToggleMute}>
                {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </Button>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => handleVolumeChange(v[0])}
                className="flex-1"
                disabled={muted}
              />
              <span className="text-[0.625rem] font-mono text-muted-foreground w-7 text-right">
                {Math.round(volume * 100)}
              </span>
            </div>
          </div>
        )}

        {/* Waveform */}
        <div className="h-12 relative bg-muted/20">
          {audioUrl ? (
            <>
              <UnifiedWaveform
                audioUrl={audioUrl}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                isMuted={muted}
                stemType={type as StemType}
                mode="stem"
                height={48}
                onSeek={onSeek}
              />
              {duration > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none z-10"
                  style={{
                    left: `${(currentTime / duration) * 100}%`,
                    boxShadow: "0 0 6px var(--primary)",
                  }}
                />
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center gap-2">
              {isBusy ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{statusMeta.label}…</span>
                </>
              ) : status === "failed" ? (
                <span className="text-xs text-rose-300">Не удалось сгенерировать</span>
              ) : (
                <span className="text-xs text-muted-foreground">Нет аудио</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
