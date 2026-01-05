/**
 * Unified AudioContext Manager
 * 
 * Manages a single global AudioContext and MediaElementSource to prevent conflicts.
 * 
 * CRITICAL: createMediaElementSource() can only be called ONCE per audio element.
 * Multiple calls will throw an error and break audio playback.
 * 
 * This module ensures:
 * 1. Only one AudioContext exists
 * 2. Only one MediaElementSource per audio element
 * 3. Proper connection to destination for audio playback
 * 4. Graceful handling of visualizer failures (audio continues to work)
 * 5. Mobile-specific AudioContext handling for better reliability
 */

import { logger } from '@/lib/logger';
import { detectMobileBrowser } from '@/lib/audioFormatUtils';

type AudioElementWithSourceFlag = HTMLAudioElement & { __hasMediaSource?: boolean };

// Singleton instances
let audioContext: AudioContext | null = null;
let mediaElementSource: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let connectedAudioElement: AudioElementWithSourceFlag | null = null;
let audioNodesResult: AudioNodesResult | null = null;

/**
 * Get or create the global AudioContext
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    logger.debug('AudioContext created', { 
      state: audioContext.state,
      sampleRate: audioContext.sampleRate 
    });
  }
  return audioContext;
}

/**
 * Resume the AudioContext if it's suspended
 * MUST be called on user interaction for browser autoplay policy
 * MUST be awaited to prevent race conditions
 * 
 * Enhanced with retry logic and mobile-specific handling for reliability
 */
export async function resumeAudioContext(maxRetries: number = 3): Promise<boolean> {
  const ctx = getAudioContext();
  
  if (ctx.state === 'running') {
    logger.debug('AudioContext already running', { state: ctx.state });
    return true;
  }

  if (ctx.state === 'closed') {
    logger.error('AudioContext is closed, cannot resume');
    return false;
  }
  
  // Detect if we're on mobile for enhanced handling
  const mobileInfo = detectMobileBrowser();
  const isMobile = mobileInfo.isMobile;
  
  logger.debug('Attempting to resume AudioContext', { 
    state: ctx.state,
    isMobile,
    browser: mobileInfo.browserName,
    os: mobileInfo.osName,
  });
  
  // On mobile, use longer retry delays and more attempts
  const retryDelay = isMobile ? 150 : 100;
  const effectiveMaxRetries = isMobile ? Math.max(maxRetries, 5) : maxRetries;
  
  for (let attempt = 1; attempt <= effectiveMaxRetries; attempt++) {
    try {
      await ctx.resume();
      
      // Double-check state after resume - cast to avoid TypeScript narrowing issue
      // (state can change to 'running' after resume() completes)
      const currentState = ctx.state as AudioContextState;
      if (currentState === 'running') {
        logger.info('✅ AudioContext resumed successfully', { 
          attempt,
          state: currentState,
          sampleRate: ctx.sampleRate,
          isMobile,
        });
        return true;
      }
      
      logger.warn('AudioContext resume called but state not running', { 
        state: ctx.state, 
        attempt,
        isMobile,
      });
      
      // Wait before retry (longer on mobile)
      if (attempt < effectiveMaxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    } catch (err) {
      logger.error(`❌ Failed to resume AudioContext (attempt ${attempt}/${effectiveMaxRetries})`, 
        err instanceof Error ? err : new Error(String(err)),
        { isMobile, browser: mobileInfo.browserName }
      );
      
      if (attempt < effectiveMaxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  logger.error('AudioContext resume failed after all retries', { 
    state: ctx.state,
    maxRetries: effectiveMaxRetries,
    isMobile,
    browser: mobileInfo.browserName,
  });
  return false;
}

/**
 * Get the current AudioContext state
 */
export function getAudioContextState(): AudioContextState | null {
  return audioContext?.state || null;
}

interface AudioNodesResult {
  analyser: AnalyserNode;
  source: MediaElementAudioSourceNode;
}

/**
 * Get or create audio nodes for the given audio element
 * This handles the MediaElementSource singleton pattern
 * 
 * @param audioElement The HTMLAudioElement to connect
 * @param fftSize FFT size for the analyser (default: 128)
 * @param smoothing Smoothing time constant (default: 0.8)
 * @returns Audio nodes or null if setup fails (audio will still work)
 */
export async function getOrCreateAudioNodes(
  audioElement: HTMLAudioElement,
  fftSize: number = 128,
  smoothing: number = 0.8
): Promise<AudioNodesResult | null> {
  try {
    const ctx = getAudioContext();

    // CRITICAL: Ensure AudioContext is resumed BEFORE creating any nodes
    if (ctx.state === 'suspended') {
      logger.debug('AudioContext suspended, resuming before creating nodes...');
      try {
        await ctx.resume();
        logger.debug('AudioContext resumed before node creation', { state: ctx.state });
      } catch (err) {
        logger.error('Failed to resume AudioContext before node creation', err);
        // If we have an existing connection, ensure it's routed to destination
        if (mediaElementSource && connectedAudioElement === audioElement) {
          ensureAudioRoutedToDestination();
          return analyserNode && mediaElementSource ? { analyser: analyserNode, source: mediaElementSource } : null;
        }
        return null;
      }
    }

    // If we already have a connection to this audio element, reuse it
    if (connectedAudioElement === audioElement && mediaElementSource && analyserNode) {
      logger.debug('Reusing existing audio connection', { 
        contextState: ctx.state,
        elementSrc: audioElement.src?.substring(0, 50) 
      });
      
      // Ensure the connection is still valid
      ensureAudioRoutedToDestination();
      
      // Update analyser settings
      analyserNode.fftSize = fftSize;
      analyserNode.smoothingTimeConstant = smoothing;
      
      if (audioNodesResult) {
        // Reuse the same result object to keep references stable for callers/tests
        return audioNodesResult;
      }
      
      audioNodesResult = { analyser: analyserNode, source: mediaElementSource };
      return audioNodesResult;
    }

    // If connected to a different element, we cannot reconnect (Web Audio limitation)
    if (connectedAudioElement && connectedAudioElement !== audioElement) {
      logger.warn('Audio visualizer already connected to different element', {
        currentSrc: connectedAudioElement.src?.substring(0, 50),
        requestedSrc: audioElement.src?.substring(0, 50)
      });
      return null;
    }

    // Create new connection
    logger.debug('Creating new audio nodes', { src: audioElement.src?.substring(0, 50) });
    
    // Create analyser node
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = fftSize;
    analyserNode.smoothingTimeConstant = smoothing;

    // Create media element source
    // CRITICAL: This call disconnects the audio element from its default output!
    // From this point, we MUST route audio through Web Audio API
    try {
      mediaElementSource = ctx.createMediaElementSource(audioElement);
      connectedAudioElement = audioElement;
      logger.debug('MediaElementSource created', { src: audioElement.src?.substring(0, 50) });
    } catch (err) {
      if (err instanceof Error && err.message.includes('already been attached')) {
        logger.warn('Audio element already has a MediaElementSource attached');
        // If we somehow lost track but source exists, we can't recover
        // Return null to use fallback visualization
        analyserNode = null;
        return null;
      }
      throw err;
    }

    // Connect the audio pipeline: source -> analyser -> destination
    // CRITICAL: Both connections must succeed or audio will be silent!
    mediaElementSource.connect(analyserNode);
    analyserNode.connect(ctx.destination);
    
    logger.info('✅ Audio pipeline connected successfully', {
      contextState: ctx.state,
      fftSize,
      smoothing
    });

    // Final check: ensure context is actually running
    if (ctx.state !== 'running') {
      logger.warn('AudioContext not running after connection, attempting final resume...');
      try {
        await ctx.resume();
        logger.info('✅ AudioContext resumed after connection', { state: ctx.state });
      } catch (err) {
        logger.error('Failed to resume AudioContext after connection - audio may be silent!', err);
      }
    }

    audioNodesResult = { analyser: analyserNode, source: mediaElementSource };
    return audioNodesResult;
  } catch (error) {
    logger.error('Failed to create audio nodes', error instanceof Error ? error : new Error(String(error)));
    
    // Emergency: if we created a source but connection failed, reconnect to destination
    if (mediaElementSource) {
      try {
        logger.warn('Emergency: reconnecting audio directly to destination');
        mediaElementSource.disconnect();
        mediaElementSource.connect(getAudioContext().destination);
        logger.info('✅ Emergency reconnection successful - audio should work without visualizer');
      } catch (reconnectErr) {
        logger.error('❌ Emergency reconnection failed - audio will be silent!', reconnectErr);
      }
    }
    
    // Clean up failed state
    if (!mediaElementSource || !analyserNode) {
      analyserNode = null;
      mediaElementSource = null;
      connectedAudioElement = null;
      audioNodesResult = null;
    }
    
    return null;
  }
}

/**
 * Ensure audio is routed to destination for playback
 * Call this to recover from visualizer errors
 */
/**
 * Ensure audio is routed to destination for playback
 * Call this to recover from visualizer errors
 * 
 * Enhanced with automatic AudioContext resume and connection verification
 */
export async function ensureAudioRoutedToDestination(): Promise<boolean> {
  const ctx = getAudioContext();
  
  // First, ensure AudioContext is running
  if (ctx.state === 'suspended') {
    logger.warn('AudioContext is suspended during audio routing check');
    const resumed = await resumeAudioContext(2);
    if (!resumed) {
      logger.error('Failed to resume AudioContext during routing - audio may be silent');
      // Continue anyway to try to establish connection
    }
  }

  // If no media element source exists, we can't do much
  if (!mediaElementSource) {
    logger.debug('No mediaElementSource exists for routing');
    return ctx.state === 'running';
  }
  
  try {
    // Try to connect analyser to destination if it exists
    if (analyserNode) {
      try {
        analyserNode.connect(ctx.destination);
      } catch (err) {
        // InvalidStateError means already connected, which is fine
        if (err instanceof Error && err.name !== 'InvalidStateError') {
          throw err;
        }
      }
    } else {
      // No analyser, connect source directly to destination
      try {
        mediaElementSource.connect(ctx.destination);
        logger.info('✅ Direct audio connection established (no analyser)');
      } catch (err) {
        if (err instanceof Error && err.name !== 'InvalidStateError') {
          throw err;
        }
      }
    }
    
    return ctx.state === 'running';
  } catch (err) {
    logger.warn('Failed to connect to destination, attempting recovery', { error: err });
    
    // Emergency fallback: reconnect source directly
    try {
      mediaElementSource.disconnect();
      mediaElementSource.connect(ctx.destination);
      logger.info('✅ Emergency direct audio connection established');
      return ctx.state === 'running';
    } catch (reconnectErr) {
      logger.error('❌ Failed to establish audio connection - audio will be silent!', reconnectErr);
      return false;
    }
  }
}

/**
 * Get the current analyser node (if exists)
 */
export function getAnalyserNode(): AnalyserNode | null {
  return analyserNode;
}

/**
 * Get the current media element source (if exists)
 */
export function getMediaElementSource(): MediaElementAudioSourceNode | null {
  return mediaElementSource;
}

/**
 * Check if an audio element is connected
 */
export function isAudioElementConnected(audioElement: HTMLAudioElement): boolean {
  return connectedAudioElement === audioElement;
}

/**
 * Get diagnostic information about the audio system
 * Useful for debugging player issues
 */
export function getAudioSystemDiagnostics(): {
  hasAudioContext: boolean;
  audioContextState: AudioContextState | null;
  hasMediaElementSource: boolean;
  hasAnalyserNode: boolean;
  connectedElementSrc: string | null;
  sampleRate: number | null;
} {
  return {
    hasAudioContext: audioContext !== null,
    audioContextState: audioContext?.state || null,
    hasMediaElementSource: mediaElementSource !== null,
    hasAnalyserNode: analyserNode !== null,
    connectedElementSrc: connectedAudioElement?.src || null,
    sampleRate: audioContext?.sampleRate || null,
  };
}

/**
 * Clean up audio nodes (use with caution!)
 * Only call this when you're sure no component needs the audio connection
 */
export function disconnectAudio(): void {
  logger.debug('Disconnecting audio nodes');
  
  if (mediaElementSource) {
    try {
      mediaElementSource.disconnect();
    } catch (err) {
      // Ignore disconnect errors
    }
  }
  
  if (analyserNode) {
    try {
      analyserNode.disconnect();
    } catch (err) {
      // Ignore disconnect errors
    }
  }
  
  if (connectedAudioElement) {
    connectedAudioElement.__hasMediaSource = false;
  }
  
  mediaElementSource = null;
  analyserNode = null;
  audioNodesResult = null;
  connectedAudioElement = null;
}

/**
 * Reset the entire audio context (nuclear option)
 * Use this only when recovering from catastrophic errors
 */
export async function resetAudioContext(): Promise<void> {
  logger.warn('Resetting AudioContext - this will interrupt playback!');
  
  // Disconnect audio nodes synchronously first
  disconnectAudio();
  
  // Then close AudioContext (which is async)
  if (audioContext) {
    try {
      // Wait for close to complete before clearing reference
      await audioContext.close();
      logger.debug('AudioContext closed successfully');
    } catch (err) {
      logger.warn('Error closing AudioContext', { error: err });
    }
  }
  
  // Clear the reference after close completes
  audioContext = null;
  
  logger.info('AudioContext reset complete');
}
