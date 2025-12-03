/**
 * Mobile Fullscreen Player
 * 
 * Redesigned fullscreen player optimized for mobile devices.
 * Features:
 * - Blurred album cover background
 * - Synchronized lyrics with word highlighting
 * - Large touch-friendly controls
 * - Clear timeline visualization
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Heart, Download, Share2, ListMusic, SkipBack, SkipForward, Play, Pause, Repeat, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Track } from '@/hooks/useTracksOptimized';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useAudioTime } from '@/hooks/useAudioTime';
import { usePlayerStore } from '@/hooks/usePlayerState';
import { QueueSheet } from './QueueSheet';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticImpact } from '@/lib/haptic';

interface MobileFullscreenPlayerProps {
  track: Track;
  onClose: () => void;
}

interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
}

export function MobileFullscreenPlayer({ track, onClose }: MobileFullscreenPlayerProps) {
  const [queueOpen, setQueueOpen] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  
  const { toggleLike, downloadTrack } = useTracks();
  const { currentTime, duration, seek } = useAudioTime();
  const { isPlaying, playTrack, pauseTrack, nextTrack, previousTrack, repeat, shuffle, toggleRepeat, toggleShuffle } = usePlayerStore();

  const { data: lyricsData } = useTimestampedLyrics(
    track.suno_task_id || null,
    track.suno_id || null
  );

  // Parse lyrics and group into lines
  const { lyricsLines, plainLyrics } = useMemo(() => {
    let words: AlignedWord[] = [];
    
    // Helper to check if word is a structural tag
    const isStructuralTag = (text: string) => {
      return /^\[?(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda)(\s*\d*)?\]?$/i.test(text.trim());
    };
    
    // Helper to clean structural tags from plain text
    const cleanLyrics = (text: string) => {
      return text
        .replace(/\[(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda)(\s*\d*)?\]/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };
    
    if (lyricsData?.alignedWords && lyricsData.alignedWords.length > 0) {
      // Filter out structural tags from aligned words
      words = (lyricsData.alignedWords as AlignedWord[]).filter(w => !isStructuralTag(w.word));
    } else if (track.lyrics) {
      try {
        if (track.lyrics.trim().startsWith('{')) {
          const parsed = JSON.parse(track.lyrics);
          if (parsed.alignedWords && Array.isArray(parsed.alignedWords)) {
            words = (parsed.alignedWords as AlignedWord[]).filter(w => !isStructuralTag(w.word));
          }
        }
      } catch {
        // Not JSON, treat as plain text
        return { lyricsLines: null, plainLyrics: cleanLyrics(track.lyrics) };
      }
      if (words.length === 0) {
        return { lyricsLines: null, plainLyrics: cleanLyrics(track.lyrics) };
      }
    }
    
    if (words.length === 0) {
      return { lyricsLines: null, plainLyrics: null };
    }

    // Group words into lines - detect line breaks or group by ~5-8 words
    const lines: AlignedWord[][] = [];
    let currentLine: AlignedWord[] = [];
    
    words.forEach((word) => {
      // Skip structural tags that might have slipped through
      if (isStructuralTag(word.word)) return;
      
      const hasLineBreak = word.word.includes('\n');
      
      if (hasLineBreak) {
        const parts = word.word.split('\n');
        parts.forEach((part, index) => {
          if (part.trim() && !isStructuralTag(part)) {
            currentLine.push({ ...word, word: part.trim() });
          }
          if (index < parts.length - 1) {
            if (currentLine.length > 0) {
              lines.push([...currentLine]);
              currentLine = [];
            }
          }
        });
      } else if (word.word.trim()) {
        currentLine.push(word);
        
        // Create new line at punctuation or every ~6 words for readability
        const endsWithPunctuation = /[.!?;]$/.test(word.word.trim());
        if (endsWithPunctuation || currentLine.length >= 6) {
          lines.push([...currentLine]);
          currentLine = [];
        }
      }
    });
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return { lyricsLines: lines.length > 0 ? lines : null, plainLyrics: null };
  }, [lyricsData, track.lyrics]);

  // Find active line index
  const activeLineIndex = useMemo(() => {
    if (!lyricsLines) return -1;
    return lyricsLines.findIndex(line => {
      const lineStart = line[0]?.startS ?? 0;
      const lineEnd = line[line.length - 1]?.endS ?? 0;
      return currentTime >= lineStart && currentTime <= lineEnd;
    });
  }, [lyricsLines, currentTime]);

  // Auto-scroll to active line - keep active line in upper third of screen
  useEffect(() => {
    if (activeLineIndex < 0 || !activeLineRef.current || !lyricsContainerRef.current) return;
    
    const container = lyricsContainerRef.current;
    const activeLine = activeLineRef.current;
    
    // Use requestAnimationFrame for smoother scroll timing
    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      
      // Calculate where the line currently is relative to container
      const lineTopInContainer = lineRect.top - containerRect.top + container.scrollTop;
      
      // Target: position active line at 30% from top of visible area
      const targetScrollTop = lineTopInContainer - (containerRect.height * 0.3);
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    });
  }, [activeLineIndex]);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  const handleWordClick = (startTime: number) => {
    hapticImpact('light');
    seek(startTime);
  };

  const handlePlayPause = () => {
    hapticImpact('medium');
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack(track);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-background"
    >
      {/* Blurred Background */}
      <div className="absolute inset-0 overflow-hidden">
        {track.cover_url ? (
          <>
            <img
              src={track.cover_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-3xl"
            />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background" />
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col safe-area-inset min-h-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 pt-safe">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticImpact('light');
              onClose();
            }}
            className="h-11 w-11 rounded-full bg-background/30 backdrop-blur-sm touch-manipulation"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="text-center flex-1 px-4">
            <h2 className="font-semibold text-lg truncate">{track.title || 'Без названия'}</h2>
            <p className="text-sm text-muted-foreground truncate">{track.style || ''}</p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticImpact('light');
              setQueueOpen(true);
            }}
            className="h-11 w-11 rounded-full bg-background/30 backdrop-blur-sm touch-manipulation"
          >
            <ListMusic className="h-5 w-5" />
          </Button>
        </header>

        {/* Lyrics Section */}
        <div 
          ref={lyricsContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            minHeight: 0 // Critical for flex child scrolling
          }}
        >
          {lyricsLines ? (
            // Synchronized lyrics with line grouping and word highlighting
            <div className="flex flex-col items-center text-center space-y-1 pb-[30vh]">
              {lyricsLines.map((line, lineIndex) => {
                const isActiveLine = lineIndex === activeLineIndex;
                const isPastLine = activeLineIndex > -1 && lineIndex < activeLineIndex;
                const lineStart = line[0]?.startS ?? 0;

                return (
                  <motion.div
                    key={lineIndex}
                    ref={isActiveLine ? activeLineRef : null}
                    onClick={() => handleWordClick(lineStart)}
                    animate={{
                      scale: isActiveLine ? 1.02 : 1,
                      opacity: isActiveLine ? 1 : isPastLine ? 0.35 : 0.5,
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'px-3 py-1 rounded-lg cursor-pointer transition-colors w-full',
                      isActiveLine && 'bg-primary/10'
                    )}
                  >
                    <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
                      {line.map((word, wordIndex) => {
                        const isActiveWord = currentTime >= word.startS && currentTime <= word.endS;
                        const isPastWord = currentTime > word.endS;

                        return (
                          <span
                            key={`${lineIndex}-${wordIndex}`}
                            className={cn(
                              'text-lg font-medium transition-all duration-150',
                              isActiveWord && 'text-primary scale-110 font-bold',
                              !isActiveWord && isPastWord && 'text-foreground/70',
                              !isActiveWord && !isPastWord && 'text-foreground/50'
                            )}
                          >
                            {word.word}
                          </span>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : plainLyrics ? (
            // Plain text lyrics
            <div className="min-h-full flex items-center justify-center">
              <p className="text-center text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">
                {plainLyrics}
              </p>
            </div>
          ) : (
            // No lyrics available
            <div className="min-h-full flex items-center justify-center">
              <p className="text-muted-foreground text-center">
                Текст песни недоступен
              </p>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="bg-background/60 backdrop-blur-xl border-t border-border/50 p-4 pb-safe space-y-4">
          {/* Timeline */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                toggleShuffle();
              }}
              className={cn(
                'h-11 w-11 touch-manipulation',
                shuffle && 'text-primary'
              )}
            >
              <Shuffle className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                previousTrack();
              }}
              className="h-12 w-12 touch-manipulation"
            >
              <SkipBack className="h-6 w-6" />
            </Button>

            <Button
              size="icon"
              onClick={handlePlayPause}
              className="h-16 w-16 rounded-full touch-manipulation"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                nextTrack();
              }}
              className="h-12 w-12 touch-manipulation"
            >
              <SkipForward className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                toggleRepeat();
              }}
              className={cn(
                'h-11 w-11 touch-manipulation',
                repeat !== 'off' && 'text-primary'
              )}
            >
              <Repeat className="h-5 w-5" />
              {repeat === 'one' && (
                <span className="absolute text-[10px] font-bold">1</span>
              )}
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                toggleLike({ trackId: track.id, isLiked: track.is_liked || false });
              }}
              className="h-11 w-11 touch-manipulation"
            >
              <Heart className={cn('h-5 w-5', track.is_liked && 'fill-red-500 text-red-500')} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                if (track.audio_url) {
                  downloadTrack({ trackId: track.id, audioUrl: track.audio_url, coverUrl: track.cover_url || undefined });
                }
              }}
              className="h-11 w-11 touch-manipulation"
              disabled={!track.audio_url}
            >
              <Download className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                hapticImpact('light');
                const shareData = {
                  title: track.title || 'Track',
                  text: `🎵 ${track.title || 'Track'} - ${track.style || 'AI Music'}`,
                  url: window.location.href,
                };
                
                // Try native share, fallback to clipboard
                if (navigator.share && navigator.canShare?.(shareData)) {
                  try {
                    await navigator.share(shareData);
                  } catch (error) {
                    // User cancelled or share failed - ignore
                    if ((error as Error).name !== 'AbortError') {
                      console.error('Share failed:', error);
                    }
                  }
                } else {
                  // Fallback: copy link to clipboard
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success('Ссылка скопирована');
                  } catch {
                    toast.error('Не удалось скопировать ссылку');
                  }
                }
              }}
              className="h-11 w-11 touch-manipulation"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Queue Sheet */}
      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </motion.div>
  );
}
