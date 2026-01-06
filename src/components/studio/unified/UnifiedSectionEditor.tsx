/**
 * UnifiedSectionEditor - Consolidated section editing component
 * 
 * Combines functionality from:
 * - SectionPicker: section selection
 * - SectionSelector: timeline-based region selection
 * - IntegratedSectionEditor: editing UI
 * 
 * Provides a complete section editing experience with detection,
 * selection, and AI-powered replacement.
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  GripVertical, AlertCircle, Check, X, Wand2, Zap,
  ChevronDown, ChevronUp, Tag, MessageSquare, Sparkles, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { DetectedSection } from '@/hooks/useSectionDetection';
import { useSectionEditorStore } from '@/stores/useSectionEditorStore';
import { useSectionReplacement, SECTION_PRESETS } from '@/hooks/useSectionReplacement';
import { SectionPreviewPlayer } from '@/components/stem-studio/SectionPreviewPlayer';

// Section type colors
const SECTION_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  verse: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  chorus: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  bridge: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  intro: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
  outro: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
  'pre-chorus': { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  hook: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
  unknown: { bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground' },
};

interface UnifiedSectionEditorProps {
  trackId: string;
  trackTitle?: string;
  trackTags?: string | null;
  audioUrl?: string | null;
  duration: number;
  currentTime?: number;
  sections?: DetectedSection[];
  maxSectionPercent?: number;
  onSeek?: (time: number) => void;
  onClose?: () => void;
  className?: string;
}

export function UnifiedSectionEditor({
  trackId,
  trackTitle,
  trackTags,
  audioUrl,
  duration,
  currentTime = 0,
  sections = [],
  maxSectionPercent = 50,
  onSeek,
  onClose,
  className,
}: UnifiedSectionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [startTime, setStartTime] = useState(duration * 0.2);
  const [endTime, setEndTime] = useState(duration * 0.4);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const { selectedSection, customRange, editMode, selectSection, setCustomRange, clearSelection } = useSectionEditorStore();

  const maxDuration = (duration * maxSectionPercent) / 100;
  const sectionDuration = endTime - startTime;
  const isValidDuration = sectionDuration <= maxDuration && sectionDuration > 0;

  const {
    prompt,
    setPrompt,
    tags,
    setTags,
    lyrics,
    setLyrics,
    isSubmitting,
    addPreset,
    executeReplacement,
    reset,
  } = useSectionReplacement({
    trackId,
    trackTags,
    duration,
    onSuccess: () => {
      clearSelection();
      onClose?.();
    },
  });

  // Select section from list
  const handleSectionSelect = useCallback((index: number) => {
    setSelectedIndex(index);
    const section = sections[index];
    if (section) {
      setStartTime(section.startTime);
      setEndTime(section.endTime);
      selectSection(section, index);
    }
  }, [sections, selectSection]);

  // Handle drag for region selection
  const getPositionFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, position)) * duration;
  }, [duration]);

  const handleDragStart = (handle: 'start' | 'end') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const newTime = getPositionFromEvent(e);
      if (isDragging === 'start') {
        setStartTime(Math.max(0, Math.min(newTime, endTime - 1)));
      } else {
        setEndTime(Math.min(duration, Math.max(newTime, startTime + 1)));
      }
    };

    const handleEnd = () => {
      setIsDragging(null);
      setCustomRange(startTime, endTime);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, endTime, startTime, duration, getPositionFromEvent, setCustomRange]);

  const handleClose = useCallback(() => {
    reset();
    clearSelection();
    onClose?.();
  }, [reset, clearSelection, onClose]);

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const currentPercent = (currentTime / duration) * 100;

  const isEditorVisible = editMode === 'editing' || selectedIndex !== null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Quick Picker */}
      {sections.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Выберите секцию</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {sections.map((section, idx) => {
                const isSelected = selectedIndex === idx;
                const colors = SECTION_COLORS[section.type] || SECTION_COLORS.unknown;
                const sectionLen = section.endTime - section.startTime;
                const isTooLong = sectionLen > maxDuration;

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSectionSelect(idx)}
                    className={cn(
                      "flex-shrink-0 px-3 py-2 rounded-lg border text-left transition-all min-w-[100px]",
                      "hover:ring-2 hover:ring-primary/50",
                      colors.bg, colors.border, colors.text,
                      isSelected && "ring-2 ring-primary shadow-lg shadow-primary/20"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-xs truncate">{section.label}</span>
                      {isTooLong && <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] opacity-70 font-mono mt-0.5">
                      {formatTime(section.startTime)} — {formatTime(section.endTime)}
                    </p>
                  </motion.button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Timeline Region Selector */}
      <div className="space-y-3">
        {/* Selection Info */}
        <motion.div 
          className="flex items-center justify-between text-sm"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className={cn(
                "px-2.5 py-1 rounded-md font-mono text-sm",
                isValidDuration 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              )}
              animate={{ scale: isDragging ? 1.02 : 1 }}
            >
              {formatTime(startTime)} — {formatTime(endTime)}
            </motion.div>
            <span className="text-muted-foreground text-xs">
              ({formatTime(sectionDuration)})
            </span>
          </div>
          
          <motion.div 
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
              isValidDuration 
                ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                : "bg-destructive/10 text-destructive"
            )}
          >
            {isValidDuration ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Готово к замене</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                <span>Макс. {maxSectionPercent}% ({formatTime(maxDuration)})</span>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Timeline */}
        <div 
          ref={containerRef}
          className="relative h-16 bg-muted/50 rounded-lg overflow-hidden cursor-pointer"
          onClick={(e) => {
            if (isDragging) return;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const time = ((e.clientX - rect.left) / rect.width) * duration;
            onSeek?.(time);
          }}
        >
          {/* Background Grid */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex-1 border-r border-border/30 last:border-r-0" />
            ))}
          </div>

          {/* Selected Region */}
          <motion.div
            className={cn(
              "absolute top-2 bottom-6 rounded",
              isValidDuration 
                ? "bg-primary/30 border-y-2 border-primary" 
                : "bg-destructive/30 border-y-2 border-destructive"
            )}
            style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Handles */}
          <motion.div
            className={cn(
              "absolute w-3 cursor-ew-resize flex items-center justify-center z-10 top-2 bottom-6",
              "bg-primary rounded-l border-2 border-primary-foreground shadow-lg",
              isDragging === 'start' && "ring-2 ring-primary ring-offset-2"
            )}
            style={{ left: `calc(${startPercent}% - 6px)` }}
            onMouseDown={handleDragStart('start')}
            onTouchStart={handleDragStart('start')}
            whileHover={{ scale: 1.1 }}
          >
            <GripVertical className="w-2.5 h-2.5 text-primary-foreground" />
          </motion.div>

          <motion.div
            className={cn(
              "absolute w-3 cursor-ew-resize flex items-center justify-center z-10 top-2 bottom-6",
              "bg-primary rounded-r border-2 border-primary-foreground shadow-lg",
              isDragging === 'end' && "ring-2 ring-primary ring-offset-2"
            )}
            style={{ left: `calc(${endPercent}% - 6px)` }}
            onMouseDown={handleDragStart('end')}
            onTouchStart={handleDragStart('end')}
            whileHover={{ scale: 1.1 }}
          >
            <GripVertical className="w-2.5 h-2.5 text-primary-foreground" />
          </motion.div>

          {/* Playhead */}
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-20"
            style={{ left: `${currentPercent}%` }}
          />

          {/* Time markers */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 py-0.5 text-[10px] text-muted-foreground font-mono">
            <span>0:00</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Editing Panel */}
      <AnimatePresence>
        {isEditorVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border rounded-xl bg-gradient-to-r from-primary/5 via-card/80 to-primary/5 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold text-sm">
                    {selectedIndex !== null ? sections[selectedIndex]?.label : 'Редактор секции'}
                  </h4>
                  <Badge variant="outline" className="text-[10px]">
                    {formatTime(startTime)} — {formatTime(endTime)}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Audio Preview */}
              {audioUrl && (
                <SectionPreviewPlayer
                  audioUrl={audioUrl}
                  startTime={startTime}
                  endTime={endTime}
                  className="bg-muted/30"
                />
              )}

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {SECTION_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-xs gap-1",
                      prompt.includes(preset.prompt) && "bg-primary/10 border-primary/50"
                    )}
                    onClick={() => addPreset(preset.prompt)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Prompt */}
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Опишите желаемые изменения..."
                  className="min-h-[60px] resize-none pr-10 bg-background/50"
                />
                <Sparkles className="absolute right-3 top-3 w-4 h-4 text-muted-foreground/50" />
              </div>

              {/* Advanced Options */}
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground gap-1">
                    {isAdvancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Дополнительно
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Стилевые теги
                    </label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="rock, energetic, guitar"
                      className="h-8 text-sm bg-background/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" />
                      Текст секции
                    </label>
                    <Textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      placeholder="Текст для секции..."
                      className="min-h-[60px] text-sm bg-background/50 resize-none"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={handleClose}>Отмена</Button>
                <Button
                  size="sm"
                  onClick={executeReplacement}
                  disabled={!isValidDuration || isSubmitting}
                  className="gap-2 min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Запуск...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Заменить секцию
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UnifiedSectionEditor;
