/**
 * ReplacementTimelineOverlay
 *
 * Shows replacement variants on the timeline with A/B comparison
 * Allows quick preview and selection of variants
 * Integrates with studio audio coordination
 */

import { useState, useCallback, useEffect, useId } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Play, Pause, Check, X, Volume2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";
import { usePlayerStore } from "@/hooks/audio/usePlayerState";
import { pauseAllStudioAudio } from "@/hooks/studio/useStudioAudio";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";

interface ReplacementVariant {
  id: "A" | "B";
  audioUrl: string;
  label: string;
}

interface ReplacementTimelineOverlayProps {
  originalAudioUrl: string;
  variants: ReplacementVariant[];
  sectionStart: number;
  sectionEnd: number;
  duration: number;
  onApply: (variantId: "A" | "B") => void;
  onDiscard: () => void;
  className?: string;
}

export function ReplacementTimelineOverlay({
  originalAudioUrl,
  variants,
  sectionStart,
  sectionEnd,
  duration,
  onApply,
  onDiscard,
  className,
}: ReplacementTimelineOverlayProps) {
  const [activeVariant, setActiveVariant] = useState<"original" | "A" | "B">("A");
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const sourceId = useId();

  const { pauseTrack } = usePlayerStore();

  // Пул-аудио с динамическим src.
  // Регистрация в useStudioAudio координаторе уже встроена в хук.
  const { playUrl, pause, currentTime, seek } = usePreviewAudio({
    id: `replacement-overlay-${sourceId}`,
    src: previewUrl,
    priority: AudioPriority.MEDIUM,
    onEnded: () => setIsPlaying(false),
  });

  // Calculate position percentages
  const startPercent = (sectionStart / duration) * 100;
  const widthPercent = ((sectionEnd - sectionStart) / duration) * 100;

  // Pause when reaching sectionEnd (interval → useEffect).
  useEffect(() => {
    if (isPlaying && currentTime >= sectionEnd) {
      pause();
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTime, sectionEnd]);

  // Регистрация в useStudioAudio координаторе уже встроена в хук.
  // Pause when global player starts: useStudioAudio координатор дёргает наш pause.

  const getCurrentAudioUrl = useCallback(() => {
    if (activeVariant === "original") return originalAudioUrl;
    return variants.find((v) => v.id === activeVariant)?.audioUrl || originalAudioUrl;
  }, [activeVariant, variants, originalAudioUrl]);

  const togglePlay = useCallback(async () => {
    if (isPlaying) {
      pause();
      setIsPlaying(false);
      return;
    }

    // Pause global player and other studio audio
    pauseTrack();
    pauseAllStudioAudio(`replacement-overlay-${sourceId}`);

    // Меняем src на pool-элементе + перемотка к sectionStart.
    setIsPlaying(true);
    setPreviewUrl(getCurrentAudioUrl());
    await playUrl(getCurrentAudioUrl());
    seek(sectionStart);
    // Заметка: пауза на sectionEnd происходит через useEffect выше.
  }, [isPlaying, getCurrentAudioUrl, sectionStart, pauseTrack, sourceId, playUrl, seek, pause]);

  const switchVariant = (variantId: "original" | "A" | "B") => {
    pause();
    setIsPlaying(false);
    setActiveVariant(variantId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "relative bg-card/95 backdrop-blur-sm border border-primary/30 rounded-xl overflow-hidden shadow-xl",
        className,
      )}
    >
      {/* Timeline visualization */}
      <div className="relative h-12 bg-muted/30 border-b border-border/50">
        {/* Full track bar */}
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-2 bg-muted rounded-full" />

        {/* Replacement section highlight */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-6 rounded-lg"
          style={{
            left: `calc(${startPercent}% + 8px)`,
            width: `${widthPercent}%`,
          }}
          animate={{
            backgroundColor:
              activeVariant === "original" ? "hsl(var(--muted-foreground) / 0.3)" : "hsl(var(--primary) / 0.3)",
            borderColor:
              activeVariant === "original" ? "hsl(var(--muted-foreground) / 0.5)" : "hsl(var(--primary) / 0.7)",
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Section time labels */}
        <div
          className="absolute bottom-0.5 text-[9px] font-mono text-muted-foreground"
          style={{ left: `calc(${startPercent}% + 8px)` }}
        >
          {formatTime(sectionStart)}
        </div>
        <div
          className="absolute bottom-0.5 text-[9px] font-mono text-muted-foreground"
          style={{ left: `calc(${startPercent + widthPercent}% + 8px)` }}
        >
          {formatTime(sectionEnd)}
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-3">
        {/* Variant selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeVariant === "original" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => switchVariant("original")}
            className="h-8 text-xs gap-1"
          >
            Оригинал
          </Button>
          {variants.map((variant) => (
            <Button
              key={variant.id}
              variant={activeVariant === variant.id ? "default" : "outline"}
              size="sm"
              onClick={() => switchVariant(variant.id)}
              className={cn(
                "h-8 text-xs gap-1 transition-all",
                activeVariant === variant.id && "ring-2 ring-primary/30",
              )}
            >
              {variant.label}
            </Button>
          ))}
        </div>

        {/* Playback & actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={togglePlay} className="h-9 w-9 rounded-full">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Volume2 className="w-3 h-3" />
              <span>Прослушать {activeVariant === "original" ? "оригинал" : `вариант ${activeVariant}`}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onDiscard} className="h-8 text-xs gap-1">
              <X className="w-3 h-3" />
              Отменить
            </Button>
            <Button
              size="sm"
              onClick={() => onApply(activeVariant === "original" ? "A" : activeVariant)}
              disabled={activeVariant === "original"}
              className="h-8 text-xs gap-1"
            >
              <Check className="w-3 h-3" />
              Применить {activeVariant !== "original" && activeVariant}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
