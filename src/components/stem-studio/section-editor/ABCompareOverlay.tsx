/**
 * ABCompareOverlay
 *
 * Inline A/B comparison overlay that shows:
 * - Dual waveforms (original vs new)
 * - Quick toggle between versions
 * - Visual difference highlighting
 */

import { memo, useId, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";
import { Play, Pause, RotateCcw, Volume2, VolumeX, ArrowLeftRight, Check, X, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { audioElementPool, AudioPriority } from "@/lib/audioElementPool";

type VersionType = "original" | "new";

interface ABCompareOverlayProps {
  originalAudioUrl: string;
  newAudioUrl: string;
  variantBUrl?: string;
  sectionStart: number;
  sectionEnd: number;
  onApply: () => void;
  onDiscard: () => void;
  onSwitchVariant?: (variant: "A" | "B") => void;
  className?: string;
}

export const ABCompareOverlay = memo(function ABCompareOverlay({
  originalAudioUrl,
  newAudioUrl,
  variantBUrl,
  sectionStart,
  sectionEnd,
  onApply,
  onDiscard,
  onSwitchVariant,
  className,
}: ABCompareOverlayProps) {
  const [activeVersion, setActiveVersion] = useState<VersionType>("new");
  const [selectedVariant, setSelectedVariant] = useState<"A" | "B">("A");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // Split view position
  const [viewMode, setViewMode] = useState<"toggle" | "split">("toggle");
  const haptic = useHapticFeedback();
  const instanceId = useId();
  const originalPoolId = `ab-compare-original-${instanceId}`;
  const newPoolId = `ab-compare-new-${instanceId}`;

  const originalRef = useRef<HTMLAudioElement | null>(null);
  const newRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const sectionDuration = sectionEnd - sectionStart;
  const hasVariantB = !!variantBUrl;
  const currentNewUrl = selectedVariant === "B" && variantBUrl ? variantBUrl : newAudioUrl;

  // Generate waveform bars for both versions
  const originalBars = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => {
        const base = 40;
        const variation = Math.sin(i * 0.4) * 20 + Math.cos(i * 0.6) * 15;
        return Math.max(20, Math.min(80, base + variation));
      }),
    [],
  );

  const newBars = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => {
        const base = 45;
        const variation = Math.sin(i * 0.5) * 25 + Math.cos(i * 0.8) * 10;
        return Math.max(20, Math.min(85, base + variation + 5));
      }),
    [],
  );

  // Initialize audio elements - only recreate when URLs change
  useEffect(() => {
    // Cleanup previous audio elements
    if (originalRef.current) {
      originalRef.current.pause();
      originalRef.current.src = "";
    }
    if (newRef.current) {
      newRef.current.pause();
      newRef.current.src = "";
    }

    const originalEl = audioElementPool.acquire(originalPoolId, AudioPriority.HIGH);
    const newEl = audioElementPool.acquire(newPoolId, AudioPriority.HIGH);

    if (originalEl) {
      originalEl.src = originalAudioUrl;
      originalEl.load();
    }
    if (newEl) {
      newEl.src = currentNewUrl;
      newEl.load();
    }
    originalRef.current = originalEl;
    newRef.current = newEl;

    const effectiveVolume = isMuted ? 0 : volume;
    if (originalRef.current) originalRef.current.volume = effectiveVolume;
    if (newRef.current) newRef.current.volume = effectiveVolume;

    return () => {
      if (originalRef.current) {
        originalRef.current.pause();
      }
      if (newRef.current) {
        newRef.current.pause();
      }
      audioElementPool.release(originalPoolId);
      audioElementPool.release(newPoolId);
      originalRef.current = null;
      newRef.current = null;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [originalAudioUrl, currentNewUrl, originalPoolId, newPoolId]); // Only recreate on URL change

  // Update volume
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    if (originalRef.current) originalRef.current.volume = effectiveVolume;
    if (newRef.current) newRef.current.volume = effectiveVolume;
  }, [volume, isMuted]);

  const activeAudio = activeVersion === "original" ? originalRef.current : newRef.current;

  const updateProgress = useCallback(() => {
    if (activeAudio) {
      const progress = activeVersion === "original" ? activeAudio.currentTime - sectionStart : activeAudio.currentTime;
      setCurrentTime(Math.max(0, Math.min(progress, sectionDuration)));

      const endCheck = activeVersion === "original" ? sectionEnd : sectionDuration;
      const currentPos = activeVersion === "original" ? activeAudio.currentTime : activeAudio.currentTime;

      if (currentPos >= endCheck) {
        activeAudio.pause();
        activeAudio.currentTime = activeVersion === "original" ? sectionStart : 0;
        setIsPlaying(false);
        setCurrentTime(0);
      } else if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [activeAudio, activeVersion, sectionStart, sectionEnd, sectionDuration, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  const togglePlay = async () => {
    if (!activeAudio) return;
    haptic.tap();

    if (isPlaying) {
      activeAudio.pause();
      setIsPlaying(false);
    } else {
      const startPos = activeVersion === "original" ? sectionStart : 0;
      activeAudio.currentTime = startPos + currentTime;
      await activeAudio.play();
      setIsPlaying(true);
    }
  };

  const switchVersion = (version: VersionType) => {
    if (version === activeVersion) return;
    haptic.select();

    originalRef.current?.pause();
    newRef.current?.pause();

    setIsPlaying(false);
    setCurrentTime(0);
    setActiveVersion(version);
  };

  const handleVariantSwitch = () => {
    if (!hasVariantB) return;
    const newVariant = selectedVariant === "A" ? "B" : "A";
    setSelectedVariant(newVariant);
    onSwitchVariant?.(newVariant);

    // Reload new audio (reuse pooled element)
    if (newRef.current) {
      newRef.current.pause();
      newRef.current.src = newVariant === "B" && variantBUrl ? variantBUrl : newAudioUrl;
      newRef.current.load();
      newRef.current.volume = isMuted ? 0 : volume;
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const restart = () => {
    haptic.tap();
    if (activeAudio) {
      activeAudio.currentTime = activeVersion === "original" ? sectionStart : 0;
      setCurrentTime(0);
    }
  };

  const progress = (currentTime / sectionDuration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "rounded-2xl border border-success/30 bg-gradient-to-br from-success/5 via-background to-primary/5 p-4 space-y-4 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Sparkles className="w-4 h-4 text-success" />
          </motion.div>
          <span className="text-sm font-medium">A/B Сравнение</span>
          <Badge variant="outline" className="text-[10px] font-mono bg-background/50">
            {formatTime(sectionStart)} — {formatTime(sectionEnd)}
          </Badge>
        </div>

        {hasVariantB && (
          <Button variant="ghost" size="sm" onClick={handleVariantSwitch} className="h-7 text-xs gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            Вариант {selectedVariant}
          </Button>
        )}
      </div>

      {/* Dual Waveform Display */}
      <div className="space-y-3">
        {/* Original version */}
        <motion.button
          onClick={() => switchVersion("original")}
          className={cn(
            "w-full rounded-xl p-3 transition-all border-2",
            activeVersion === "original"
              ? "border-muted-foreground/50 bg-muted/30"
              : "border-transparent bg-muted/10 hover:bg-muted/20",
          )}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                activeVersion === "original"
                  ? "bg-muted-foreground/20 text-foreground"
                  : "bg-muted text-muted-foreground",
              )}
              animate={{ scale: activeVersion === "original" ? 1.05 : 1 }}
            >
              A
            </motion.div>

            {/* Waveform */}
            <div className="flex-1 h-10 flex items-center gap-0.5 overflow-hidden">
              {originalBars.map((height, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    activeVersion === "original" && (i / originalBars.length) * 100 <= progress
                      ? "bg-muted-foreground"
                      : "bg-muted-foreground/30",
                  )}
                  style={{ height: `${height}%` }}
                  animate={
                    activeVersion === "original" && isPlaying
                      ? {
                          scaleY: [1, 1.1, 1],
                        }
                      : {}
                  }
                  transition={{ duration: 0.3, delay: i * 0.01 }}
                />
              ))}
            </div>

            <span
              className={cn(
                "text-sm shrink-0",
                activeVersion === "original" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              Оригинал
            </span>
          </div>
        </motion.button>

        {/* New version */}
        <motion.button
          onClick={() => switchVersion("new")}
          className={cn(
            "w-full rounded-xl p-3 transition-all border-2",
            activeVersion === "new"
              ? "border-primary/50 bg-primary/10 shadow-lg shadow-primary/10"
              : "border-transparent bg-primary/5 hover:bg-primary/10",
          )}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                activeVersion === "new" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
              )}
              animate={{ scale: activeVersion === "new" ? 1.05 : 1 }}
            >
              B
            </motion.div>

            {/* Waveform */}
            <div className="flex-1 h-10 flex items-center gap-0.5 overflow-hidden">
              {newBars.map((height, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-colors",
                    activeVersion === "new" && (i / newBars.length) * 100 <= progress ? "bg-primary" : "bg-primary/30",
                  )}
                  style={{ height: `${height}%` }}
                  animate={
                    activeVersion === "new" && isPlaying
                      ? {
                          scaleY: [1, 1.15, 1],
                        }
                      : {}
                  }
                  transition={{ duration: 0.3, delay: i * 0.01 }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Wand2 className={cn("w-3 h-3", activeVersion === "new" ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-sm", activeVersion === "new" ? "text-primary" : "text-muted-foreground")}>
                Новая {hasVariantB && `(${selectedVariant})`}
              </span>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Progress slider */}
      <div className="space-y-1">
        <Slider
          value={[currentTime]}
          min={0}
          max={sectionDuration}
          step={0.1}
          onValueChange={(v) => {
            setCurrentTime(v[0]);
            if (activeAudio) {
              const startPos = activeVersion === "original" ? sectionStart : 0;
              activeAudio.currentTime = startPos + v[0];
            }
          }}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(sectionDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={restart} className="h-9 w-9 rounded-full">
            <RotateCcw className="w-4 h-4" />
          </Button>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              className={cn("h-11 w-11 rounded-full", activeVersion === "new" && "bg-primary hover:bg-primary/90")}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isPlaying ? "pause" : "play"}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </motion.div>
              </AnimatePresence>
            </Button>
          </motion.div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="h-9 w-9 rounded-full">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(v) => {
                setVolume(v[0]);
                if (v[0] > 0 && isMuted) setIsMuted(false);
              }}
              className="w-20"
            />
          </div>
        </div>

        {/* Apply/Discard buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptic.warning();
              onDiscard();
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4 mr-1" />
            Отмена
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              haptic.success();
              onApply();
            }}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <Check className="w-4 h-4 mr-1" />
            Применить
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

export default ABCompareOverlay;
