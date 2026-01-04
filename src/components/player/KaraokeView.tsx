/**
 * Karaoke View Component
 * 
 * Fullscreen karaoke mode with enlarged text and word fill animation
 * Similar to Apple Music Sing
 */

import { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KaraokeWord } from '@/components/lyrics/KaraokeWord';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

interface KaraokeViewProps {
  lyricsLines: Array<AlignedWord[]> | null;
  currentTime: number;
  isPlaying: boolean;
  activeLineIndex: number;
  onClose: () => void;
  onSeek: (time: number) => void;
}

export function KaraokeView({
  lyricsLines,
  currentTime,
  isPlaying,
  activeLineIndex,
  onClose,
  onSeek,
}: KaraokeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Show only 3 lines: previous, current, next
  const visibleLines = useMemo(() => {
    if (!lyricsLines) return [];
    
    const start = Math.max(0, activeLineIndex - 1);
    const end = Math.min(lyricsLines.length, activeLineIndex + 2);
    
    return lyricsLines.slice(start, end).map((line, idx) => ({
      line,
      originalIndex: start + idx,
      isActive: start + idx === activeLineIndex,
      isPast: start + idx < activeLineIndex,
    }));
  }, [lyricsLines, activeLineIndex]);

  // Auto-scroll when line changes
  useEffect(() => {
    if (!containerRef.current) return;
    // Content is centered, no need to scroll
  }, [activeLineIndex]);

  if (!lyricsLines) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      >
        <p className="text-white/50">Текст песни недоступен</p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            hapticImpact('light');
            onClose();
          }}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-md"
        >
          <X className="h-5 w-5 text-white" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      style={{
        paddingTop: 'calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)))',
        paddingBottom: 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))'
      }}
    >
      {/* Minimal header */}
      <div className="absolute top-4 right-4 z-10" style={{
        marginTop: 'calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px), env(safe-area-inset-top, 0px)))'
      }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            hapticImpact('light');
            onClose();
          }}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20"
        >
          <X className="h-5 w-5 text-white" />
        </Button>
      </div>
      
      {/* Karaoke lyrics */}
      <div 
        ref={containerRef}
        className="flex-1 flex flex-col justify-center items-center px-6 overflow-hidden"
      >
        <AnimatePresence mode="popLayout">
          {visibleLines.map(({ line, originalIndex, isActive, isPast }) => (
            <motion.div
              key={originalIndex}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{
                opacity: isActive ? 1 : isPast ? 0.3 : 0.5,
                y: 0,
                scale: isActive ? 1 : 0.85,
              }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'flex flex-wrap justify-center gap-x-2 gap-y-1 mb-8 cursor-pointer',
                isActive ? 'text-4xl font-bold' : 'text-2xl font-medium'
              )}
              onClick={() => line[0] && onSeek(line[0].startS)}
            >
              {line.map((word, wordIndex) => (
                <KaraokeWord
                  key={`${originalIndex}-${wordIndex}`}
                  word={word.word}
                  startTime={word.startS}
                  endTime={word.endS}
                  currentTime={currentTime}
                  isPlaying={isPlaying && isActive}
                  onClick={() => onSeek(word.startS)}
                  className={isActive ? 'text-4xl' : 'text-2xl'}
                  activeColor="hsl(var(--primary))"
                  inactiveColor="rgba(255,255,255,0.4)"
                  pastColor="rgba(255,255,255,0.7)"
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Karaoke mode indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50"
        style={{
          marginBottom: 'calc(max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px)))'
        }}
      >
        <Mic2 className="w-4 h-4" />
        <span className="text-sm">Режим караоке</span>
      </motion.div>
    </motion.div>
  );
}
