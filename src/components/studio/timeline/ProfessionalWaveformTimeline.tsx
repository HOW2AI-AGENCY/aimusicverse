/**
 * ProfessionalWaveformTimeline - Enhanced waveform with sections
 * Optimized for both desktop and mobile with touch gestures
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { createAudioContext } from '@/lib/audio/audioContextHelper';

// Section colors by type
const SECTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  intro: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
  verse: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  chorus: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
  bridge: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
  outro: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400' },
  default: { bg: 'bg-primary/20', border: 'border-primary/40', text: 'text-primary' },
};

function getSectionColor(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('intro')) return SECTION_COLORS.intro;
  if (normalized.includes('verse')) return SECTION_COLORS.verse;
  if (normalized.includes('chorus') || normalized.includes('hook')) return SECTION_COLORS.chorus;
  if (normalized.includes('bridge')) return SECTION_COLORS.bridge;
  if (normalized.includes('outro')) return SECTION_COLORS.outro;
  return SECTION_COLORS.default;
}

interface ProfessionalWaveformTimelineProps {
  audioUrl?: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  sections: DetectedSection[];
  selectedSectionIndex: number | null;
  replacedRanges?: { start: number; end: number }[];
  onSeek: (time: number) => void;
  onSectionSelect: (section: DetectedSection, index: number) => void;
  onTogglePlay?: () => void;
  className?: string;
  showControls?: boolean;
}

export function ProfessionalWaveformTimeline({
  audioUrl,
  duration,
  currentTime,
  isPlaying,
  sections,
  selectedSectionIndex,
  replacedRanges = [],
  onSeek,
  onSectionSelect,
  onTogglePlay,
  className,
  showControls = true,
}: ProfessionalWaveformTimelineProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Generate waveform from audio
  useEffect(() => {
    if (!audioUrl) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const audioContext = createAudioContext();
    
    fetch(audioUrl)
      .then(res => res.arrayBuffer())
      .then(buffer => audioContext.decodeAudioData(buffer))
      .then(audioBuffer => {
        const rawData = audioBuffer.getChannelData(0);
        const samples = isMobile ? 100 : 200;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];
        
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[i * blockSize + j]);
          }
          filteredData.push(sum / blockSize);
        }
        
        // Normalize
        const max = Math.max(...filteredData);
        const normalized = filteredData.map(v => v / max);
        setWaveformData(normalized);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Waveform generation error:', err);
        // Generate placeholder waveform
        const placeholder = Array.from({ length: isMobile ? 100 : 200 }, () => 
          0.3 + Math.random() * 0.4
        );
        setWaveformData(placeholder);
        setIsLoading(false);
      });

    return () => {
      audioContext.close();
    };
  }, [audioUrl, isMobile]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = (width / waveformData.length) * zoom;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    // Draw section backgrounds
    sections.forEach((section, index) => {
      const startX = (section.startTime / duration) * width * zoom - scrollOffset;
      const endX = (section.endTime / duration) * width * zoom - scrollOffset;
      const sectionWidth = endX - startX;
      
      if (startX > width || endX < 0) return;

      const colors = getSectionColor(section.type);
      const isSelected = index === selectedSectionIndex;
      const isReplaced = replacedRanges.some(r => 
        r.start <= section.endTime && r.end >= section.startTime
      );

      ctx.fillStyle = isSelected 
        ? 'rgba(var(--primary), 0.15)' 
        : isReplaced 
          ? 'rgba(34, 197, 94, 0.1)'
          : 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(Math.max(0, startX), 0, Math.min(sectionWidth, width - startX), height);
    });

    // Draw waveform bars
    waveformData.forEach((value, index) => {
      const x = index * barWidth - scrollOffset;
      if (x < -barWidth || x > width) return;

      const barHeight = value * (height * 0.7);
      const y = (height - barHeight) / 2;
      
      const barProgress = index / waveformData.length;
      const isPast = barProgress < progress;

      // Gradient effect
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      if (isPast) {
        gradient.addColorStop(0, 'hsl(var(--primary))');
        gradient.addColorStop(1, 'hsl(var(--primary) / 0.6)');
      } else {
        gradient.addColorStop(0, 'hsl(var(--muted-foreground) / 0.4)');
        gradient.addColorStop(1, 'hsl(var(--muted-foreground) / 0.2)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(barWidth - 1, 1), barHeight, 2);
      ctx.fill();
    });

    // Draw playhead
    const playheadX = progress * width * zoom - scrollOffset;
    if (playheadX >= 0 && playheadX <= width) {
      ctx.strokeStyle = 'hsl(var(--primary))';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead glow
      ctx.shadowColor = 'hsl(var(--primary))';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [waveformData, currentTime, duration, sections, selectedSectionIndex, replacedRanges, zoom, scrollOffset]);

  // Handle click to seek
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left + scrollOffset) / zoom;
    const time = (x / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, time)));
  }, [duration, onSeek, zoom, scrollOffset]);

  // Find section at time
  const currentSection = useMemo(() => {
    return sections.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
  }, [sections, currentTime]);

  return (
    <div className={cn("relative", className)}>
      {/* Section Pills Row */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide">
        {sections.map((section, index) => {
          const colors = getSectionColor(section.type);
          const isSelected = index === selectedSectionIndex;
          const isCurrent = currentTime >= section.startTime && currentTime <= section.endTime;
          const isReplaced = replacedRanges.some(r => 
            r.start <= section.endTime && r.end >= section.startTime
          );

          return (
            <motion.button
              key={index}
              onClick={() => onSectionSelect(section, index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium",
                "border transition-all duration-200",
                colors.bg, colors.border, colors.text,
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isCurrent && !isSelected && "ring-1 ring-white/30",
                isReplaced && "border-green-500/50"
              )}
            >
              {section.label}
              {isReplaced && <span className="ml-1 text-green-400">✓</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Waveform Canvas */}
      <div 
        ref={containerRef}
        className="relative px-3 pb-3"
      >
        <div className={cn(
          "relative h-20 rounded-xl overflow-hidden",
          "bg-gradient-to-b from-muted/30 to-muted/10",
          "border border-border/30"
        )}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary/50 rounded-full"
                    animate={{ height: [16, 32, 16] }}
                    transition={{ 
                      duration: 0.8, 
                      repeat: Infinity, 
                      delay: i * 0.1 
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onClick={handleClick}
              className="w-full h-full cursor-pointer"
            />
          )}

          {/* Time Overlay */}
          <div className="absolute bottom-1 left-2 px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm">
            <span className="text-xs font-mono text-foreground">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs font-mono text-muted-foreground"> / {formatTime(duration)}</span>
          </div>

          {/* Current Section Label */}
          {currentSection && (
            <div className="absolute top-1 right-2 px-2 py-0.5 rounded bg-background/80 backdrop-blur-sm">
              <span className={cn("text-xs font-medium", getSectionColor(currentSection.type).text)}>
                {currentSection.label}
              </span>
            </div>
          )}
        </div>

        {/* Zoom Controls - Desktop only */}
        {showControls && !isMobile && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full bg-background/80"
              onClick={() => setZoom(z => Math.min(z * 1.5, 4))}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 rounded-full bg-background/80"
              onClick={() => setZoom(z => Math.max(z / 1.5, 1))}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            {zoom > 1 && (
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-full bg-background/80"
                onClick={() => { setZoom(1); setScrollOffset(0); }}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
