/**
 * SynchronizedSectionLyrics
 * 
 * Displays section lyrics with synchronized word highlighting
 * Supports edit mode for modifying lyrics
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AlignedWord } from '@/hooks/useTimestampedLyrics';

interface SynchronizedSectionLyricsProps {
  words: AlignedWord[];
  startTime: number;
  endTime: number;
  currentTime: number;
  isPlaying: boolean;
  initialLyrics?: string;
  onLyricsChange: (lyrics: string) => void;
  className?: string;
  compact?: boolean;
}

export function SynchronizedSectionLyrics({
  words,
  startTime,
  endTime,
  currentTime,
  isPlaying,
  initialLyrics,
  onLyricsChange,
  className,
  compact = false,
}: SynchronizedSectionLyricsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Filter words within section range
  const sectionWords = useMemo(() => {
    return words.filter(w => w.startS >= startTime - 0.1 && w.endS <= endTime + 0.1);
  }, [words, startTime, endTime]);

  // Get lyrics text from words or use initial
  const lyricsText = useMemo(() => {
    if (sectionWords.length > 0) {
      return sectionWords.map(w => w.word).join(' ').replace(/\s+/g, ' ').trim();
    }
    return initialLyrics || '';
  }, [sectionWords, initialLyrics]);

  // Update edited text when lyrics change
  useEffect(() => {
    setEditedText(lyricsText);
  }, [lyricsText]);

  // Find active word based on current time
  const activeWordIndex = useMemo(() => {
    if (!isPlaying || currentTime < startTime || currentTime > endTime) {
      return -1;
    }
    return sectionWords.findIndex(w => currentTime >= w.startS && currentTime <= w.endS);
  }, [sectionWords, currentTime, isPlaying, startTime, endTime]);

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current && containerRef.current && !isEditing) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [activeWordIndex, isEditing]);

  const handleStartEdit = () => {
    setEditedText(lyricsText);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onLyricsChange(editedText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(lyricsText);
    setIsEditing(false);
  };

  // Edit mode
  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Введите текст секции..."
          className={cn(
            "font-mono resize-none",
            compact ? "min-h-[80px] text-xs" : "min-h-[120px] text-sm",
            "bg-background/50 border-primary/30 focus:border-primary focus:ring-primary/20"
          )}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            className="h-7 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSaveEdit}
            className="h-7 text-xs"
          >
            <Check className="w-3 h-3 mr-1" />
            Сохранить
          </Button>
        </div>
      </div>
    );
  }

  // Display mode with synchronized words
  return (
    <div className={cn("relative", className)}>
      {/* Header with edit button */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "font-medium text-muted-foreground",
          compact ? "text-[10px]" : "text-xs"
        )}>
          Текст секции
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStartEdit}
          className="h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="w-3 h-3" />
          Изменить
        </Button>
      </div>

      {/* Synchronized words display */}
      <div
        ref={containerRef}
        className={cn(
          "overflow-y-auto rounded-lg border border-border/50 bg-muted/20",
          compact ? "max-h-[80px] p-2" : "max-h-[120px] p-3"
        )}
      >
        {sectionWords.length > 0 ? (
          <div className="flex flex-wrap gap-x-1 gap-y-0.5">
            <AnimatePresence mode="sync">
              {sectionWords.map((word, idx) => {
                const isActive = idx === activeWordIndex;
                const isPast = activeWordIndex > -1 && idx < activeWordIndex;
                
                return (
                  <motion.span
                    key={`${word.word}-${idx}`}
                    ref={isActive ? activeWordRef : undefined}
                    initial={{ opacity: 0.7 }}
                    animate={{
                      opacity: 1,
                      scale: isActive ? 1.05 : 1,
                      color: isActive 
                        ? 'hsl(var(--primary))' 
                        : isPast 
                          ? 'hsl(var(--muted-foreground))' 
                          : 'hsl(var(--foreground))',
                    }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "inline-block transition-all",
                      compact ? "text-xs" : "text-sm",
                      isActive && "font-semibold bg-primary/10 px-1 rounded",
                      isPast && "opacity-60"
                    )}
                  >
                    {word.word}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <p className={cn(
            "text-muted-foreground italic",
            compact ? "text-xs" : "text-sm"
          )}>
            {lyricsText || 'Нет текста для этой секции'}
          </p>
        )}
      </div>

      {/* Changed indicator */}
      {editedText !== lyricsText && editedText !== initialLyrics && (
        <div className="absolute -top-1 -right-1">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        </div>
      )}
    </div>
  );
}
