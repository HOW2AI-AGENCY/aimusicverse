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
import { X, ListMusic, BarChart3, ChevronLeft, ChevronRight, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WaveformProgressBar } from './WaveformProgressBar';
import { Track } from '@/types/track';
import { useTimestampedLyrics } from '@/hooks/useTimestampedLyrics';
import { useAudioTime } from '@/hooks/audio/useAudioTime';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useGlobalAudioPlayer } from '@/hooks/audio/useGlobalAudioPlayer';
import { useAudioVisualizer } from '@/hooks/audio/useAudioVisualizer';
import { useLyricsSynchronization } from '@/hooks/lyrics/useLyricsSynchronization';
import { useTelegramBackButton } from '@/hooks/telegram/useTelegramBackButton';
import { usePrefetchTrackCovers } from '@/hooks/audio/usePrefetchTrackCovers';
import { usePrefetchNextAudio } from '@/hooks/audio/usePrefetchNextAudio';
import { SynchronizedWord } from '@/components/lyrics/SynchronizedWord';
import { QueueSheet } from './QueueSheet';
import { VersionSwitcher } from './VersionSwitcher';
import { VersionBadge } from './VersionBadge';
import { UnifiedPlayerControls } from './UnifiedPlayerControls';
import { PlayerActionsBar } from './PlayerActionsBar';
import { KaraokeView } from './KaraokeView';
import { DoubleTapSeekFeedback } from './DoubleTapSeekFeedback';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, PanInfo } from '@/lib/motion';
import { hapticImpact } from '@/lib/haptic';
import { logger } from '@/lib/logger';
import '@/styles/lyrics-sync.css';

// Swipe thresholds
const DRAG_CLOSE_THRESHOLD = 100; // px distance for vertical close
const VELOCITY_THRESHOLD = 500;   // px/s velocity for vertical close
const HORIZONTAL_SWIPE_THRESHOLD = 80; // px distance for track switch
const HORIZONTAL_VELOCITY_THRESHOLD = 400; // px/s velocity for track switch

// Double-tap seek constants
const DOUBLE_TAP_DELAY = 300; // ms between taps
const SEEK_AMOUNT = 10; // seconds to seek

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
  const [horizontalDragOffset, setHorizontalDragOffset] = useState(0);
  const [karaokeMode, setKaraokeMode] = useState(false);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const isProgrammaticScrollRef = useRef(false);

  // Telegram BackButton integration - closes fullscreen player
  useTelegramBackButton({
    onClick: onClose,
    visible: true,
  });
  const { currentTime, duration, seek } = useAudioTime();
  const { isPlaying, playTrack, pauseTrack, nextTrack, previousTrack, repeat, shuffle, toggleRepeat, toggleShuffle, volume, preservedTime, clearPreservedTime, queue, currentIndex } = usePlayerStore();
  const { audioElement } = useGlobalAudioPlayer();
  
  // Prefetch covers for smooth transitions
  usePrefetchTrackCovers(queue, currentIndex, { count: 3 });
  
  // Prefetch next audio for instant track switching
  usePrefetchNextAudio(queue, currentIndex, { enabled: true });
  
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
  // With blob URL recovery for format errors
  useEffect(() => {
    let mounted = true;
    let hasRecovered = false;
    
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
          
          const audioSrc = audioElement.src;
          const isBlobSource = audioSrc?.startsWith('blob:');
          const canonicalUrl = track.streaming_url || track.audio_url;
          
          // Try to resume playback
          if (isPlaying && audioElement.paused && audioSrc) {
            logger.info('Attempting to resume audio on mobile fullscreen open', { 
              isBlobSource, 
              src: audioSrc.substring(0, 60) 
            });
            
            try {
              await audioElement.play();
              logger.info('Mobile fullscreen playback resumed successfully');
            } catch (playErr) {
              const error = playErr as Error;
              
              // If blob URL fails with format error, recover with canonical URL
              if ((error.name === 'NotSupportedError' || audioElement.error?.code === 4) && 
                  isBlobSource && canonicalUrl && !hasRecovered) {
                hasRecovered = true;
                logger.info('Blob URL failed, recovering with canonical URL', { 
                  canonicalUrl: canonicalUrl.substring(0, 60) 
                });
                
                const currentTime = preservedTime ?? audioElement.currentTime;
                audioElement.src = canonicalUrl;
                audioElement.load();
                
                // Wait for audio to be ready, then restore position and play
                audioElement.addEventListener('canplay', async function onCanPlay() {
                  audioElement.removeEventListener('canplay', onCanPlay);
                  if (!mounted) return;
                  
                  if (currentTime > 0 && !isNaN(currentTime)) {
                    audioElement.currentTime = currentTime;
                  }
                  clearPreservedTime();
                  
                  try {
                    await audioElement.play();
                    logger.info('Mobile playback recovered successfully after blob error');
                  } catch (retryErr) {
                    logger.error('Mobile recovery play failed', retryErr);
                  }
                }, { once: true });
                
                return;
              }
              
              if (error.name !== 'AbortError') {
                logger.error('Failed to resume audio on mobile fullscreen', playErr);
              }
            }
          }
          
          logger.info('Mobile fullscreen player audio initialized', { 
            volume, 
            isPlaying,
            audioPaused: audioElement.paused,
            hasAudioElement: true,
            isBlobSource
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
  // Enable when we have lyrics (sync works even when paused for highlighting)
  const {
    activeLineIndex,
    activeWordIndex,
    currentTime: syncedTime,
    isWordActive,
    isWordPast,
    constants,
  } = useLyricsSynchronization({
    words: flattenedWords,
    enabled: !!lyricsLines?.length,
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

  // Auto-scroll to active word/line - keep in upper third of screen
  // Works both when playing AND paused (highlighting should persist)
  useEffect(() => {
    if (activeLineIndex < 0 || !lyricsContainerRef.current || userScrolling) return;
    
    // Only auto-scroll when playing, but highlighting still works when paused
    if (!isPlaying) return;
    
    const container = lyricsContainerRef.current;
    
    // Try word-level scroll first for more precision
    const activeWord = container.querySelector(`[data-word-index="${activeWordIndex}"]`) as HTMLElement;
    const activeLine = activeLineRef.current;
    const targetElement = activeWord || activeLine;
    
    if (!targetElement) return;
    
    // Use requestAnimationFrame for smoother scroll timing
    requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const elementRect = targetElement.getBoundingClientRect();
      
      // Calculate where the element currently is relative to container
      const elementTopInContainer = elementRect.top - containerRect.top + container.scrollTop;
      
      // Target: position active element at 30% from top of visible area
      const targetScrollTop = elementTopInContainer - (containerRect.height * 0.3);
      
      // Check if element is already roughly in view (between 20%-50% from top)
      const currentElementPos = elementRect.top - containerRect.top;
      const isInView = currentElementPos > containerRect.height * 0.2 && currentElementPos < containerRect.height * 0.5;
      
      // Only scroll if element is not already in the target area
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
  }, [activeLineIndex, activeWordIndex, userScrolling, isPlaying]);

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

  // Vertical swipe-to-close handler (for header area)
  const handleVerticalDragEnd = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { velocity, offset } = info;
    
    // Close if dragged down far enough or fast enough
    if (offset.y > DRAG_CLOSE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) {
      hapticImpact('light');
      onClose();
    }
  }, [onClose]);

  // Horizontal swipe for track switching (Spotify/Apple Music style)
  const handleHorizontalDragEnd = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { velocity, offset } = info;
    setHorizontalDragOffset(0);
    
    // Swipe left = next track
    if (offset.x < -HORIZONTAL_SWIPE_THRESHOLD || velocity.x < -HORIZONTAL_VELOCITY_THRESHOLD) {
      hapticImpact('medium');
      nextTrack();
      return;
    }
    
    // Swipe right = previous track
    if (offset.x > HORIZONTAL_SWIPE_THRESHOLD || velocity.x > HORIZONTAL_VELOCITY_THRESHOLD) {
      hapticImpact('medium');
      previousTrack();
      return;
    }
  }, [nextTrack, previousTrack]);

  // Track horizontal drag for visual feedback
  const handleHorizontalDrag = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setHorizontalDragOffset(info.offset.x);
  }, []);

  // Double-tap seek handler (like YouTube/TikTok)
  const handleDoubleTapSeek = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (clientX === undefined) return;
    
    const screenWidth = window.innerWidth;
    const isLeftSide = clientX < screenWidth / 2;
    
    // Check for double-tap
    if (now - lastTapRef.current.time < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      e.stopPropagation();
      
      const seekDelta = isLeftSide ? -SEEK_AMOUNT : SEEK_AMOUNT;
      const newTime = Math.max(0, Math.min(currentTime + seekDelta, duration));
      
      seek(newTime);
      hapticImpact('medium');
      
      // Visual feedback
      setDoubleTapSide(isLeftSide ? 'left' : 'right');
      setTimeout(() => setDoubleTapSide(null), 500);
      
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: clientX };
    }
  }, [currentTime, duration, seek]);

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-fullscreen flex flex-col bg-background overflow-hidden"
    >
      {/* Drag Handle Indicator - visual swipe-to-close zone */}
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.5 }}
        onDragEnd={handleVerticalDragEnd}
        className="absolute top-0 left-0 right-0 h-14 z-20 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-manipulation"
        aria-label="Потяните вниз чтобы закрыть"
      >
        {/* Visible drag indicator */}
        <motion.div 
          className="w-12 h-1.5 bg-muted-foreground/40 rounded-full mt-3 shadow-sm"
          whileHover={{ width: 48, backgroundColor: 'hsl(var(--muted-foreground) / 0.6)' }}
          whileTap={{ width: 56, backgroundColor: 'hsl(var(--primary) / 0.6)' }}
          transition={{ duration: 0.2 }}
        />
        <span className="text-[10px] text-muted-foreground/50 mt-1">↓ свайп</span>
      </motion.div>
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
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header with glass effect - Telegram safe area */}
        <motion.header 
          className="flex items-center justify-between p-4"
          style={{
            paddingTop: 'calc(max(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem, env(safe-area-inset-top, 0px) + 0.75rem))'
          }}
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
              aria-label="Закрыть плеер"
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
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <h2 className="font-bold text-lg truncate text-gradient">{track.title || 'Без названия'}</h2>
              <VersionBadge trackId={track.id} size="sm" />
            </div>
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
                aria-label={showVisualizer ? "Скрыть визуализацию" : "Показать визуализацию"}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            </motion.div>
            
            {/* Karaoke mode button */}
            {lyricsLines && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    hapticImpact('light');
                    setKaraokeMode(true);
                  }}
                  className="h-11 w-11 rounded-full bg-background/40 backdrop-blur-md border border-white/10 touch-manipulation hover:bg-background/60 transition-colors"
                  aria-label="Режим караоке"
                >
                  <Mic2 className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
            
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
                aria-label="Открыть очередь"
              >
                <ListMusic className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </motion.header>

        {/* Lyrics Section with Horizontal Swipe and Double-Tap Seek */}
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0.2, right: 0.2 }}
          onDrag={handleHorizontalDrag}
          onDragEnd={handleHorizontalDragEnd}
          onTouchStart={handleDoubleTapSeek}
          className="flex-1 relative min-h-0 flex flex-col touch-pan-y"
        >
          {/* Double-tap seek feedback */}
          <AnimatePresence>
            {doubleTapSide && (
              <DoubleTapSeekFeedback side={doubleTapSide} seekAmount={SEEK_AMOUNT} />
            )}
          </AnimatePresence>
          {/* Swipe indicators */}
          <AnimatePresence>
            {Math.abs(horizontalDragOffset) > 20 && (
              <>
                {horizontalDragOffset > 20 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: Math.min(horizontalDragOffset / HORIZONTAL_SWIPE_THRESHOLD, 1) * 0.6 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                  >
                    <ChevronLeft className="w-8 h-8 text-muted-foreground" />
                  </motion.div>
                )}
                {horizontalDragOffset < -20 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: Math.min(Math.abs(horizontalDragOffset) / HORIZONTAL_SWIPE_THRESHOLD, 1) * 0.6 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                  >
                    <ChevronRight className="w-8 h-8 text-muted-foreground" />
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>

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
              {(() => {
                let globalWordIndex = 0;
                return lyricsLines.map((line, lineIndex) => {
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
                          const currentGlobalIndex = globalWordIndex++;
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
                              data-word-index={currentGlobalIndex}
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
                });
              })()}
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
        </motion.div>

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

        {/* Controls Section with enhanced glass effect - Telegram safe area */}
        <motion.div 
          className="bg-background/50 backdrop-blur-xl border-t border-white/10 p-4 space-y-4"
          style={{
            paddingBottom: 'calc(max(var(--tg-safe-area-inset-bottom, 0px) + 1rem, env(safe-area-inset-bottom, 0px) + 1rem))'
          }}
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

          {/* Main Controls - UnifiedPlayerControls */}
          <UnifiedPlayerControls 
            variant="fullscreen" 
            size="lg"
            showVolume={false}
            showShuffleRepeat={true}
            showSeekButtons={true}
            seekSeconds={10}
          />

          {/* Secondary Actions - PlayerActionsBar */}
          <PlayerActionsBar 
            track={track} 
            variant="horizontal"
            size="md"
            showStudioButton={true}
          />
        </motion.div>
      </div>

      {/* Queue Sheet */}
      <QueueSheet open={queueOpen} onOpenChange={setQueueOpen} />
      
      {/* Karaoke Mode */}
      <AnimatePresence>
        {karaokeMode && lyricsLines && (
          <KaraokeView
            lyricsLines={lyricsLines}
            currentTime={syncedTime}
            isPlaying={isPlaying}
            activeLineIndex={activeLineIndex}
            onClose={() => setKaraokeMode(false)}
            onSeek={handleWordClick}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
