/**
 * Global Audio Provider
 *
 * @description
 * Manages the singleton HTMLAudioElement and synchronizes it with the Zustand player store.
 * This component MUST be mounted at the app root level to ensure a single audio source
 * across the entire application, preventing multiple audio elements from playing simultaneously.
 *
 * @architecture
 * - Single Responsibility: Manages ONE global audio element for the entire app
 * - State Sync: Bi-directional sync between HTML5 Audio API and Zustand store
 * - Performance: Debounced time updates to reduce re-renders (60Hz → ~10Hz)
 * - Caching: Integrates with IndexedDB audio cache for offline playback
 * - Prefetching: Automatically prefetches next tracks in queue
 *
 * @optimizations
 * 1. Debounced time updates: Reduces re-renders from 60fps to ~10fps
 * 2. Audio prefetching: Prefetches next 2 tracks in queue for instant playback
 * 3. Enhanced error handling: User-friendly error messages with recovery options
 * 4. Position persistence: Saves/restores playback position across sessions
 * 5. Startup period suppression: Prevents stale data toasts during initial load
 *
 * @usage
 * ```tsx
 * // App.tsx (root level)
 * function App() {
 *   return (
 *     <GlobalAudioProvider>
 *       <YourApp />
 *     </GlobalAudioProvider>
 *   );
 * }
 *
 * // Anywhere in the app
 * const { activeTrack, isPlaying, play, pause } = usePlayerStore();
 * ```
 *
 * @see {@link usePlayerStore} for the Zustand store API
 * @see {@link useOptimizedAudioPlayer} for the caching/prefetching implementation
 * @see {@link usePlaybackPosition} for position persistence
 *
 * @author MusicVerse AI Team
 * @since 1.0.0
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { setGlobalAudioRef } from '@/hooks/audio/useAudioTime';
import { useOptimizedAudioPlayer } from '@/hooks/audio/useOptimizedAudioPlayer';
import { usePlaybackPosition } from '@/hooks/audio/usePlaybackPosition';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { playerAnalytics, recordError } from '@/lib/telemetry';
import { 
  detectMobileBrowser, 
  isAudioFormatSupported,
  logAudioDiagnostics 
} from '@/lib/audioFormatUtils';

// Audio error messages by error code
const AUDIO_ERROR_MESSAGES: Record<number, { ru: string; action?: string }> = {
  1: { ru: 'Загрузка аудио прервана', action: 'Попробуйте еще раз' },
  2: { ru: 'Сетевая ошибка при загрузке', action: 'Проверьте подключение' },
  3: { ru: 'Ошибка декодирования аудио', action: 'Файл может быть поврежден' },
  4: { ru: 'Формат аудио не поддерживается', action: 'Попробуйте другой трек' },
};

export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  // Suppress errors during initial startup to avoid stale data toasts
  const mountTimeRef = useRef(Date.now());
  const isStartupPeriod = () => Date.now() - mountTimeRef.current < 2000;
  
  // Detect mobile browser for enhanced error handling
  const mobileBrowserInfo = useRef(detectMobileBrowser());
  const isMobileBrowser = mobileBrowserInfo.current.isMobile;

  const {
    activeTrack,
    isPlaying,
    repeat,
    volume,
    pauseTrack,
    nextTrack,
  } = usePlayerStore();

  // Use optimized audio player with caching and prefetch
  const { prefetchNextTracks } = useOptimizedAudioPlayer({
    enablePrefetch: true,
    enableCache: true,
    crossfadeDuration: 0.3,
  });

  // Use playback position persistence
  usePlaybackPosition();

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';

      // CRITICAL: Set initial volume from store
      audioRef.current.volume = volume;
      audioRef.current.muted = false;

      // Log audio element state for debugging
      logger.info('Audio element initialized', {
        volume: audioRef.current.volume,
        muted: audioRef.current.muted,
        readyState: audioRef.current.readyState,
        isMobile: isMobileBrowser,
        browser: mobileBrowserInfo.current.browserName,
        os: mobileBrowserInfo.current.osName,
      });
      
      // Log audio diagnostics for debugging mobile issues
      if (isMobileBrowser) {
        logAudioDiagnostics();
      }

      setGlobalAudioRef(audioRef.current);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        logger.debug('Audio element cleaned up');
      }
    };
  }, []);

  // Sync volume from store to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && volume !== audio.volume) {
      audio.volume = volume;
      logger.debug('Volume synced from store', { volume });
    }
  }, [volume]);

  // Get audio source from track with validation and detailed logging
  const getAudioSource = useCallback(() => {
    if (!activeTrack) {
      logger.debug('No active track');
      return null;
    }

    // Build fallback chain: prefer streaming_url > local_audio_url > audio_url
    // On mobile with format errors, we'll skip blob URLs in favor of canonical URLs
    const sources = [
      { url: activeTrack.local_audio_url, label: 'local_audio_url (blob)' },
      { url: activeTrack.streaming_url, label: 'streaming_url' },
      { url: activeTrack.audio_url, label: 'audio_url' },
    ].filter(s => s.url); // Remove null/undefined sources
    
    // If no sources available, show error
    if (sources.length === 0) {
      logger.warn('Track has no audio source', {
        trackId: activeTrack.id,
        title: activeTrack.title,
        status: activeTrack.status
      });

      // Show user-friendly error
      toast.error('Трек не готов к воспроизведению', {
        description: activeTrack.status === 'processing'
          ? 'Трек еще генерируется, подождите...'
          : 'Файл трека отсутствует'
      });

      return null;
    }
    
    // On mobile devices, proactively check format compatibility
    if (isMobileBrowser) {
      // Filter out sources that are known to be incompatible
      const compatibleSources = sources.filter(s => {
        const url = s.url!;
        
        // Skip blob URLs on mobile if we have canonical URLs available
        // This prevents format errors that would need recovery
        if (url.startsWith('blob:') && sources.length > 1) {
          logger.debug('Skipping blob URL on mobile in favor of canonical URL', {
            trackId: activeTrack.id,
            availableSources: sources.length,
          });
          return false;
        }
        
        // Check format compatibility for non-blob URLs
        if (!url.startsWith('blob:')) {
          const isSupported = isAudioFormatSupported(url);
          if (!isSupported) {
            logger.warn('Audio format may not be supported on mobile', {
              trackId: activeTrack.id,
              url: url.substring(0, 60),
              browser: mobileBrowserInfo.current.browserName,
            });
          }
          return isSupported;
        }
        
        return true;
      });
      
      // If we filtered everything out, use original list (let browser try)
      const finalSources = compatibleSources.length > 0 ? compatibleSources : sources;
      
      // Use first compatible source
      const selectedSource = finalSources[0];
      logger.info('Selected audio source for mobile', {
        trackId: activeTrack.id,
        selectedSource: selectedSource.label,
        url: selectedSource.url!.substring(0, 60),
        totalSources: sources.length,
        compatibleSources: compatibleSources.length,
      });
      
      return selectedSource.url!;
    }
    
    // On desktop, use first available source
    const source = sources[0].url!;

    // Check for valid URL format
    try {
      // For blob URLs, just check prefix
      if (source.startsWith('blob:')) {
        logger.debug('Using blob URL', { trackId: activeTrack.id });
        return source;
      }

      // For data URLs, check format
      if (source.startsWith('data:')) {
        if (source.startsWith('data:audio/')) {
          logger.debug('Using data URL', { trackId: activeTrack.id });
          return source;
        }
        logger.warn('Invalid data URL format', { trackId: activeTrack.id });
        return null;
      }

      // For HTTP(S) URLs, validate
      const url = new URL(source);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        logger.warn('Invalid audio URL protocol', { protocol: url.protocol, trackId: activeTrack.id });
        // Don't show toast during startup to avoid stale data errors
        if (!isStartupPeriod()) {
          toast.error('Неверный формат URL аудио');
        }
        return null;
      }

      logger.debug('Using HTTP(S) URL', {
        trackId: activeTrack.id,
        protocol: url.protocol,
        hostname: url.hostname
      });
      return source;
    } catch (err) {
      logger.error('Invalid audio URL', err instanceof Error ? err : new Error(String(err)), {
        source: source.substring(0, 100),
        trackId: activeTrack.id,
      });
      // Don't show toast during startup to avoid stale data errors
      if (!isStartupPeriod()) {
        toast.error('Ошибка URL аудио', {
          description: 'Неверный формат ссылки на аудиофайл'
        });
      }
      return null;
    }
  }, [activeTrack, isMobileBrowser, mobileBrowserInfo, isStartupPeriod]);

  // Stable ref for isPlaying to avoid effect re-runs
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  
  // Ref to track if we're currently loading a new track
  const isLoadingRef = useRef(false);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Effect for loading new tracks - only triggers on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const source = getAudioSource();
    
    // Handle no source
    if (!source) {
      logger.debug('No source available, clearing audio');
      audio.pause();
      audio.src = '';
      lastTrackIdRef.current = null;
      isLoadingRef.current = false;
      return;
    }

    const trackChanged = activeTrack?.id !== lastTrackIdRef.current;
    
    // Only load if track actually changed
    if (trackChanged) {
      lastTrackIdRef.current = activeTrack?.id || null;
      isLoadingRef.current = true;
      
      logger.debug('Loading new track', { 
        trackId: activeTrack?.id,
        title: activeTrack?.title 
      });
      
      // Cancel any pending play promise
      playPromiseRef.current = null;
      
      // Pause before changing source to prevent conflicts
      audio.pause();
      audio.src = source;
      audio.load();
      
      // Mark loading complete when audio is ready
      const handleCanPlayThrough = () => {
        isLoadingRef.current = false;
        audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      };
      audio.addEventListener('canplaythrough', handleCanPlayThrough);
      
      // Also mark ready on loadeddata for faster response
      const handleLoadedData = () => {
        if (audio.readyState >= 2) {
          isLoadingRef.current = false;
        }
        audio.removeEventListener('loadeddata', handleLoadedData);
      };
      audio.addEventListener('loadeddata', handleLoadedData);
    }
  }, [activeTrack?.id, activeTrack?.title, getAudioSource]);

  // Separate effect for play/pause control - avoids race conditions
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    let isCleanedUp = false;
    let playTimeoutId: NodeJS.Timeout | null = null;

    const attemptPlay = async () => {
      if (isCleanedUp) return;

      // CRITICAL: Wait for loading to complete before playing
      if (isLoadingRef.current) {
        logger.debug('Waiting for audio to load before playing');
        // Wait for loadeddata or canplaythrough
        const waitForLoad = new Promise<void>((resolve) => {
          const checkReady = () => {
            if (!isLoadingRef.current || audio.readyState >= 2) {
              resolve();
              return;
            }
            setTimeout(checkReady, 50);
          };
          checkReady();
        });
        
        await Promise.race([
          waitForLoad,
          new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
        ]);
      }

      // Log detailed audio state before play attempt
      logger.debug('Attempting to play', {
        trackId: activeTrack?.id,
        readyState: audio.readyState,
        volume: audio.volume,
        muted: audio.muted,
        paused: audio.paused,
      });

      // CRITICAL FIX: Sync volume from store
      if (audio.volume !== volume) {
        logger.debug('Syncing volume from store', { storeVolume: volume, audioVolume: audio.volume });
        audio.volume = volume;
      }
      
      // Ensure volume is audible
      if (audio.volume === 0) {
        logger.warn('Volume was 0, setting to store value or 1.0');
        audio.volume = volume > 0 ? volume : 1.0;
      }
      if (audio.muted) {
        logger.warn('Audio was muted, unmuting');
        audio.muted = false;
      }

      // Resume AudioContext
      try {
        const { resumeAudioContext, ensureAudioRoutedToDestination } = await import('@/lib/audioContextManager');
        const contextResumed = await resumeAudioContext(3);
        if (!contextResumed) {
          await ensureAudioRoutedToDestination();
        }
      } catch {
        logger.warn('AudioContext resume issue');
      }

      // Wait for any pending play promise
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // Ignore
        }
        playPromiseRef.current = null;
      }

      try {
        playPromiseRef.current = audio.play();
        await playPromiseRef.current;
        logger.info('Playback started successfully', { trackId: activeTrack?.id });
        playerAnalytics.trackPlay(activeTrack?.id || '', 'global_provider');
      } catch (error: unknown) {
        const err = error as { name?: string };
        if (err.name === 'AbortError' || isCleanedUp) {
          // Ignore abort errors from track changes
          return;
        }
        
        logger.error('Playback failed', error, {
          errorName: err.name,
          trackId: activeTrack?.id,
        });

        if (err.name === 'NotAllowedError') {
          // Don't show toast during startup to avoid stale data errors
          if (!isStartupPeriod()) {
            toast.error('Воспроизведение заблокировано', {
              description: 'Нажмите на экран и попробуйте снова',
            });
          }
        } else if (err.name === 'NotSupportedError') {
          // Don't show toast during startup to avoid stale data errors
          if (!isStartupPeriod()) {
            toast.error('Формат аудио не поддерживается');
          }
        }

        pauseTrack();
      } finally {
        playPromiseRef.current = null;
      }
    };

    if (isPlaying) {
      // Wait for audio to be ready if needed
      if (audio.readyState >= 2 && !isLoadingRef.current) {
        attemptPlay();
      } else {
        const handleCanPlay = () => {
          if (!isCleanedUp && isPlayingRef.current) {
            attemptPlay();
          }
          audio.removeEventListener('canplay', handleCanPlay);
        };
        audio.addEventListener('canplay', handleCanPlay);
        
        // Cleanup timeout to prevent stale handlers
        playTimeoutId = setTimeout(() => {
          audio.removeEventListener('canplay', handleCanPlay);
          // If still not ready after 5s, try anyway
          if (!isCleanedUp && isPlayingRef.current && audio.src) {
            isLoadingRef.current = false;
            attemptPlay();
          }
        }, 5000);

        return () => {
          isCleanedUp = true;
          audio.removeEventListener('canplay', handleCanPlay);
          if (playTimeoutId) clearTimeout(playTimeoutId);
        };
      }
    } else {
      // Cancel any pending play
      if (playPromiseRef.current) {
        playPromiseRef.current = null;
      }
      audio.pause();
    }

    return () => {
      isCleanedUp = true;
      if (playTimeoutId) clearTimeout(playTimeoutId);
    };
  }, [isPlaying, activeTrack?.id, volume, pauseTrack]);

  // Handle track ended and errors with retry logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      logger.debug('Track ended', { trackId: activeTrack?.id });
      playerAnalytics.trackComplete(activeTrack?.id || '', audio.currentTime, audio.duration);
      if (repeat === 'one') {
        // Ensure audio is still available and valid before repeating
        if (audio.src && audio.duration > 0) {
          audio.currentTime = 0;
          // Only play if we're still in playing state
          if (isPlaying) {
            audio.play().catch((err) => {
              logger.warn('Repeat play failed', err);
              // If repeat play fails, try moving to next track
              if (err.name !== 'AbortError') {
                nextTrack();
              }
            });
          }
        } else {
          // Source is invalid, move to next track
          logger.warn('Cannot repeat track: invalid source');
          nextTrack();
        }
      } else {
        nextTrack();
      }
    };

    // Track retry attempts for failed loads
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let retryTimeoutId: NodeJS.Timeout | null = null;

    // Track if we've attempted blob recovery to prevent loops
    let hasAttemptedBlobRecovery = false;
    
    const handleError = () => {
      // Ignore errors when src is empty or not set
      if (!audio.src || audio.src === '' || audio.src === window.location.href) {
        return;
      }
      
      const errorCode = audio.error?.code || 0;
      const errorInfo = AUDIO_ERROR_MESSAGES[errorCode] || { 
        ru: 'Ошибка воспроизведения' 
      };
      
      const isBlobSource = audio.src?.startsWith('blob:');
      const canonicalUrl = activeTrack?.streaming_url || activeTrack?.audio_url;
      
      // Enhanced error context with mobile browser info
      const errorContext = {
        errorCode,
        errorMessage: audio.error?.message,
        trackId: activeTrack?.id,
        title: activeTrack?.title,
        source: audio.src?.substring(0, 100),
        isBlobSource,
        retryCount,
        isMobile: isMobileBrowser,
        browser: mobileBrowserInfo.current.browserName,
        os: mobileBrowserInfo.current.osName,
        readyState: audio.readyState,
        networkState: audio.networkState,
      };
      
      // CRITICAL: Handle format error (code 4) with automatic recovery using fallback chain
      // DO NOT log to Sentry until all recovery attempts fail
      if (errorCode === 4 && !hasAttemptedBlobRecovery) {
        hasAttemptedBlobRecovery = true;
        
        // Build fallback chain with all available audio URLs
        // Step 1: Collect all possible URLs (including local_audio_url)
        const allAudioUrls = [
          activeTrack?.streaming_url,
          activeTrack?.audio_url,
          activeTrack?.local_audio_url,
        ].filter(url => url); // Remove null/undefined
        
        // Step 2: Deduplicate URLs to avoid redundant retry attempts
        const uniqueUrls = Array.from(new Set(allAudioUrls));
        
        // Step 3: Filter out the current failed URL
        let fallbackChain = uniqueUrls.filter(url => url !== audio.src);
        
        // Step 4: CRITICAL FIX - If fallback chain is empty (all URLs are the same),
        // add a cache-busting retry of the original URL
        // This handles cases where streaming_url, audio_url, and local_audio_url all point to the same resource
        let isRetryingSameUrl = false;
        if (fallbackChain.length === 0 && uniqueUrls.length > 0) {
          // Extract the base URL without existing query params
          const baseUrl = uniqueUrls[0]!;
          const urlSeparator = baseUrl.includes('?') ? '&' : '?';
          const cacheBustingUrl = `${baseUrl}${urlSeparator}retry=${Date.now()}`;
          fallbackChain = [cacheBustingUrl];
          isRetryingSameUrl = true;
          
          logger.info('All audio URLs are identical, retrying with cache-busting', {
            trackId: activeTrack?.id,
            originalUrl: baseUrl.substring(0, 60),
            uniqueUrlsCount: uniqueUrls.length,
            isMobile: isMobileBrowser,
          });
        }
        
        if (fallbackChain.length > 0) {
          const fallbackUrl = fallbackChain[0];
          
          // Log recovery attempt (info level, not error)
          logger.info('Format error (code 4), attempting fallback to next URL in chain', {
            ...errorContext,
            currentSource: isBlobSource ? 'blob URL' : 'canonical URL',
            fallbackUrl: fallbackUrl?.substring(0, 60),
            fallbacksRemaining: fallbackChain.length,
            recoveryAttempt: true,
            isRetryingSameUrl,
            strategy: isRetryingSameUrl ? 'cache-busting-retry' : 'alternative-url',
          });
          
          // Save current time before switching source
          const currentTime = audio.currentTime;
          const wasPlaying = isPlaying;
          
          audio.src = fallbackUrl!;
          audio.load();
          
          // Restore position and resume playback when ready
          audio.addEventListener('canplay', async function onCanPlay() {
            audio.removeEventListener('canplay', onCanPlay);
            
            if (currentTime > 0 && !isNaN(currentTime)) {
              audio.currentTime = currentTime;
            }
            
            if (wasPlaying) {
              try {
                await audio.play();
                logger.info('✅ Playback recovered successfully after format error', {
                  trackId: activeTrack?.id,
                  isMobile: isMobileBrowser,
                  fallbackUsed: fallbackUrl?.substring(0, 60),
                  wasRetryingSameUrl: isRetryingSameUrl,
                });
              } catch (playErr) {
                // Recovery failed - NOW log to Sentry
                logger.error('❌ Recovery play after format error failed', playErr, {
                  ...errorContext,
                  fallbackUrl: fallbackUrl?.substring(0, 60),
                  wasRetryingSameUrl: isRetryingSameUrl,
                });
                recordError(`audio:${errorCode}:recovery_failed`, 
                  audio.error?.message || 'Recovery failed after format error', 
                  {
                    ...errorContext,
                    fallbackUrl: fallbackUrl?.substring(0, 60),
                    wasRetryingSameUrl: isRetryingSameUrl,
                  }
                );
              }
            }
          }, { once: true });
          
          return; // Don't show error toast or report to Sentry for recoverable format errors
        } else {
          // No fallbacks available - log to Sentry
          logger.error('❌ Format error (code 4) with no fallback URLs available', null, errorContext);
        }
      }
      
      // Log error with full context
      logger.error('Audio playback error', null, errorContext);
      
      // Record error in telemetry
      playerAnalytics.trackError(activeTrack?.id || '', `audio_error_${errorCode}`);
      recordError(`audio:${errorCode}`, audio.error?.message || 'Unknown audio error', errorContext);
      
      // During startup, suppress toasts to avoid stale data errors
      const suppressToast = isStartupPeriod();
      
      // Retry logic for network errors (code 2)
      if (errorCode === 2 && retryCount < MAX_RETRIES) {
        retryCount++;
        logger.debug(`Retrying audio load (attempt ${retryCount}/${MAX_RETRIES})`);
        
        // Exponential backoff: 1s, 2s, 4s
        const retryDelay = Math.pow(2, retryCount - 1) * 1000;
        
        retryTimeoutId = setTimeout(() => {
          audio.load();
          
          // Attempt to resume playback if it was playing
          if (isPlaying) {
            audio.play().catch((playErr) => {
              logger.warn('Retry play failed', playErr);
            });
          }
          
          if (!suppressToast) {
            toast.info('Повторная попытка загрузки...', {
              description: `Попытка ${retryCount} из ${MAX_RETRIES}`,
            });
          }
        }, retryDelay);
        
        return;
      }
      
      // Max retries reached or non-retryable error
      // Show user-friendly error message (but not during startup)
      if (!suppressToast) {
        toast.error(errorInfo.ru, {
          description: errorInfo.action,
        });
      }
      
      pauseTrack();
      
      // Auto-skip to next track after 2 seconds for better UX
      retryTimeoutId = setTimeout(() => {
        logger.debug('Auto-skipping to next track after error');
        nextTrack();
      }, 2000);
    };

    const handleStalled = async () => {
      logger.warn('Audio playback stalled', { 
        trackId: activeTrack?.id,
        currentTime: audio.currentTime,
        buffered: audio.buffered.length,
      });
      
      // CRITICAL FIX: Wait for any pending play promise before attempting recovery
      // This prevents AbortError: "The play() request was interrupted by a new load request"
      if (playPromiseRef.current) {
        logger.debug('Waiting for pending play promise before stall recovery');
        try {
          await playPromiseRef.current;
        } catch (err) {
          // Ignore errors from the pending play promise
          logger.debug('Pending play promise rejected during stall recovery', err);
        }
        playPromiseRef.current = null;
      }
      
      // Try to recover by reloading
      const currentTime = audio.currentTime;
      audio.load();
      audio.currentTime = currentTime;
      
      if (isPlaying) {
        audio.play().catch((err) => {
          logger.error('Failed to recover from stall', err);
        });
      }
    };

    const handleSuspend = () => {
      logger.debug('Audio loading suspended', { 
        trackId: activeTrack?.id,
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('suspend', handleSuspend);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('suspend', handleSuspend);
      
      // Clear retry timeout on cleanup
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [repeat, nextTrack, pauseTrack, activeTrack, isPlaying]);

  return <>{children}</>;
}
