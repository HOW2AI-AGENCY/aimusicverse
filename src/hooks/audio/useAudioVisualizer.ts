/**
 * Audio Visualizer Hook
 * 
 * Provides audio frequency data for visualization.
 * Uses Web Audio API AnalyserNode.
 * 
 * IMPORTANT: MediaElementSourceNode can only be created once per audio element.
 * This hook manages a global source node to prevent crashes on re-renders.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * Resume the global AudioContext if it exists and is suspended.
 * This should be called on user interaction (like play button click).
 * @returns Promise that resolves when AudioContext is running or doesn't exist
 */
export async function resumeAudioContext(): Promise<void> {
  if (!audioContext) {
    logger.debug('No AudioContext to resume');
    return;
  }

  logger.debug('Checking AudioContext state', {
    state: audioContext.state,
    sampleRate: audioContext.sampleRate
  });

  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      logger.info('✅ AudioContext resumed successfully', {
        state: audioContext.state,
        sampleRate: audioContext.sampleRate
      });
    } catch (err) {
      logger.error('❌ Failed to resume AudioContext', err instanceof Error ? err : new Error(String(err)));
      throw err; // Re-throw to let caller handle
    }
  } else {
    logger.debug('AudioContext already running', { state: audioContext.state });
  }
}

interface UseAudioVisualizerOptions {
  barCount?: number;
  smoothing?: number;
  fftSize?: number;
}

interface VisualizerData {
  frequencies: number[];
  waveform: number[];
  average: number;
  peak: number;
}

// Singleton AudioContext and source node tracking
let audioContext: AudioContext | null = null;
let globalSourceNode: MediaElementAudioSourceNode | null = null;
let globalAnalyserNode: AnalyserNode | null = null;
let connectedAudioElement: HTMLAudioElement | null = null;

/**
 * Get or create the global audio source and analyser nodes
 * This ensures we only call createMediaElementSource once per audio element
 */
async function getOrCreateAudioNodes(audioElement: HTMLAudioElement, fftSize: number, smoothing: number) {
  try {
    // Create AudioContext if needed
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      logger.debug('AudioContext created for visualizer');
    }

    // Resume if suspended (required for user interaction policy)
    // IMPORTANT: Wait for resume to complete before proceeding
    if (audioContext.state === 'suspended') {
      logger.warn('AudioContext is suspended, attempting to resume...');
      try {
        await audioContext.resume();
        logger.info('✅ AudioContext resumed in getOrCreateAudioNodes', {
          state: audioContext.state,
          sampleRate: audioContext.sampleRate
        });
      } catch (err) {
        logger.error('❌ CRITICAL: AudioContext resume failed - audio will be SILENT!', err instanceof Error ? err : new Error(String(err)));
        throw err; // This will prevent visualizer setup and keep audio on default output
      }
    }

    // Verify AudioContext is actually running
    if (audioContext.state !== 'running') {
      logger.error('❌ CRITICAL: AudioContext not running after resume attempt', {
        state: audioContext.state
      });
      throw new Error(`AudioContext in ${audioContext.state} state, expected running`);
    }

    // Check if already connected to this element
    if (connectedAudioElement === audioElement && globalSourceNode && globalAnalyserNode) {
      // Verify the connection is still valid
      try {
        // Update analyser settings if needed
        globalAnalyserNode.fftSize = fftSize;
        globalAnalyserNode.smoothingTimeConstant = smoothing;
        logger.debug('Audio visualizer reusing existing connection');
        return globalAnalyserNode;
      } catch (err) {
        logger.warn('Existing connection invalid, recreating', err);
        // Fall through to recreate connection
        globalSourceNode = null;
        globalAnalyserNode = null;
        connectedAudioElement = null;
      }
    }

    // If connected to different element, we cannot reconnect (Web Audio limitation)
    // Just return null and use fallback animation
    if (connectedAudioElement && connectedAudioElement !== audioElement) {
      logger.warn('Audio visualizer already connected to different element, using fallback');
      return null;
    }

    // Create new connection
    logger.debug('Creating new audio visualizer connection');
    globalAnalyserNode = audioContext.createAnalyser();
    globalAnalyserNode.fftSize = fftSize;
    globalAnalyserNode.smoothingTimeConstant = smoothing;

    // Try to create source node - this can only be done once per audio element
    try {
      // Create the source node - this IMMEDIATELY disconnects audio from default output!
      // From this point on, we MUST route audio through Web Audio API or there will be no sound.
      globalSourceNode = audioContext.createMediaElementSource(audioElement);
      logger.debug('MediaElementSource created, audio now routed through Web Audio API');
      
      // CRITICAL: Connect to analyser and destination
      // This MUST succeed or audio will be silent!
      globalSourceNode.connect(globalAnalyserNode);
      globalAnalyserNode.connect(audioContext.destination);
      
      // Note: MediaElementSource constructor validates the element internally,
      // so if we reach here, the source is valid
      
      connectedAudioElement = audioElement;
      
      // Verify AudioContext is running - should already be resumed from earlier
      // This is a safety check after connection is established
      if (audioContext.state === 'suspended') {
        logger.warn('AudioContext still suspended after initial resume, trying again...');
        try {
          await audioContext.resume();
          logger.debug('AudioContext resumed on retry', {
            state: audioContext.state,
            sampleRate: audioContext.sampleRate,
          });
        } catch (err) {
          logger.error('CRITICAL: Failed to resume AudioContext - audio may be silent!', err);
        }
      } else {
        logger.debug('Audio visualizer successfully connected', {
          contextState: audioContext.state,
          sampleRate: audioContext.sampleRate,
        });
      }
      
      return globalAnalyserNode;
    } catch (sourceError) {
      // If source creation fails because element already has a source,
      // the audio is still playing through that existing source
      if (sourceError instanceof Error && sourceError.message.includes('already been attached')) {
        logger.warn('Audio element already has a source node attached');
        
        // Check if we have the existing connection
        if (globalSourceNode && globalAnalyserNode) {
          logger.debug('Reusing existing source node and analyser');
          // Make sure the existing connection routes to destination
          try {
            // Try to reconnect to destination if needed
            globalAnalyserNode.connect(audioContext.destination);
          } catch (e) {
            // Connection might already exist (InvalidStateError/InvalidAccessError)
            // This is expected and safe to ignore
            if (e instanceof Error) {
              logger.debug('Destination already connected (expected)', e.name);
            }
          }
          return globalAnalyserNode;
        }
        
        // Return null to use fallback visualization
        // Audio playback continues through the existing (external) source node
        logger.debug('No existing analyser found, using fallback visualization');
        return null;
      }
      
      // For any other error, clean up and let audio play through default output
      logger.error('Failed to create audio source node', sourceError instanceof Error ? sourceError : new Error(String(sourceError)));
      
      // IMPORTANT: If we created a source node but connection failed,
      // audio is now disconnected! Try to reconnect directly to destination
      if (globalSourceNode) {
        try {
          logger.warn('Attempting emergency reconnection to destination');
          // Disconnect specifically from the analyser to avoid breaking other potential connections
          if (globalAnalyserNode) {
            globalSourceNode.disconnect(globalAnalyserNode);
          }
          globalSourceNode.connect(audioContext.destination); // Connect directly
          logger.debug('Emergency reconnection successful');
        } catch (reconnectError) {
          logger.error('Emergency reconnection failed - audio will be silent!', reconnectError);
        }
      }
      
      // Clean up broken state
      globalAnalyserNode = null;
      connectedAudioElement = null;
      return null; // Use fallback visualization
    }
  } catch (error) {
    logger.error('Failed to initialize audio analyser', error);
    // Return null to use fallback - audio playback continues through default output
    return null;
  }
}

export function useAudioVisualizer(
  audioElement: HTMLAudioElement | null,
  isPlaying: boolean,
  options: UseAudioVisualizerOptions = {}
) {
  const {
    barCount = 32,
    smoothing = 0.8,
    fftSize = 128,
  } = options;

  const animationRef = useRef<number | null>(null);
  
  const [data, setData] = useState<VisualizerData>({
    frequencies: new Array(barCount).fill(0),
    waveform: new Array(barCount).fill(0.5),
    average: 0,
    peak: 0,
  });

  // Get analyser node
  const getAnalyser = useCallback(async () => {
    if (!audioElement) return null;
    return await getOrCreateAudioNodes(audioElement, fftSize, smoothing);
  }, [audioElement, fftSize, smoothing]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      // Decay frequencies when paused
      setData(prev => ({
        ...prev,
        frequencies: prev.frequencies.map(f => f * 0.92),
        average: prev.average * 0.92,
        peak: prev.peak * 0.95,
      }));
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Initialize analyser asynchronously
    let analyser: AnalyserNode | null = null;
    let isActive = true;
    
    const initAnalyser = async () => {
      if (!isActive) return;
      
      try {
        analyser = await getAnalyser();
      } catch (err) {
        logger.warn('Failed to get analyser, using fallback', err);
        analyser = null;
      }
      
      if (!isActive) return; // Effect cleanup happened during await
      
      // Fallback animation if analyser unavailable
      if (!analyser) {
        const fakeAnimate = () => {
          if (!isPlaying || !isActive) return;
          
          const time = Date.now() / 1000;
          const fakeFreqs = new Array(barCount).fill(0).map((_, i) => {
            const base = Math.sin(time * 2 + i * 0.3) * 0.3 + 0.4;
            const noise = Math.random() * 0.2;
            return Math.min(1, Math.max(0.05, base + noise));
          });
          
          const avg = fakeFreqs.reduce((a, b) => a + b, 0) / barCount;
          const peak = Math.max(...fakeFreqs);
          
          setData({
            frequencies: fakeFreqs,
            waveform: fakeFreqs.map(f => 0.5 + (f - 0.5) * 0.5),
            average: avg,
            peak,
          });
          
          animationRef.current = requestAnimationFrame(fakeAnimate);
        };
        
        fakeAnimate();
        return;
      }

      // Real analyser animation
      const bufferLength = analyser.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      const timeDomainData = new Uint8Array(bufferLength);

      const animate = () => {
        if (!isPlaying || !isActive || !analyser) return;

        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeDomainData);

        // Sample frequencies
        const step = Math.max(1, Math.floor(bufferLength / barCount));
        const frequencies: number[] = [];
        
        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            const idx = i * step + j;
            if (idx < bufferLength) {
              sum += frequencyData[idx];
            }
          }
          frequencies.push(Math.min(1, (sum / step / 255) * 1.3));
        }

        // Sample waveform
        const waveStep = Math.floor(bufferLength / barCount);
        const waveform = new Array(barCount).fill(0).map((_, i) => {
          const idx = i * waveStep;
          return (timeDomainData[idx] || 128) / 255;
        });

        const average = frequencies.reduce((a, b) => a + b, 0) / barCount;
        const peak = Math.max(...frequencies);

        setData({ frequencies, waveform, average, peak });
        
        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
    };
    
    initAnalyser();

    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, getAnalyser, barCount]);

  return data;
}
