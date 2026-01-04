/**
 * Mobile Fullscreen Player
 * 
 * Redesigned fullscreen player optimized for mobile devices.
 * Features:
 * - Blurred album cover background
 * - Synchronized lyrics with word highlighting (improved sync)
 * - Large touch-friendly controls
 * - Audio visualizer with equalizer
 * - Clear timeline visualization
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Download, Share2, ListMusic, SkipBack, SkipForward, Play, Pause, Repeat, Shuffle, BarChart3, Layers } from 'lucide-react';
import { LikeButton } from '@/components/ui/like-button';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WaveformProgressBar } from './WaveformProgressBar';
import { Track } from '@/types/track';
import { useTracks } from '@/hooks/useTracks';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGlobalAudioPlayer } from '@/hooks/audio/useGlobalAudioPlayer';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { useLyricsSynchronization, SYNC_CONSTANTS, groupWordsIntoLines } from '@/hooks/lyrics/useLyricsSynchronization';
import { SynchronizedWord } from '@/components/lyrics/SynchronizedWord';
import { QueueSheet } from './QueueSheet';
import { VersionSwitcher } from './VersionSwitcher';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { logger } from '@/lib/logger';
import '@/styles/lyrics-sync.css';

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
  const navigate = useNavigate();
  const [queueOpen, setQueueOpen] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const isProgrammaticScrollRef = useRef(false);

  // Open in DAW Studio handler
  const handleOpenInStudio = useCallback(() => {
    hapticImpact('medium');
    onClose();
    navigate(`/studio-v2/track/${track.id}`);
  }, [navigate, track.id, onClose]);
  
  const { toggleLike, downloadTrack } = useTracks();
  const { currentTime, duration, seek } = useAudioTime();
  const { isPlaying, playTrack, pauseTrack, nextTrack, previousTrack, repeat, shuffle, toggleRepeat, toggleShuffle, volume, preservedTime, clearPreservedTime } = usePlayerStore();
  const { audioElement } = useGlobalAudioPlayer();
  
  // Get audio URL for waveform
  const audioUrl = useMemo(() => {
    return track.streaming_url || track.audio_url;
  }, [track.streaming_url, track.audio_url]);
  
  // Restore preserved time on mount (from mode switch)
  useEffect(() => {
    if (preservedTime !== null && audioElement && !isNaN(preservedTime)) {
      // Small delay to ensure audio is ready
      const timer = setTimeout(() => {
        if (audioElement && preservedTime !== null) {
          audioElement.currentTime = preservedTime;
          clearPreservedTime();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [preservedTime, audioElement, clearPreservedTime]);
  
  // CRITICAL: Resume AudioContext and ensure audio routing when fullscreen opens
  // Run only ONCE on mount to avoid multiple re-initializations
  useEffect(() => {
    let mounted = true;
    
    const ensureAudio = async () => {
      if (!audioElement || !mounted) {
        logger.warn('No audio element available on fullscreen open');
        return;
      }
      
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import('@/lib/audioContextManager');
        
        // Resume AudioContext
        const resumed = await resumeAudioContext(3);
        if (!resumed) {
          logger.warn('Failed to resume AudioContext on fullscreen open');
        }
        
        // Ensure audio is routed to destination
        await ensureAudioRoutedToDestination();
        
        // Sync volume with audio element
        if (audioElement && mounted) {
          audioElement.volume = volume;
          
          // CRITICAL: Check if audio source is valid before trying to resume
          const audioSrc = audioElement.src;
          const isValidSource = audioSrc && 
            !audioSrc.startsWith('blob:') && 
            audioSrc.length > 0;
          
          // If we have an invalid blob URL, don't try to play - let the player handle reload
          if (audioSrc?.startsWith('blob:')) {
            logger.info('Skipping resume for blob URL - may be stale', { src: audioSrc.substring(0, 60) });
            return;
          }
          
          // CRITICAL: Resume playback if it was playing but audio got paused
          if (isPlaying && audioElement.paused && isValidSource) {
            logger.info('Resuming paused audio on mobile fullscreen open');
            try {
              await audioElement.play();
            } catch (playErr) {
              // Don't show error toast for expected format issues
              const error = playErr as Error;
              if (error.name !== 'NotSupportedError' && error.name !== 'AbortError') {
                logger.error('Failed to resume audio on mobile fullscreen', playErr);
              }
            }
          }
          
          logger.info('Mobile fullscreen player audio initialized', { 
            volume, 
            isPlaying,
            audioPaused: audioElement.paused,
            hasAudioElement: true,
            hasValidSource: isValidSource
          });
        }
      } catch (err) {
        logger.error('Error initializing fullscreen audio', err);
      }
    };
    
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(ensureAudio, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount
  
  // Audio visualizer data
  const visualizerData = useAudioVisualizer(audioElement, isPlaying, { barCount: 48, smoothing: 0.75 });

  const { data: lyricsData } = useTimestampedLyrics(
    track.suno_task_id || null,
    track.suno_id || null
  );

  // Parse lyrics and group into lines with robust error handling
  const { lyricsLines, plainLyrics, parseError } = useMemo(() => {
    let words: AlignedWord[] = [];
    
    // Helper to check if word is a structural tag
    const isStructuralTag = (text: string) => {
      if (!text || typeof text !== 'string') return false;
      return /^\[?(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda|Куплет|Припев|Бридж|Аутро|Интро)(\s*\d*)?\]?$/i.test(text.trim());
    };
    
    // Helper to clean structural tags from plain text
    const cleanLyrics = (text: string) => {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/\[(Verse|Chorus|Bridge|Outro|Intro|Hook|Pre-Chorus|Post-Chorus|Refrain|Interlude|Break|Solo|Instrumental|Ad-lib|Coda|Куплет|Припев|Бридж|Аутро|Интро)(\s*\d*)?\]/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    };
    
    // Validate aligned word structure
    const isValidAlignedWord = (w: unknown): w is AlignedWord => {
      if (!w || typeof w !== 'object') return false;
      const obj = w as Record<string, unknown>;
      return typeof obj.word === 'string' && 
             typeof obj.startS === 'number' && 
             typeof obj.endS === 'number' &&
             isFinite(obj.startS) && 
             isFinite(obj.endS);
    };
    
    try {
      if (lyricsData?.alignedWords && Array.isArray(lyricsData.alignedWords) && lyricsData.alignedWords.length > 0) {
        // Filter out structural tags and validate words from API response
        words = (lyricsData.alignedWords as unknown[])
          .filter(isValidAlignedWord)
          .filter(w => !isStructuralTag(w.word));
      } else if (track.lyrics) {
        // Try to parse lyrics from track if no API data
        try {
          if (track.lyrics.trim().startsWith('{') || track.lyrics.trim().startsWith('[')) {
            const parsed = JSON.parse(track.lyrics);
            if (parsed?.alignedWords && Array.isArray(parsed.alignedWords)) {
              words = (parsed.alignedWords as unknown[])
                .filter(isValidAlignedWord)
                .filter(w => !isStructuralTag(w.word));
            }
          }
        } catch (jsonErr) {
          // Not JSON or invalid JSON, treat as plain text
          logger.debug('Lyrics not JSON, using as plain text', { error: jsonErr });
          return { lyricsLines: null, plainLyrics: cleanLyrics(track.lyrics), parseError: false };
        }
        
        if (words.length === 0) {
          // No valid aligned words found, use plain text
          return { lyricsLines: null, plainLyrics: cleanLyrics(track.lyrics), parseError: false };
        }
      }
      
      if (words.length === 0) {
        return { lyricsLines: null, plainLyrics: null, parseError: false };
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
      
      return { lyricsLines: lines.length > 0 ? lines : null, plainLyrics: null, parseError: false };
    } catch (err) {
      logger.error('Error parsing lyrics', err);
      // Fallback to plain text on any error
      const fallbackText = track.lyrics ? cleanLyrics(track.lyrics) : null;
      return { lyricsLines: null, plainLyrics: fallbackText, parseError: true };
    }
  }, [lyricsData, track.lyrics]);

  // Flatten words from parsed lines for synchronization hook
  const flattenedWords = useMemo(() => {
    if (!lyricsLines) return [];
    return lyricsLines.flat();
  }, [lyricsLines]);

  // Use unified synchronization hook for precise timing
  // Only enable when playing AND we have lyrics to reduce CPU usage
  const {
    activeLineIndex,
    activeWordIndex,
    currentTime: syncedTime,
    isWordActive,
    isWordPast,
    constants,
  } = useLyricsSynchronization({
    words: flattenedWords,
    enabled: !!lyricsLines?.length && isPlaying,
  });

  // Handle user scroll detection
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Ignore programmatic scrolls
      if (isProgrammaticScrollRef.current) return;
      
      const currentScrollTop = container.scrollTop;
      const scrollDelta = Math.abs(currentScrollTop - lastScrollTopRef.current);
      
      if (scrollDelta > 5) {
        setUserScrolling(true);
        
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Increased timeout to 5 seconds for better UX
        scrollTimeoutRef.current = setTimeout(() => {
          setUserScrolling(false);
        }, 5000);
      }
      
      lastScrollTopRef.current = currentScrollTop;
    };

    const handleTouchStart = () => {
      setUserScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };

    const handleTouchEnd = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Increased timeout to 5 seconds
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, 5000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to active line - keep active line in upper third of screen
  useEffect(() => {
    if (activeLineIndex < 0 || !activeLineRef.current || !lyricsContainerRef.current || userScrolling) return;
    
    // Only scroll when playing
    if (!isPlaying) return;
    
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
      
      // Check if line is already roughly in view
      const currentLinePos = lineRect.top - containerRect.top;
      const isInView = currentLinePos > containerRect.height * 0.2 && currentLinePos < containerRect.height * 0.5;
      
      // Only scroll if line is not already in the target area
      if (!isInView) {
        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        });
        
        // Reset programmatic flag after scroll completes
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 400);
      }
    });
  }, [activeLineIndex, userScrolling, isPlaying]);

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
      // Don't pass track to avoid reloading audio - just resume
      playTrack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 z-[90] flex flex-col bg-background overflow-hidden"
    >
      {/* Animated Blurred Background */}
      <div className="absolute inset-0 overflow-hidden">
        {track.cover_url ? (
          <>
            {/* Primary blurred cover */}
            <motion.img
              src={track.cover_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-3xl"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ 
                scale: [1.1, 1.15, 1.1],
                opacity: 1 
              }}
              transition={{ 
                scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
                opacity: { duration: 0.5 }
              }}
            />
            {/* Secondary pulsing glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-background"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
            
            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-primary/20"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/10 to-background"
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] 
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col safe-area-inset min-h-0 overflow-hidden">
        {/* Header with glass effect */}
        <motion.header 
          className="flex items-center justify-between p-4 pt-safe"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                hapticImpact('light');
                onClose();
              }}
              className="h-11 w-11 rounded-full bg-background/40 backdrop-blur-md border border-white/10 touch-manipulation hover:bg-background/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
          
          <motion.div 
            className="text-center flex-1 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-bold text-lg truncate text-gradient">{track.title || 'Без названия'}</h2>
            <p className="text-sm text-muted-foreground truncate">{track.style || ''}</p>
            {/* Version Switcher */}
            <div className="flex justify-center mt-2">
              <VersionSwitcher track={track} size="compact" />
            </div>
          </motion.div>
          
          <div className="flex items-center gap-2">
            {/* Visualizer toggle */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  setShowVisualizer(prev => !prev);
                }}
                className={cn(
                  'h-11 w-11 rounded-full bg-background/40 backdrop-blur-md border border-white/10 touch-manipulation hover:bg-background/60 transition-colors',
                  showVisualizer && 'bg-primary/20 border-primary/30'
                )}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            </motion.div>
            
            {/* Queue button */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  setQueueOpen(true);
                }}
                className="h-11 w-11 rounded-full bg-background/40 backdrop-blur-md border border-white/10 touch-manipulation hover:bg-background/60 transition-colors"
              >
                <ListMusic className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </motion.header>

        {/* Lyrics Section */}
        <div className="flex-1 relative min-h-0 flex flex-col">
          {/* User scroll indicator with re-enable button */}
          <AnimatePresence>
            {userScrolling && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-2 right-2 z-10 flex items-center gap-2"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUserScrolling(false)}
                  className="h-7 px-2 text-xs bg-muted/90 backdrop-blur-sm"
                >
                  Вкл. автоскролл
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <div 
            ref={lyricsContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ 
              overscrollBehavior: 'contain',
              touchAction: 'pan-y',
            }}
          >
          {lyricsLines ? (
            // Synchronized lyrics with improved timing using useLyricsSynchronization
            <div className="flex flex-col items-center text-center space-y-1 pb-[30vh] lyrics-container-enter">
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
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={cn(
                      'px-3 py-1 rounded-lg cursor-pointer w-full lyric-line',
                      'will-change-[transform,opacity,background-color] transform-gpu',
                      isActiveLine && 'bg-primary/10 lyric-line--active'
                    )}
                  >
                    <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
                      {line.map((word, wordIndex) => {
                        // Use sync hook's look-ahead timing
                        const adjustedTime = syncedTime + constants.WORD_LOOK_AHEAD_MS / 1000;
                        const endTolerance = constants.WORD_END_TOLERANCE_MS / 1000;
                        const isActiveWord = isActiveLine && adjustedTime >= word.startS && adjustedTime <= word.endS + endTolerance;
                        const isPastWord = syncedTime > word.endS + endTolerance;

                        return (
                          <SynchronizedWord
                            key={`${lineIndex}-${wordIndex}-${word.startS}`}
                            word={word.word}
                            isActive={isActiveWord}
                            isPast={isPastWord}
                            className="text-lg font-medium"
                            activeClassName="text-primary scale-110 font-bold"
                            pastClassName="text-foreground/70"
                            futureClassName="text-foreground/50"
                          />
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
        </div>

        {/* Audio Visualizer Section */}
        <AnimatePresence>
          {showVisualizer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden"
            >
              <div className="px-4 py-3 bg-gradient-to-t from-background/80 to-transparent">
                {/* Fallback indicator */}
                {visualizerData.isFallback && (
                  <div className="text-[10px] text-muted-foreground/50 text-center mb-1">
                    Визуализация недоступна
                  </div>
                )}
                {/* Visualizer bars */}
                <div className="flex items-end justify-center gap-[2px] h-16">
                  {visualizerData.frequencies.map((freq, index) => {
                    const isCenter = Math.abs(index - visualizerData.frequencies.length / 2) < 8;
                    const heightPercent = Math.max(8, freq * 100);
                    // Reduce opacity for fallback visualization
                    const baseOpacity = visualizerData.isFallback ? 0.4 : 0.6;
                    
                    return (
                      <motion.div
                        key={index}
                        className="rounded-full"
                        style={{
                          width: isCenter ? '3px' : '2px',
                          backgroundColor: `hsl(var(--primary) / ${0.3 + freq * 0.7})`,
                          boxShadow: !visualizerData.isFallback && freq > 0.6 ? `0 0 8px hsl(var(--primary) / 0.5)` : 'none',
                        }}
                        animate={{
                          height: `${heightPercent}%`,
                          opacity: isPlaying ? baseOpacity + freq * 0.4 : 0.3,
                        }}
                        transition={{ duration: 0.05 }}
                      />
                    );
                  })}
                </div>
                
                {/* Visualizer average indicator */}
                <motion.div
                  className="mt-2 mx-auto h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{
                    width: `${30 + visualizerData.average * 70}%`,
                    opacity: isPlaying ? (visualizerData.isFallback ? 0.3 : 0.4) + visualizerData.average * 0.6 : 0.2,
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Section with enhanced glass effect */}
        <motion.div 
          className="bg-background/50 backdrop-blur-xl border-t border-white/10 p-4 pb-safe space-y-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Waveform Timeline */}
          <WaveformProgressBar
            audioUrl={audioUrl}
            trackId={track.id}
            currentTime={currentTime}
            duration={duration}
            onSeek={(time) => seek(time)}
            mode="standard"
            showBeatGrid={true}
            showLabels={true}
            className="px-2"
          />

          {/* Main Controls with animations */}
          <div className="flex items-center justify-center gap-6">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  toggleShuffle();
                }}
                className={cn(
                  'h-11 w-11 touch-manipulation rounded-full transition-all',
                  shuffle && 'text-primary bg-primary/10'
                )}
              >
                <Shuffle className="h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  previousTrack();
                }}
                className="h-12 w-12 touch-manipulation rounded-full hover:bg-white/10"
              >
                <SkipBack className="h-6 w-6" />
              </Button>
            </motion.div>

            {/* Main play button with glow */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
                animate={isPlaying ? { 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.2, 0.5]
                } : { scale: 1, opacity: 0.3 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Button
                size="icon"
                onClick={handlePlayPause}
                className="relative h-16 w-16 rounded-full touch-manipulation bg-primary shadow-lg shadow-primary/30 hover:bg-primary/90"
              >
                <AnimatePresence mode="wait">
                  {isPlaying ? (
                    <motion.div
                      key="pause"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Pause className="h-8 w-8" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ scale: 0, rotate: 90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Play className="h-8 w-8 ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  nextTrack();
                }}
                className="h-12 w-12 touch-manipulation rounded-full hover:bg-white/10"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  toggleRepeat();
                }}
                className={cn(
                  'h-11 w-11 touch-manipulation rounded-full relative transition-all',
                  repeat !== 'off' && 'text-primary bg-primary/10'
                )}
              >
                <Repeat className="h-5 w-5" />
                {repeat === 'one' && (
                  <span className="absolute text-[10px] font-bold">1</span>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Secondary Actions with hover effects */}
          <div className="flex items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <LikeButton
                trackId={track.id}
                likesCount={track.likes_count || 0}
                showCount={true}
                size="lg"
                className="h-11 w-11"
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  hapticImpact('light');
                  if (track.audio_url) {
                    downloadTrack({ trackId: track.id, audioUrl: track.audio_url, coverUrl: track.cover_url || undefined });
                  }
                }}
                className="h-11 w-11 touch-manipulation rounded-full hover:bg-white/10"
                disabled={!track.audio_url}
              >
                <Download className="h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenInStudio}
                className="h-11 w-11 touch-manipulation rounded-full hover:bg-white/10"
                title="Открыть в DAW Studio"
              >
                <Layers className="h-5 w-5" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
                  
                  if (navigator.share && navigator.canShare?.(shareData)) {
                    try {
                      await navigator.share(shareData);
                    } catch (error) {
                      if ((error as Error).name !== 'AbortError') {
                        logger.error('Share failed', { error });
                      }
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success('Ссылка скопирована');
                    } catch {
                      toast.error('Не удалось скопировать ссылку');
                    }
                  }
                }}
                className="h-11 w-11 touch-manipulation rounded-full hover:bg-white/10"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Queue Sheet */}
      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
    </motion.div>
  );
}
