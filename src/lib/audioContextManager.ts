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
 */

import { logger } from './logger';

// Singleton instances
let audioContext: AudioContext | null = null;
let mediaElementSource: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let connectedAudioElement: HTMLAudioElement | null = null;

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
 */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    logger.debug('Attempting to resume AudioContext', { state: ctx.state });
    try {
      await ctx.resume();
      logger.info('✅ AudioContext resumed successfully', { 
        state: ctx.state,
        sampleRate: ctx.sampleRate 
      });
    } catch (err) {
      // Log but don't throw - audio might still work
      logger.error('❌ Failed to resume AudioContext', err instanceof Error ? err : new Error(String(err)));
      throw err; // Re-throw to let caller handle
    }
  } else {
    logger.debug('AudioContext already running', { state: ctx.state });
  }
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
      
      return { analyser: analyserNode, source: mediaElementSource };
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

    return { analyser: analyserNode, source: mediaElementSource };
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
    }
    
    return null;
  }
}

/**
 * Ensure audio is routed to destination for playback
 * Call this to recover from visualizer errors
 */
export function ensureAudioRoutedToDestination(): void {
  if (!mediaElementSource || !analyserNode) {
    return;
  }

  const ctx = getAudioContext();
  
  // Additional check: ensure AudioContext is not suspended
  if (ctx.state === 'suspended') {
    logger.warn('AudioContext is suspended during audio routing check');
    // Try to resume asynchronously (non-blocking)
    void ctx.resume().then(() => {
      logger.info('AudioContext resumed during routing check');
    }).catch((err) => {
      logger.error('Failed to resume AudioContext during routing check', err);
    });
  }
  
  try {
    // Ensure analyser is connected to destination
    analyserNode.connect(ctx.destination);
  } catch (err) {
    // InvalidStateError means already connected, which is fine
    if (err instanceof Error && err.name !== 'InvalidStateError') {
      logger.warn('Failed to connect analyser to destination', err);
      
      // Try direct connection as fallback
      try {
        mediaElementSource.disconnect();
        mediaElementSource.connect(ctx.destination);
        logger.info('✅ Direct audio connection established');
      } catch (reconnectErr) {
        logger.error('Failed to establish direct audio connection', reconnectErr);
      }
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
  
  mediaElementSource = null;
  analyserNode = null;
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
      logger.warn('Error closing AudioContext', err);
    }
  }
  
  // Clear the reference after close completes
  audioContext = null;
  
  logger.info('AudioContext reset complete');
}
