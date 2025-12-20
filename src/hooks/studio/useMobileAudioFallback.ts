/**
 * Mobile Audio Fallback Hook
 * 
 * Detects mobile device audio element limits and provides
 * automatic fallback for devices with limited concurrent audio support.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { TrackStem } from '@/hooks/useTrackStems';

// Mobile browsers typically limit concurrent audio elements
const MOBILE_AUDIO_LIMIT = 6;
const DESKTOP_AUDIO_LIMIT = 16;

interface AudioCapabilities {
  maxConcurrentAudio: number;
  isLimited: boolean;
  platform: 'mobile' | 'desktop';
  supportsWebAudio: boolean;
  audioContextState: AudioContextState | 'unavailable';
}

interface UseMobileAudioFallbackProps {
  stems: TrackStem[];
  enabled?: boolean;
}

interface UseMobileAudioFallbackReturn {
  capabilities: AudioCapabilities;
  activeStems: TrackStem[];
  limitedStems: TrackStem[];
  isLimited: boolean;
  prioritizeStems: (stems: TrackStem[]) => TrackStem[];
  showFallbackWarning: boolean;
  dismissWarning: () => void;
}

// Priority order for stems when limiting
const STEM_PRIORITY: Record<string, number> = {
  vocals: 1,
  vocal: 1,
  drums: 2,
  bass: 3,
  guitar: 4,
  piano: 5,
  keyboard: 5,
  strings: 6,
  synth: 7,
  instrumental: 8,
  other: 9,
};

function detectPlatform(): 'mobile' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  
  // Also check for touch capability and screen size
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;
  
  return (isMobile || (isTouchDevice && isSmallScreen)) ? 'mobile' : 'desktop';
}

async function detectAudioCapabilities(): Promise<AudioCapabilities> {
  const platform = detectPlatform();
  let supportsWebAudio = false;
  let audioContextState: AudioContextState | 'unavailable' = 'unavailable';
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      supportsWebAudio = true;
      const testContext = new AudioContextClass();
      audioContextState = testContext.state;
      await testContext.close();
    }
  } catch {
    supportsWebAudio = false;
  }
  
  const maxConcurrentAudio = platform === 'mobile' ? MOBILE_AUDIO_LIMIT : DESKTOP_AUDIO_LIMIT;
  
  return {
    maxConcurrentAudio,
    isLimited: platform === 'mobile',
    platform,
    supportsWebAudio,
    audioContextState,
  };
}

function prioritizeStemsByType(stems: TrackStem[]): TrackStem[] {
  return [...stems].sort((a, b) => {
    const priorityA = STEM_PRIORITY[a.stem_type.toLowerCase()] ?? 10;
    const priorityB = STEM_PRIORITY[b.stem_type.toLowerCase()] ?? 10;
    return priorityA - priorityB;
  });
}

export function useMobileAudioFallback({
  stems,
  enabled = true,
}: UseMobileAudioFallbackProps): UseMobileAudioFallbackReturn {
  const [capabilities, setCapabilities] = useState<AudioCapabilities>({
    maxConcurrentAudio: DESKTOP_AUDIO_LIMIT,
    isLimited: false,
    platform: 'desktop',
    supportsWebAudio: true,
    audioContextState: 'unavailable',
  });
  
  const [showFallbackWarning, setShowFallbackWarning] = useState(false);
  const warningDismissedRef = useRef(false);
  
  // Detect capabilities on mount
  useEffect(() => {
    detectAudioCapabilities().then((caps) => {
      setCapabilities(caps);
      logger.info('Audio capabilities detected', { 
        maxConcurrentAudio: caps.maxConcurrentAudio,
        isLimited: caps.isLimited,
        platform: caps.platform,
        supportsWebAudio: caps.supportsWebAudio,
      });
    });
  }, []);
  
  // Calculate which stems are active vs limited
  const prioritizedStems = prioritizeStemsByType(stems);
  const needsLimiting = enabled && capabilities.isLimited && stems.length > capabilities.maxConcurrentAudio;
  
  const activeStems = needsLimiting 
    ? prioritizedStems.slice(0, capabilities.maxConcurrentAudio)
    : stems;
    
  const limitedStems = needsLimiting
    ? prioritizedStems.slice(capabilities.maxConcurrentAudio)
    : [];
  
  // Show warning when stems are limited
  useEffect(() => {
    if (needsLimiting && limitedStems.length > 0 && !warningDismissedRef.current) {
      setShowFallbackWarning(true);
      logger.warn('Stems limited due to mobile audio constraints', {
        total: stems.length,
        active: activeStems.length,
        limited: limitedStems.length,
        limitedTypes: limitedStems.map(s => s.stem_type),
      });
    } else {
      setShowFallbackWarning(false);
    }
  }, [needsLimiting, limitedStems.length, stems.length, activeStems.length]);
  
  const dismissWarning = useCallback(() => {
    setShowFallbackWarning(false);
    warningDismissedRef.current = true;
  }, []);
  
  const prioritizeStems = useCallback((stemsToSort: TrackStem[]) => {
    return prioritizeStemsByType(stemsToSort);
  }, []);
  
  return {
    capabilities,
    activeStems,
    limitedStems,
    isLimited: needsLimiting,
    prioritizeStems,
    showFallbackWarning,
    dismissWarning,
  };
}

/**
 * Component to show mobile audio warning
 */
export { MobileAudioWarning } from '@/components/studio/MobileAudioWarning';
