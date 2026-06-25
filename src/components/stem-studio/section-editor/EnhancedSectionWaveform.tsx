/**
 * EnhancedSectionWaveform
 *
 * Advanced waveform visualization with:
 * - Real waveform data (or simulated)
 * - Replaced section markers with history
 * - Interactive region selection
 * - Visual comparison mode overlay
 */

import { memo, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";
import { GripVertical, History, Eye, EyeOff, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useWaveformData } from "@/hooks/audio/useWaveformData";

export interface ReplacedSection {
  id: string;
  startTime: number;
  endTime: number;
  replacedAt: Date;
  versionId?: string;
  label?: string;
  isActive?: boolean;
}

interface EnhancedSectionWaveformProps {
  audioUrl?: string | null;
  trackId?: string | null;
  duration: number;
  startTime: number;
  endTime: number;
  currentTime?: number;
  isValid: boolean;
  interactive?: boolean;
  replacedSections?: ReplacedSection[];
  showHistory?: boolean;
  onSelectionChange?: (startTime: number, endTime: number) => void;
  onSectionClick?: (section: ReplacedSection) => void;
  className?: string;
}

export const EnhancedSectionWaveform = memo(function EnhancedSectionWaveform({
  audioUrl,
  trackId,
  duration,
  startTime,
  endTime,
  currentTime = 0,
  isValid,
  interactive = false,
  replacedSections = [],
  showHistory = true,
  onSelectionChange,
  onSectionClick,
  className,
}: EnhancedSectionWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"start" | "end" | "region" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialStart, setInitialStart] = useState(startTime);
  const [initialEnd, setInitialEnd] = useState(endTime);
  const [showMarkers, setShowMarkers] = useState(true);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Load real waveform data
  const { waveformData, isLoading } = useWaveformData(audioUrl, {
    samples: 120,
    autoLoad: !!audioUrl,
    trackId: trackId || undefined,
  });

  // Generate bars from waveform data or use simulated data
  const bars = useMemo(() => {
    if (waveformData && waveformData.length > 0) {
      return waveformData.map((v) => Math.max(15, Math.min(85, v * 85)));
    }
    // Fallback to simulated waveform
    return Array.from({ length: 120 }).map((_, i) => {
      const base = 35;
      const variation = Math.sin(i * 0.3) * 25 + Math.cos(i * 0.7) * 15;
      const randomOffset = (((i * 7919) % 100) / 100) * 15;
      return Math.max(15, Math.min(85, base + variation + randomOffset));
    });
  }, [waveformData]);

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const widthPercent = endPercent - startPercent;
  const progressPercent = (currentTime / duration) * 100;

  const getTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      return percent * duration;
    },
    [duration],
  );

  const handleDragStart = useCallback(
    (type: "start" | "end" | "region", e: React.MouseEvent | React.TouchEvent) => {
      if (!interactive || !onSelectionChange) return;
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      setIsDragging(type);
      setDragStartX(clientX);
      setInitialStart(startTime);
      setInitialEnd(endTime);
    },
    [interactive, onSelectionChange, startTime, endTime],
  );

  useEffect(() => {
    if (!isDragging || !onSelectionChange) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const delta = clientX - dragStartX;

      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaTime = (delta / rect.width) * duration;

      let newStart = initialStart;
      let newEnd = initialEnd;

      if (isDragging === "start") {
        newStart = Math.max(0, Math.min(initialEnd - 1, initialStart + deltaTime));
      } else if (isDragging === "end") {
        newEnd = Math.max(initialStart + 1, Math.min(duration, initialEnd + deltaTime));
      } else if (isDragging === "region") {
        const regionDuration = initialEnd - initialStart;
        newStart = Math.max(0, Math.min(duration - regionDuration, initialStart + deltaTime));
        newEnd = newStart + regionDuration;
      }

      onSelectionChange(newStart, newEnd);
    };

    const handleEnd = () => {
      setIsDragging(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, dragStartX, initialStart, initialEnd, duration, onSelectionChange]);

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive || !onSelectionChange || isDragging) return;

      const clickTime = getTimeFromPosition(e.clientX);
      const regionDuration = endTime - startTime;
      const halfDuration = regionDuration / 2;

      let newStart = clickTime - halfDuration;
      let newEnd = clickTime + halfDuration;

      if (newStart < 0) {
        newStart = 0;
        newEnd = regionDuration;
      } else if (newEnd > duration) {
        newEnd = duration;
        newStart = duration - regionDuration;
      }

      onSelectionChange(newStart, newEnd);
    },
    [interactive, onSelectionChange, isDragging, getTimeFromPosition, startTime, endTime, duration],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {/* Controls bar */}
      {showHistory && replacedSections.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <History className="w-3 h-3" />
              {replacedSections.length} замен
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowMarkers(!showMarkers)} className="h-7 text-xs gap-1">
            {showMarkers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showMarkers ? "Скрыть" : "Показать"} маркеры
          </Button>
        </div>
      )}

      {/* Main waveform container */}
      <div
        ref={containerRef}
        className={cn(
          "relative h-28 rounded-xl bg-gradient-to-b from-muted/60 to-muted/40 border border-border/50 overflow-hidden select-none",
          interactive && "cursor-pointer",
          isDragging && "cursor-grabbing",
          isLoading && "animate-pulse",
        )}
        onClick={handleContainerClick}
      >
        {/* Background waveform */}
        <div className="absolute inset-0 flex items-center justify-around px-1">
          {bars.map((height, i) => (
            <div
              key={i}
              className="w-0.5 sm:w-1 rounded-full bg-muted-foreground/40 transition-colors"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Replaced sections markers */}
        <AnimatePresence>
          {showMarkers &&
            replacedSections.map((section) => {
              const sectionStartPercent = (section.startTime / duration) * 100;
              const sectionEndPercent = (section.endTime / duration) * 100;
              const sectionWidthPercent = sectionEndPercent - sectionStartPercent;
              const isHovered = hoveredSection === section.id;

              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0 }}
                      className={cn(
                        "absolute inset-y-0 cursor-pointer transition-all",
                        section.isActive
                          ? "bg-success/20 border-x border-success/50"
                          : "bg-violet-500/15 border-x border-violet-500/30",
                        isHovered && "bg-violet-500/30 z-20",
                      )}
                      style={{
                        left: `${sectionStartPercent}%`,
                        width: `${sectionWidthPercent}%`,
                      }}
                      onMouseEnter={() => setHoveredSection(section.id)}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSectionClick?.(section);
                      }}
                    >
                      {/* Top marker badge */}
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: isHovered ? 1 : 0.7, y: 0 }}
                        className={cn(
                          "absolute top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap",
                          section.isActive ? "bg-success text-success-foreground" : "bg-violet-500/80 text-white",
                        )}
                      >
                        {section.isActive ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Активна
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {section.label || "Замена"}
                          </span>
                        )}
                      </motion.div>

                      {/* Striped pattern for replaced sections */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(45deg, transparent, transparent 4px, currentColor 4px, currentColor 5px)",
                        }}
                      />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{section.label || "Замена секции"}</p>
                    <p className="text-muted-foreground">
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </p>
                    <p className="text-muted-foreground">
                      {section.replacedAt.toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </AnimatePresence>

        {/* Current selection region */}
        <motion.div
          className={cn(
            "absolute inset-y-0 rounded-md transition-colors z-10",
            isValid
              ? "bg-primary/25 border-x-2 border-primary shadow-lg shadow-primary/20"
              : "bg-destructive/25 border-x-2 border-destructive shadow-lg shadow-destructive/20",
            interactive && isDragging === "region" && "bg-primary/35",
            interactive && !isDragging && "hover:bg-primary/30 cursor-grab",
          )}
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
          }}
          onMouseDown={(e) => handleDragStart("region", e)}
          onTouchStart={(e) => handleDragStart("region", e)}
        >
          {/* Highlighted waveform inside selection */}
          <div className="absolute inset-0 flex items-center justify-around px-0.5 overflow-hidden pointer-events-none">
            {bars
              .slice(Math.floor((startPercent / 100) * bars.length), Math.ceil((endPercent / 100) * bars.length))
              .map((height, i) => (
                <motion.div
                  key={i}
                  className={cn("w-0.5 rounded-full", isValid ? "bg-primary" : "bg-destructive")}
                  style={{ height: `${height}%` }}
                  animate={
                    isDragging
                      ? {}
                      : {
                          scaleY: [1, 1.05, 1],
                          opacity: [0.7, 0.95, 0.7],
                        }
                  }
                  transition={{
                    duration: 2,
                    delay: i * 0.02,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
              ))}
          </div>

          {/* Drag indicator */}
          {interactive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className={cn(
                  "p-1.5 rounded-lg bg-background/70 backdrop-blur-sm shadow-lg",
                  isDragging === "region" ? "opacity-100 scale-110" : "opacity-0",
                )}
                animate={{ opacity: isDragging === "region" ? 1 : 0 }}
              >
                <GripVertical className="w-4 h-4 text-primary" />
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Playhead */}
        {currentTime > 0 && (
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/80 z-30 pointer-events-none"
            style={{ left: `${progressPercent}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rounded-full" />
          </motion.div>
        )}

        {/* Start marker handle */}
        <motion.div
          className={cn("absolute top-0 bottom-0 w-4 -ml-2 z-20", interactive ? "cursor-ew-resize" : "cursor-default")}
          style={{ left: `${startPercent}%` }}
          onMouseDown={(e) => handleDragStart("start", e)}
          onTouchStart={(e) => handleDragStart("start", e)}
        >
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 transition-all",
              isValid ? "bg-primary" : "bg-destructive",
              isDragging === "start" && "w-1 shadow-lg",
            )}
          />
          <motion.div
            className={cn(
              "absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-lg",
              isValid ? "bg-primary border-background" : "bg-destructive border-background",
              isDragging === "start" && "scale-125",
            )}
            animate={isDragging !== "start" ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {(isDragging === "start" || isDragging === "region") && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded-lg shadow-lg whitespace-nowrap"
            >
              {formatTime(startTime)}
            </motion.div>
          )}
        </motion.div>

        {/* End marker handle */}
        <motion.div
          className={cn("absolute top-0 bottom-0 w-4 -ml-2 z-20", interactive ? "cursor-ew-resize" : "cursor-default")}
          style={{ left: `${endPercent}%` }}
          onMouseDown={(e) => handleDragStart("end", e)}
          onTouchStart={(e) => handleDragStart("end", e)}
        >
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 transition-all",
              isValid ? "bg-primary" : "bg-destructive",
              isDragging === "end" && "w-1 shadow-lg",
            )}
          />
          <motion.div
            className={cn(
              "absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-lg",
              isValid ? "bg-primary border-background" : "bg-destructive border-background",
              isDragging === "end" && "scale-125",
            )}
            animate={isDragging !== "end" ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          {(isDragging === "end" || isDragging === "region") && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded-lg shadow-lg whitespace-nowrap"
            >
              {formatTime(endTime)}
            </motion.div>
          )}
        </motion.div>

        {/* Time labels at bottom */}
        <div className="absolute bottom-1.5 left-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
          0:00
        </div>
        <div className="absolute bottom-1.5 right-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
          {formatTime(duration)}
        </div>

        {/* Selection duration in center */}
        {interactive && (
          <motion.div
            className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-lg text-sm font-mono text-foreground border border-border/50 shadow-sm"
            animate={{ opacity: isDragging ? 1 : 0.8 }}
          >
            <span className={cn(isValid ? "text-primary" : "text-destructive")}>{formatTime(endTime - startTime)}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
});

export default EnhancedSectionWaveform;
