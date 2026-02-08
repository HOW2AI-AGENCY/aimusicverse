/**
 * Picture-in-Picture Hook for Audio Player
 * Feature: 032-professional-ui (P3)
 * 
 * Enables PiP mode using the Media Session API and Canvas API
 * for audio visualization in a floating mini-player.
 * 
 * @module usePictureInPicture
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '@/types/track';
import { logger } from '@/lib/logger';

interface PictureInPictureState {
  /** Whether PiP is currently active */
  isActive: boolean;
  /** Whether PiP is supported on this device */
  isSupported: boolean;
  /** Error message if PiP failed */
  error: string | null;
}

interface UsePictureInPictureOptions {
  /** Current track being played */
  track: Track | null;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Cover image URL */
  coverUrl?: string;
  /** Callback for play action */
  onPlay?: () => void;
  /** Callback for pause action */
  onPause?: () => void;
  /** Callback for next track action */
  onNext?: () => void;
  /** Callback for previous track action */
  onPrevious?: () => void;
}

interface UsePictureInPictureReturn extends PictureInPictureState {
  /** Request to enter PiP mode */
  requestPiP: () => Promise<void>;
  /** Exit PiP mode */
  exitPiP: () => void;
  /** Toggle PiP mode */
  togglePiP: () => Promise<void>;
}

/**
 * Check if Picture-in-Picture is supported
 * Uses document.pictureInPictureEnabled for video-based PiP
 * Falls back to Media Session API for audio
 */
function checkPiPSupport(): boolean {
  // Check for document PiP API
  if ('pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
    return true;
  }
  
  // Check for Media Session API (works for audio with lock screen controls)
  if ('mediaSession' in navigator) {
    return true;
  }
  
  return false;
}

/**
 * Hook for Picture-in-Picture functionality
 * 
 * Uses Media Session API to provide:
 * - Lock screen controls on mobile
 * - Media notification on Android
 * - Control center integration on iOS
 * - Windows/macOS media controls
 */
export function usePictureInPicture(
  options: UsePictureInPictureOptions
): UsePictureInPictureReturn {
  const { track, isPlaying, coverUrl, onPlay, onPause, onNext, onPrevious } = options;
  
  const [state, setState] = useState<PictureInPictureState>({
    isActive: false,
    isSupported: checkPiPSupport(),
    error: null,
  });
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  
  // Update Media Session metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    
    try {
      const artwork: MediaImage[] = [];
      
    // Add cover art if available
    const cover = coverUrl || track.cover_url;
    if (cover) {
        artwork.push(
          { src: cover, sizes: '96x96', type: 'image/jpeg' },
          { src: cover, sizes: '128x128', type: 'image/jpeg' },
          { src: cover, sizes: '192x192', type: 'image/jpeg' },
          { src: cover, sizes: '256x256', type: 'image/jpeg' },
          { src: cover, sizes: '384x384', type: 'image/jpeg' },
          { src: cover, sizes: '512x512', type: 'image/jpeg' }
        );
      }
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'Untitled Track',
        artist: track.artist_name || 'MusicVerse AI',
        album: 'MusicVerse AI',
        artwork,
      });
      
      logger.debug('Media Session metadata updated', { 
        title: track.title,
        hasArtwork: artwork.length > 0 
      });
    } catch (err) {
      logger.error('Failed to set Media Session metadata', err);
    }
  }, [track, coverUrl]);
  
  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (err) {
      // Ignore - not all browsers support this
    }
  }, [isPlaying]);
  
  // Set up Media Session action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    
    const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', onPlay ? () => onPlay() : null],
      ['pause', onPause ? () => onPause() : null],
      ['previoustrack', onPrevious ? () => onPrevious() : null],
      ['nexttrack', onNext ? () => onNext() : null],
      ['stop', onPause ? () => onPause() : null],
    ];
    
    // Set action handlers
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Some actions not supported on all platforms
        logger.debug(`Media Session action ${action} not supported`);
      }
    }
    
    // Cleanup
    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [onPlay, onPause, onNext, onPrevious]);
  
  /**
   * Create a video element with canvas stream for PiP
   * This enables actual floating PiP window on supported devices
   */
  const createPiPVideo = useCallback(async () => {
    // Create canvas for visualization
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      canvasRef.current = canvas;
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Draw initial frame with cover art
    const cover = coverUrl || track?.cover_url;
    if (cover) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load cover'));
          img.src = cover;
        });
        
        // Draw cover art centered
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Add title overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(track?.title || 'MusicVerse AI', canvas.width / 2, canvas.height - 30);
      } catch {
        // Fallback to gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e3a8a');
        gradient.addColorStop(1, '#7c3aed');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(track?.title || 'MusicVerse AI', canvas.width / 2, canvas.height / 2);
      }
    }
    
    // Create video from canvas stream
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      videoRef.current = video;
    }
    
    const video = videoRef.current;
    const stream = canvas.captureStream(30);
    video.srcObject = stream;
    await video.play();
    
    return video;
  }, [track, coverUrl]);
  
  /**
   * Request Picture-in-Picture mode
   */
  const requestPiP = useCallback(async () => {
    if (!state.isSupported) {
      setState(s => ({ ...s, error: 'PiP not supported on this device' }));
      return;
    }
    
    try {
      setState(s => ({ ...s, error: null }));
      
      // Try document PiP API first
      if ('pictureInPictureEnabled' in document && document.pictureInPictureEnabled) {
        const video = await createPiPVideo();
        if (video && 'requestPictureInPicture' in video) {
          await (video as HTMLVideoElement).requestPictureInPicture();
          setState(s => ({ ...s, isActive: true }));
          
          logger.info('Entered Picture-in-Picture mode');
          return;
        }
      }
      
      // Fallback - Media Session is already active
      setState(s => ({ ...s, isActive: true }));
      logger.info('Media Session controls activated');
      
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to enter PiP';
      logger.error('PiP request failed', err);
      setState(s => ({ ...s, error, isActive: false }));
    }
  }, [state.isSupported, createPiPVideo]);
  
  /**
   * Exit Picture-in-Picture mode
   */
  const exitPiP = useCallback(() => {
    try {
      // Exit document PiP
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      }
      
      // Stop canvas animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      
      // Cleanup video element
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
      
      setState(s => ({ ...s, isActive: false, error: null }));
      logger.info('Exited Picture-in-Picture mode');
      
    } catch (err) {
      logger.error('Failed to exit PiP', err);
    }
  }, []);
  
  /**
   * Toggle Picture-in-Picture mode
   */
  const togglePiP = useCallback(async () => {
    if (state.isActive) {
      exitPiP();
    } else {
      await requestPiP();
    }
  }, [state.isActive, requestPiP, exitPiP]);
  
  // Listen for PiP exit events
  useEffect(() => {
    const handlePiPExit = () => {
      setState(s => ({ ...s, isActive: false }));
    };
    
    document.addEventListener('leavepictureinpicture', handlePiPExit);
    
    return () => {
      document.removeEventListener('leavepictureinpicture', handlePiPExit);
      // Cleanup on unmount
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoRef.current) {
        videoRef.current.remove();
      }
    };
  }, []);
  
  return {
    ...state,
    requestPiP,
    exitPiP,
    togglePiP,
  };
}

export default usePictureInPicture;
