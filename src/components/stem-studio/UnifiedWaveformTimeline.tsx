/**
 * Unified Waveform Timeline
 * 
 * Combines waveform visualization with section markers
 * Works for all tracks (with or without stems)
 */

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

interface UnifiedWaveformTimelineProps {
  audioUrl: string;
  sections: DetectedSection[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  selectedSectionIndex: number | null;
  customRange: { start: number; end: number } | null;
  replacedRanges?: { start: number; end: number }[];
  onSectionClick: (section: DetectedSection, index: number) => void;
  onSeek: (time: number) => void;
  height?: number;
  showSectionLabels?: boolean;
}

const SECTION_COLORS: Record<DetectedSection['type'], { 
  bg: string; 
  bgHover: string;
  border: string; 
  wave: string; 
  progress: string;
  label: string;
}> = {
  verse: { 
    bg: 'bg-blue-500/20', 
    bgHover: 'bg-blue-500/30',
    border: 'border-blue-500/40', 
    wave: 'hsl(207 90% 54% / 0.3)',
    progress: 'hsl(207 90% 54% / 0.7)',
    label: 'text-blue-400'
  },
  chorus: { 
    bg: 'bg-purple-500/20', 
    bgHover: 'bg-purple-500/30',
    border: 'border-purple-500/40', 
    wave: 'hsl(270 70% 65% / 0.3)',
    progress: 'hsl(270 70% 65% / 0.7)',
    label: 'text-purple-400'
  },
  bridge: { 
    bg: 'bg-amber-500/20', 
    bgHover: 'bg-amber-500/30',
    border: 'border-amber-500/40', 
    wave: 'hsl(38 95% 50% / 0.3)',
    progress: 'hsl(38 95% 50% / 0.7)',
    label: 'text-amber-400'
  },
  intro: { 
    bg: 'bg-green-500/20', 
    bgHover: 'bg-green-500/30',
    border: 'border-green-500/40', 
    wave: 'hsl(145 65% 45% / 0.3)',
    progress: 'hsl(145 65% 45% / 0.7)',
    label: 'text-green-400'
  },
  outro: { 
    bg: 'bg-rose-500/20', 
    bgHover: 'bg-rose-500/30',
    border: 'border-rose-500/40', 
    wave: 'hsl(350 70% 55% / 0.3)',
    progress: 'hsl(350 70% 55% / 0.7)',
    label: 'text-rose-400'
  },
  'pre-chorus': { 
    bg: 'bg-cyan-500/20', 
    bgHover: 'bg-cyan-500/30',
    border: 'border-cyan-500/40', 
    wave: 'hsl(188 80% 43% / 0.3)',
    progress: 'hsl(188 80% 43% / 0.7)',
    label: 'text-cyan-400'
  },
  hook: { 
    bg: 'bg-orange-500/20', 
    bgHover: 'bg-orange-500/30',
    border: 'border-orange-500/40', 
    wave: 'hsl(25 95% 53% / 0.3)',
    progress: 'hsl(25 95% 53% / 0.7)',
    label: 'text-orange-400'
  },
  unknown: { 
    bg: 'bg-muted/30', 
    bgHover: 'bg-muted/50',
    border: 'border-muted/60', 
    wave: 'hsl(220 15% 50% / 0.3)',
    progress: 'hsl(220 15% 50% / 0.7)',
    label: 'text-muted-foreground'
  },
};

export const UnifiedWaveformTimeline = memo(({
  audioUrl,
  sections,
  duration,
  currentTime,
  isPlaying,
  selectedSectionIndex,
  customRange,
  replacedRanges = [],
  onSectionClick,
  onSeek,
  height = 80,
  showSectionLabels = true,
}: UnifiedWaveformTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return;

    setIsLoading(true);
    setIsReady(false);

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      height: height - 32, // Leave space for section labels
      waveColor: 'hsl(var(--primary) / 0.25)',
      progressColor: 'hsl(var(--primary) / 0.6)',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 0,
      normalize: true,
      backend: 'WebAudio',
      interact: false, // We handle interaction ourselves
      hideScrollbar: true,
      fillParent: true,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      setIsReady(true);
      setIsLoading(false);
    });

    wavesurfer.on('error', (err) => {
      logger.error('Waveform error', err);
      setIsLoading(false);
    });

    wavesurfer.load(audioUrl);

    return () => {
      // WaveSurfer can throw AbortError during destroy if a load is in-flight.
      // This should not surface as an app error.
      try {
        wavesurfer.destroy();
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          logger.error('Waveform destroy error', e);
        }
      } finally {
        wavesurferRef.current = null;
      }
    };
  }, [audioUrl, height]);

  // Sync time with external audio
  useEffect(() => {
    if (wavesurferRef.current && isReady && duration > 0) {
      const normalizedProgress = Math.max(0, Math.min(1, currentTime / duration));
      wavesurferRef.current.seekTo(normalizedProgress);
    }
  }, [currentTime, duration, isReady]);

  // Handle click on timeline
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    onSeek(time);
  }, [duration, onSeek]);

  // Calculate section positions
  const sectionPositions = useMemo(() => {
    return sections.map((section) => ({
      left: (section.startTime / duration) * 100,
      width: ((section.endTime - section.startTime) / duration) * 100,
    }));
  }, [sections, duration]);

  // Find active section
  const activeIndex = sections.findIndex(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="relative w-full space-y-1">
      {/* Section Labels Row */}
      {showSectionLabels && sections.length > 0 && (
        <div className="relative h-6 mb-1">
          <TooltipProvider delayDuration={100}>
            {sections.map((section, idx) => {
              const pos = sectionPositions[idx];
              const colors = SECTION_COLORS[section.type];
              const isSelected = selectedSectionIndex === idx;
              const isHovered = hoveredSection === idx;
              const isActive = idx === activeIndex;

              // Only show label if section is wide enough
              if (pos.width < 6) return null;

              return (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <motion.button
                      className={cn(
                        'absolute top-0 h-full px-1 rounded-t-md border-t border-x text-[9px] font-medium',
                        'transition-all duration-150 cursor-pointer overflow-hidden',
                        colors.bg,
                        colors.border,
                        colors.label,
                        isSelected && 'bg-primary/30 border-primary ring-1 ring-primary/50 z-20',
                        isHovered && !isSelected && colors.bgHover,
                        isActive && !isSelected && 'brightness-125'
                      )}
                      style={{ 
                        left: `${pos.left}%`, 
                        width: `${pos.width}%`,
                      }}
                      onClick={() => onSectionClick(section, idx)}
                      onMouseEnter={() => setHoveredSection(idx)}
                      onMouseLeave={() => setHoveredSection(null)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="truncate block leading-tight pt-0.5">
                        {pos.width > 10 ? section.label : section.type.slice(0, 2).toUpperCase()}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="font-medium">{section.label}</div>
                    <div className="text-muted-foreground">
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </div>
                    <div className="text-primary text-[10px] mt-0.5">
                      Нажмите для замены секции
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      )}

      {/* Main Timeline Container */}
      <div 
        ref={containerRef}
        className="relative rounded-lg overflow-hidden cursor-pointer group"
        style={{ height: height - 32 }}
        onClick={handleClick}
      >
        {/* Loading State */}
        {isLoading && (
          <Skeleton className="absolute inset-0" />
        )}

        {/* Section Background Overlays */}
        {sections.map((section, idx) => {
          const pos = sectionPositions[idx];
          const colors = SECTION_COLORS[section.type];
          const isSelected = selectedSectionIndex === idx;
          const isHovered = hoveredSection === idx;
          const isActive = idx === activeIndex;

          return (
            <motion.div
              key={`bg-${idx}`}
              className={cn(
                'absolute top-0 h-full transition-all duration-150 pointer-events-none',
                colors.bg,
                'border-x',
                colors.border,
                isSelected && 'bg-primary/20 border-primary',
                isHovered && !isSelected && colors.bgHover,
              )}
              style={{ 
                left: `${pos.left}%`, 
                width: `${pos.width}%`,
              }}
              animate={{
                opacity: isActive ? 1 : 0.7,
              }}
            >
              {/* Active pulse effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {/* Selected glow */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 bg-primary/20"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Waveform Container */}
        <div 
          ref={waveformRef} 
          className={cn(
            "absolute inset-0 z-10 pointer-events-none transition-opacity",
            isLoading && "opacity-0"
          )}
        />

        {/* Replaced Sections Indicators */}
        <AnimatePresence>
          {replacedRanges.map((range, idx) => {
            const left = (range.start / duration) * 100;
            const width = ((range.end - range.start) / duration) * 100;
            
            return (
              <motion.div
                key={`replaced-${idx}`}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                className="absolute top-0 h-full border-x-2 border-success/60 pointer-events-none z-15 origin-bottom"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <div className="absolute inset-0 bg-success/10" />
                <motion.div 
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-success text-success-foreground text-[8px] font-bold rounded-b"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  ✓
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Custom Range Selection */}
        <AnimatePresence>
          {customRange && selectedSectionIndex === null && (
            <motion.div
              className="absolute top-0 h-full bg-primary/30 border-x-2 border-primary pointer-events-none z-20"
              style={{
                left: `${(customRange.start / duration) * 100}%`,
                width: `${((customRange.end - customRange.start) / duration) * 100}%`,
              }}
              initial={{ opacity: 0, scaleY: 0.5 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-primary/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Overlay (darkens played area slightly) */}
        <div 
          className="absolute top-0 h-full bg-foreground/5 pointer-events-none z-5 transition-all"
          style={{ width: `${progress}%` }}
        />

        {/* Playhead */}
        <motion.div
          className="absolute top-0 h-full w-0.5 bg-primary z-30 pointer-events-none shadow-lg"
          style={{ left: `${progress}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Playhead handle */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-md" />
          
          {/* Glow effect */}
          <div className="absolute inset-y-0 -inset-x-1 bg-primary/30 blur-sm" />
        </motion.div>

        {/* Hover time indicator */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 to-transparent" />
        </div>
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-1">
        <motion.span
          key={Math.floor(currentTime)}
          initial={{ opacity: 0.7, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="tabular-nums"
        >
          {formatTime(currentTime)}
        </motion.span>
        <span className="tabular-nums">{formatTime(duration)}</span>
      </div>
    </div>
  );
});

UnifiedWaveformTimeline.displayName = 'UnifiedWaveformTimeline';

export default UnifiedWaveformTimeline;
