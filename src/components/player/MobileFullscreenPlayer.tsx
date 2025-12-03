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
  const activeWordRef = useRef<HTMLSpanElement>(null);
  
  const { toggleLike, downloadTrack } = useTracks();
  const { currentTime, duration, seek } = useAudioTime();
  const { isPlaying, playTrack, pauseTrack, nextTrack, previousTrack, repeat, shuffle, toggleRepeat, toggleShuffle } = usePlayerStore();

  const { data: lyricsData } = useTimestampedLyrics(
    track.suno_task_id || null,
    track.suno_id || null
  );

  // Parse lyrics - either timestamped or plain text
  const { alignedWords, plainLyrics } = useMemo(() => {
    if (lyricsData?.alignedWords && lyricsData.alignedWords.length > 0) {
      return { alignedWords: lyricsData.alignedWords as AlignedWord[], plainLyrics: null };
    }
    
    // Try parsing track.lyrics as JSON
    if (track.lyrics) {
      try {
        if (track.lyrics.trim().startsWith('{')) {
          const parsed = JSON.parse(track.lyrics);
          if (parsed.alignedWords && Array.isArray(parsed.alignedWords)) {
            return { alignedWords: parsed.alignedWords as AlignedWord[], plainLyrics: null };
          }
        }
      } catch {
        // Not JSON, treat as plain text
      }
      return { alignedWords: null, plainLyrics: track.lyrics };
    }
    
    return { alignedWords: null, plainLyrics: null };
  }, [lyricsData, track.lyrics]);

  // Find active word index
  const activeWordIndex = useMemo(() => {
    if (!alignedWords) return -1;
    return alignedWords.findIndex(
      word => currentTime >= word.startS && currentTime <= word.endS
    );
  }, [alignedWords, currentTime]);

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current && lyricsContainerRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeWordIndex]);

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
      className="fixed inset-0 z-50 flex flex-col"
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
      <div className="relative flex-1 flex flex-col safe-area-inset">
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
          className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide"
        >
          {alignedWords ? (
            // Synchronized lyrics with word highlighting
            <div className="min-h-full flex flex-col items-center justify-center text-center space-y-1">
              {alignedWords.map((word, index) => {
                const isActive = index === activeWordIndex;
                const isPast = activeWordIndex > -1 && index < activeWordIndex;
                const isFuture = activeWordIndex === -1 || index > activeWordIndex;

                return (
                  <motion.span
                    key={index}
                    ref={isActive ? activeWordRef : null}
                    onClick={() => handleWordClick(word.startS)}
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      opacity: isActive ? 1 : isPast ? 0.5 : 0.7,
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'inline-block px-1 py-0.5 rounded cursor-pointer transition-colors text-xl font-medium',
                      isActive && 'text-primary bg-primary/20',
                      isPast && 'text-muted-foreground',
                      isFuture && 'text-foreground/70'
                    )}
                  >
                    {word.word}{' '}
                  </motion.span>
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
              onClick={() => {
                hapticImpact('light');
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: track.title || 'Track',
                    url: window.location.href,
                  });
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
