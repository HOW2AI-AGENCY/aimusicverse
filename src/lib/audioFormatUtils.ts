/**
 * Audio Format Utilities
 * 
 * Utilities for detecting mobile browsers and checking audio format compatibility.
 * Helps prevent and handle MEDIA_ERR_SRC_NOT_SUPPORTED errors on mobile devices.
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType}
 */

import { logger } from '@/lib/logger';

/**
 * Mobile browser detection result
 */
export interface MobileBrowserInfo {
  isMobile: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isChromeMobile: boolean;
  isSafariMobile: boolean;
  browserName: string;
  osName: string;
}

/**
 * Audio format compatibility result
 */
export interface AudioFormatCompatibility {
  canPlay: boolean;
  support: '' | 'maybe' | 'probably';
  mimeType: string;
  codec?: string;
}

/**
 * Detect mobile browser and OS
 * 
 * @returns Mobile browser information
 */
export function detectMobileBrowser(): MobileBrowserInfo {
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';
  
  // Detect mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && 'ontouchend' in document); // iPad on iOS 13+
  
  // Detect Android
  const isAndroid = /Android/i.test(userAgent);
  
  // Detect iOS (iPhone, iPad, iPod)
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && 'ontouchend' in document);
  
  // Detect Chrome Mobile
  const isChromeMobile = isAndroid && /Chrome/i.test(userAgent) && !/Edge|Edg/i.test(userAgent);
  
  // Detect Safari Mobile
  const isSafariMobile = isIOS && /Safari/i.test(userAgent) && !/Chrome|CriOS|FxiOS/i.test(userAgent);
  
  // Determine browser name
  let browserName = 'Unknown';
  if (isChromeMobile) browserName = 'Chrome Mobile';
  else if (isSafariMobile) browserName = 'Safari Mobile';
  else if (/CriOS/i.test(userAgent)) browserName = 'Chrome iOS';
  else if (/FxiOS/i.test(userAgent)) browserName = 'Firefox iOS';
  else if (/Chrome/i.test(userAgent)) browserName = 'Chrome';
  else if (/Safari/i.test(userAgent)) browserName = 'Safari';
  else if (/Firefox/i.test(userAgent)) browserName = 'Firefox';
  else if (/Edge|Edg/i.test(userAgent)) browserName = 'Edge';
  
  // Determine OS name
  let osName = 'Unknown';
  if (isAndroid) {
    const androidMatch = userAgent.match(/Android\s+([\d.]+)/);
    osName = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
  } else if (isIOS) {
    const iosMatch = userAgent.match(/OS\s+([\d_]+)/);
    osName = iosMatch ? `iOS ${iosMatch[1].replace(/_/g, '.')}` : 'iOS';
  } else if (/Windows/i.test(userAgent)) {
    osName = 'Windows';
  } else if (/Macintosh/i.test(userAgent)) {
    osName = 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    osName = 'Linux';
  }
  
  return {
    isMobile,
    isAndroid,
    isIOS,
    isChromeMobile,
    isSafariMobile,
    browserName,
    osName,
  };
}

/**
 * Check if a MIME type can be played by the browser
 * 
 * @param mimeType - MIME type to check (e.g., 'audio/mp3', 'audio/mpeg')
 * @param codec - Optional codec parameter (e.g., 'mp3', 'aac')
 * @returns Compatibility information
 */
export function canPlayAudioFormat(mimeType: string, codec?: string): AudioFormatCompatibility {
  const audio = document.createElement('audio');
  
  // Build full MIME type with codec if provided
  const fullMimeType = codec ? `${mimeType}; codecs="${codec}"` : mimeType;
  
  // Check if the browser can play this format
  const support = audio.canPlayType(fullMimeType);
  
  // canPlayType returns '' (empty string), 'maybe', or 'probably'
  const canPlay = support === 'probably' || support === 'maybe';
  
  return {
    canPlay,
    support: support as '' | 'maybe' | 'probably',
    mimeType,
    codec,
  };
}

/**
 * Get audio format from URL or blob
 * 
 * @param url - Audio URL (blob:, data:, or HTTP)
 * @returns Detected MIME type or null
 */
export function getAudioFormatFromUrl(url: string): string | null {
  // For blob URLs, we can't determine format without additional context
  if (url.startsWith('blob:')) {
    logger.debug('Cannot determine format from blob URL', { url: url.substring(0, 50) });
    return null;
  }
  
  // For data URLs, extract MIME type
  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;,]+)/);
    if (match) {
      return match[1];
    }
    return null;
  }
  
  // For HTTP(S) URLs, guess from file extension
  const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (!extension) return null;
  
  const extensionToMimeType: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'mpeg': 'audio/mpeg',
    'wav': 'audio/wav',
    'wave': 'audio/wav',
    'ogg': 'audio/ogg',
    'oga': 'audio/ogg',
    'opus': 'audio/opus',
    'webm': 'audio/webm',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',
    'mp4': 'audio/mp4',
    'flac': 'audio/flac',
  };
  
  return extensionToMimeType[extension] || null;
}

/**
 * Check if audio format is supported on current browser/device
 * 
 * @param url - Audio URL to check
 * @param mimeType - Optional explicit MIME type
 * @returns true if format is likely supported
 */
export function isAudioFormatSupported(url: string, mimeType?: string): boolean {
  // Get MIME type from URL if not provided
  const detectedMimeType = mimeType || getAudioFormatFromUrl(url);
  
  if (!detectedMimeType) {
    // Can't determine format - assume it might work
    logger.debug('Cannot determine audio format, assuming supported', { 
      url: url.substring(0, 50) 
    });
    return true;
  }
  
  // Check if browser can play this format
  const compatibility = canPlayAudioFormat(detectedMimeType);
  
  logger.debug('Audio format compatibility check', {
    url: url.substring(0, 50),
    mimeType: detectedMimeType,
    support: compatibility.support,
    canPlay: compatibility.canPlay,
  });
  
  return compatibility.canPlay;
}

/**
 * Get browser audio format support details
 * 
 * @returns Map of common audio formats and their support status
 */
export function getBrowserAudioSupport(): Record<string, AudioFormatCompatibility> {
  const formats = [
    { mimeType: 'audio/mpeg', label: 'MP3' },
    { mimeType: 'audio/mp4', label: 'M4A/AAC' },
    { mimeType: 'audio/ogg', label: 'OGG' },
    { mimeType: 'audio/webm', label: 'WebM' },
    { mimeType: 'audio/wav', label: 'WAV' },
    { mimeType: 'audio/flac', label: 'FLAC' },
  ];
  
  const support: Record<string, AudioFormatCompatibility> = {};
  
  for (const format of formats) {
    support[format.label] = canPlayAudioFormat(format.mimeType);
  }
  
  return support;
}

/**
 * Log browser and audio support diagnostics
 * Useful for debugging mobile audio issues
 */
export function logAudioDiagnostics(): void {
  const browserInfo = detectMobileBrowser();
  const audioSupport = getBrowserAudioSupport();
  
  logger.info('Audio diagnostics', {
    browser: browserInfo,
    audioSupport: Object.entries(audioSupport).map(([format, support]) => ({
      format,
      support: support.support,
      canPlay: support.canPlay,
    })),
  });
}
