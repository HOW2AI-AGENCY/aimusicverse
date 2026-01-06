/**
 * Section Editor Sheet
 * 
 * Bottom sheet on mobile, inline panel on desktop
 * For editing and replacing track sections
 * Features waveform timeline with draggable boundaries
 * and synchronized lyrics display
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  X, Wand2, Zap, Sparkles, 
  ChevronDown, ChevronUp, MessageSquare,
  Loader2, Play, Pause, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useSectionReplacement, SECTION_PRESETS } from '@/hooks/useSectionReplacement';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { WaveformRangeSelector } from './WaveformRangeSelector';
import { SynchronizedSectionLyrics } from './SynchronizedSectionLyrics';
import { SectionReplacementProgress } from '@/components/generation/SectionReplacementProgress';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { pauseAllStudioAudio } from '@/hooks/studio/useStudioAudio';

interface SectionEditorSheetProps {
  open: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
  trackTags?: string | null;
  audioUrl?: string | null;
  duration: number;
  detectedSections: DetectedSection[];
  sunoTaskId?: string | null;
  sunoId?: string | null;
}

export function SectionEditorSheet({
  open,
  onClose,
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  detectedSections,
  sunoTaskId,
  sunoId,
}: SectionEditorSheetProps) {
  const isMobile = useIsMobile();
  const { selectedSection, customRange, clearSelection, setCustomRange } = useSectionEditorStore();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Fetch timestamped lyrics for sync
  const { data: lyricsData } = useTimestampedLyrics(sunoTaskId || null, sunoId || null);

  const handleClose = useCallback(() => {
    clearSelection();
    setIsPreviewPlaying(false);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    onClose();
  }, [clearSelection, onClose]);

  const {
    startTime,
    endTime,
    sectionDuration,
    maxDuration,
    isValidDuration,
    isSubmitting,
    prompt,
    setPrompt,
    tags,
    setTags,
    lyrics,
    setLyrics,
    addPreset,
    executeReplacement,
    reset,
    progress: sectionProgress,
  } = useSectionReplacement({
    trackId,
    trackTags,
    duration,
    detectedSections,
    onSuccess: () => {
      // Don't close immediately - let user select variant
    },
  });

  // Close when variant is selected or dismissed
  const handleProgressDismiss = useCallback(() => {
    sectionProgress.reset();
    handleClose();
  }, [sectionProgress, handleClose]);

  // Preview audio controls with time tracking
  useEffect(() => {
    if (!audioUrl || !open) return;
    
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    previewAudioRef.current = audio;

    audio.addEventListener('ended', () => setIsPreviewPlaying(false));
    audio.addEventListener('pause', () => setIsPreviewPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
      previewAudioRef.current = null;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl, open]);

  // Update preview time for sync
  useEffect(() => {
    if (!isPreviewPlaying || !previewAudioRef.current) return;
    
    const updateTime = () => {
      if (previewAudioRef.current) {
        setPreviewCurrentTime(previewAudioRef.current.currentTime);
        if (previewAudioRef.current.currentTime >= endTime) {
          previewAudioRef.current.pause();
          setIsPreviewPlaying(false);
        } else {
          animationRef.current = requestAnimationFrame(updateTime);
        }
      }
    };
    animationRef.current = requestAnimationFrame(updateTime);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPreviewPlaying, endTime]);

  const togglePreview = useCallback(() => {
    if (!previewAudioRef.current) return;
    
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.currentTime = startTime;
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  }, [isPreviewPlaying, startTime]);


  // Editor content
  const editorContent = (
    <div className="space-y-4 p-4">
      {/* Section info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Wand2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {selectedSection?.label || 'Выбранная секция'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {sectionDuration.toFixed(1)}с
              {!isValidDuration && (
                <span className="text-destructive ml-2">(макс. {maxDuration.toFixed(0)}с)</span>
              )}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {formatTime(startTime)} — {formatTime(endTime)}
        </Badge>
      </div>

      {/* Progress indicator for active generation */}
      {sectionProgress.status !== 'idle' && (
        <SectionReplacementProgress
          status={sectionProgress.status}
          progress={sectionProgress.progress}
          message={sectionProgress.message}
          error={sectionProgress.error}
          variants={sectionProgress.variants}
          section={sectionProgress.section}
          onSelectVariant={sectionProgress.selectVariant}
          onRetry={executeReplacement}
          onDismiss={handleProgressDismiss}
        />
      )}

      {/* Preview player */}
      {audioUrl && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={togglePreview}
          >
            {isPreviewPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          <div className="flex-1">
            <p className="text-xs font-medium">Прослушать секцию</p>
            <p className="text-[10px] text-muted-foreground">
              {formatTime(startTime)} — {formatTime(endTime)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (previewAudioRef.current) {
                previewAudioRef.current.currentTime = startTime;
              }
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Quick section selection */}
      {detectedSections.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Выбрать секцию:</label>
          <div className="flex flex-wrap gap-1.5">
            {detectedSections.map((section, idx) => {
              const isActive = Math.abs(section.startTime - startTime) < 1 && Math.abs(section.endTime - endTime) < 1;
              
              // Section styling configuration
              const sectionStyles: Record<DetectedSection['type'], { active: string; inactive: string; dot: string }> = {
                'verse': { 
                  active: 'bg-blue-500/15 border-blue-500 text-blue-400 hover:bg-blue-500/25',
                  inactive: 'border-blue-500/30 hover:border-blue-500/50',
                  dot: 'bg-blue-500'
                },
                'chorus': { 
                  active: 'bg-purple-500/15 border-purple-500 text-purple-400 hover:bg-purple-500/25',
                  inactive: 'border-purple-500/40 hover:border-purple-500/60',
                  dot: 'bg-purple-500'
                },
                'bridge': { 
                  active: 'bg-amber-500/15 border-amber-500 text-amber-400 hover:bg-amber-500/25',
                  inactive: 'border-amber-500/40 hover:border-amber-500/60',
                  dot: 'bg-amber-500'
                },
                'intro': { 
                  active: 'bg-green-500/15 border-green-500 text-green-400 hover:bg-green-500/25',
                  inactive: 'border-green-500/40 hover:border-green-500/60',
                  dot: 'bg-green-500'
                },
                'outro': { 
                  active: 'bg-red-500/15 border-red-500 text-red-400 hover:bg-red-500/25',
                  inactive: 'border-red-500/40 hover:border-red-500/60',
                  dot: 'bg-red-500'
                },
                'pre-chorus': { 
                  active: 'bg-cyan-500/15 border-cyan-500 text-cyan-400 hover:bg-cyan-500/25',
                  inactive: 'border-cyan-500/40 hover:border-cyan-500/60',
                  dot: 'bg-cyan-500'
                },
                'hook': { 
                  active: 'bg-pink-500/15 border-pink-500 text-pink-400 hover:bg-pink-500/25',
                  inactive: 'border-pink-500/40 hover:border-pink-500/60',
                  dot: 'bg-pink-500'
                },
                'instrumental': { 
                  active: 'bg-indigo-500/15 border-indigo-500 text-indigo-400 hover:bg-indigo-500/25',
                  inactive: 'border-indigo-500/40 hover:border-indigo-500/60',
                  dot: 'bg-indigo-500'
                },
                'interlude': { 
                  active: 'bg-teal-500/15 border-teal-500 text-teal-400 hover:bg-teal-500/25',
                  inactive: 'border-teal-500/40 hover:border-teal-500/60',
                  dot: 'bg-teal-500'
                },
                'breakdown': { 
                  active: 'bg-orange-600/15 border-orange-600 text-orange-300 hover:bg-orange-600/25',
                  inactive: 'border-orange-600/40 hover:border-orange-600/60',
                  dot: 'bg-orange-600'
                },
                'drop': { 
                  active: 'bg-red-500/15 border-red-500 text-red-400 hover:bg-red-500/25',
                  inactive: 'border-red-500/40 hover:border-red-500/60',
                  dot: 'bg-red-500'
                },
                'unknown': { 
                  active: 'bg-slate-500/15 border-slate-500 text-slate-300 hover:bg-slate-500/25',
                  inactive: 'border-slate-500/30 hover:border-slate-500/50',
                  dot: 'bg-slate-500'
                },
              };

              const styles = sectionStyles[section.type] || sectionStyles.unknown;
              
              return (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 text-xs gap-1 transition-all border-2",
                    isActive ? styles.active : styles.inactive,
                    isActive && "ring-2 ring-offset-1 ring-offset-background"
                  )}
                  onClick={() => {
                    setCustomRange(section.startTime, section.endTime);
                    // Extract lyrics from aligned words if section has no lyrics
                    if (section.lyrics) {
                      setLyrics(section.lyrics);
                    } else if (lyricsData?.alignedWords) {
                      const tolerance = 0.5;
                      const wordsInRange = lyricsData.alignedWords.filter(w => {
                        const wordMid = (w.startS + w.endS) / 2;
                        return wordMid >= section.startTime - tolerance && wordMid <= section.endTime + tolerance;
                      });
                      if (wordsInRange.length > 0) {
                        const extractedLyrics = wordsInRange.map(w => w.word).join(' ').replace(/\s+/g, ' ').trim();
                        setLyrics(extractedLyrics);
                      }
                    }
                  }}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    styles.dot
                  )} />
                  {section.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Waveform Range Selector */}
      {audioUrl && (
        <WaveformRangeSelector
          audioUrl={audioUrl}
          duration={duration}
          startTime={startTime}
          endTime={endTime}
          onRangeChange={(start, end) => setCustomRange(start, end)}
          onRangeChangeComplete={(start, end) => {
            // When range adjustment completes, update lyrics from words in new range
            if (lyricsData?.alignedWords) {
              const tolerance = 0.3;
              const wordsInRange = lyricsData.alignedWords.filter(w => {
                const wordMid = (w.startS + w.endS) / 2;
                return wordMid >= start - tolerance && wordMid <= end + tolerance;
              });
              if (wordsInRange.length > 0) {
                const newLyrics = wordsInRange.map(w => w.word).join(' ').replace(/\s+/g, ' ').trim();
                setLyrics(newLyrics);
              }
            }
          }}
          onPreviewSeek={(time) => {
            if (previewAudioRef.current) {
              pauseAllStudioAudio();
              previewAudioRef.current.currentTime = time;
              previewAudioRef.current.play();
              setIsPreviewPlaying(true);
            }
          }}
          maxDuration={maxDuration}
          height={isMobile ? 70 : 80}
        />
      )}

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1.5">
        {SECTION_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            size="sm"
            className={cn(
              "h-7 text-xs gap-1 transition-all",
              prompt.includes(preset.prompt) && "bg-primary/10 border-primary/50"
            )}
            onClick={() => addPreset(preset.prompt)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Synchronized Lyrics editor */}
      <SynchronizedSectionLyrics
        words={lyricsData?.alignedWords || []}
        startTime={startTime}
        endTime={endTime}
        currentTime={previewCurrentTime}
        isPlaying={isPreviewPlaying}
        initialLyrics={selectedSection?.lyrics || lyrics}
        onLyricsChange={setLyrics}
        compact={isMobile}
      />

      {/* Prompt input */}
      <div className="space-y-2">
        <label className="text-xs font-medium flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Стилевые указания
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Опишите желаемые изменения... (энергичнее, добавить гитару, мягче)"
          className={cn(
            "min-h-[60px] resize-none",
            "bg-background/50 border-border/50",
            "focus:border-primary/50 focus:ring-primary/20"
          )}
        />
      </div>

      {/* Style tags - collapsible */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            {isAdvancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Стилевые теги
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-1">
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="rock, energetic, guitar"
              className="h-8 text-sm bg-background/50"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Validation warning */}
      {!isValidDuration && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive">
            Секция слишком длинная. Максимум — 50% длительности трека ({maxDuration.toFixed(0)} сек)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button variant="outline" onClick={handleClose} className="flex-1">
          Отмена
        </Button>
        <Button
          onClick={executeReplacement}
          disabled={!isValidDuration || isSubmitting}
          className="flex-1 gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Заменить
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(open) => !open && handleClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b border-border/50 pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              Заменить секцию
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {editorContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: inline panel
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="border-b border-primary/30 bg-gradient-to-r from-primary/5 via-card/80 to-primary/5 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 max-w-2xl mx-auto">
              {editorContent}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="m-2"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
