/**
 * Tests for audioFormatUtils
 * 
 * Ensures:
 * 1. Accurate mobile browser detection
 * 2. Audio format compatibility checking
 * 3. MIME type detection from URLs
 */

import {
  detectMobileBrowser,
  canPlayAudioFormat,
  getAudioFormatFromUrl,
  isAudioFormatSupported,
  getBrowserAudioSupport,
} from '../audioFormatUtils';

// Mock navigator
const mockUserAgent = (userAgent: string, platform: string = 'Linux x86_64') => {
  Object.defineProperty(window.navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent,
  });
  Object.defineProperty(window.navigator, 'platform', {
    writable: true,
    configurable: true,
    value: platform,
  });
};

describe('audioFormatUtils', () => {
  describe('detectMobileBrowser', () => {
    beforeEach(() => {
      // Reset to desktop by default
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    });

    it('detects Chrome Mobile on Android', () => {
      mockUserAgent('Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36');
      
      const info = detectMobileBrowser();
      
      expect(info.isMobile).toBe(true);
      expect(info.isAndroid).toBe(true);
      expect(info.isIOS).toBe(false);
      expect(info.isChromeMobile).toBe(true);
      expect(info.isSafariMobile).toBe(false);
      expect(info.browserName).toBe('Chrome Mobile');
      expect(info.osName).toContain('Android');
    });

    it('detects Safari Mobile on iOS', () => {
      mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
      
      const info = detectMobileBrowser();
      
      expect(info.isMobile).toBe(true);
      expect(info.isAndroid).toBe(false);
      expect(info.isIOS).toBe(true);
      expect(info.isChromeMobile).toBe(false);
      expect(info.isSafariMobile).toBe(true);
      expect(info.browserName).toBe('Safari Mobile');
      expect(info.osName).toContain('iOS');
    });

    it('detects desktop Chrome', () => {
      mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      const info = detectMobileBrowser();
      
      expect(info.isMobile).toBe(false);
      expect(info.isAndroid).toBe(false);
      expect(info.isIOS).toBe(false);
      expect(info.isChromeMobile).toBe(false);
      expect(info.isSafariMobile).toBe(false);
      expect(info.browserName).toBe('Chrome');
    });

    it('detects iPad with touch support', () => {
      mockUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 'MacIntel');
      
      // Mock touch support for iPad
      Object.defineProperty(document, 'ontouchend', {
        writable: true,
        configurable: true,
        value: null,
      });
      
      const info = detectMobileBrowser();
      
      expect(info.isMobile).toBe(true);
      expect(info.isIOS).toBe(true);
      
      // Cleanup
      delete (document as any).ontouchend;
    });
  });

  describe('canPlayAudioFormat', () => {
    let mockAudio: any;
    
    beforeEach(() => {
      mockAudio = {
        canPlayType: jest.fn(),
      };
      
      // Mock createElement to return our mock audio element
      jest.spyOn(document, 'createElement').mockReturnValue(mockAudio);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns canPlay=true for probably supported format', () => {
      mockAudio.canPlayType.mockReturnValue('probably');
      
      const result = canPlayAudioFormat('audio/mpeg');
      
      expect(result.canPlay).toBe(true);
      expect(result.support).toBe('probably');
      expect(result.mimeType).toBe('audio/mpeg');
    });

    it('returns canPlay=true for maybe supported format', () => {
      mockAudio.canPlayType.mockReturnValue('maybe');
      
      const result = canPlayAudioFormat('audio/ogg');
      
      expect(result.canPlay).toBe(true);
      expect(result.support).toBe('maybe');
      expect(result.mimeType).toBe('audio/ogg');
    });

    it('returns canPlay=false for unsupported format', () => {
      mockAudio.canPlayType.mockReturnValue('');
      
      const result = canPlayAudioFormat('audio/unknown');
      
      expect(result.canPlay).toBe(false);
      expect(result.support).toBe('');
      expect(result.mimeType).toBe('audio/unknown');
    });

    it('includes codec in MIME type check', () => {
      mockAudio.canPlayType.mockReturnValue('probably');
      
      const result = canPlayAudioFormat('audio/mp4', 'aac');
      
      expect(mockAudio.canPlayType).toHaveBeenCalledWith('audio/mp4; codecs="aac"');
      expect(result.codec).toBe('aac');
    });
  });

  describe('getAudioFormatFromUrl', () => {
    it('returns null for blob URLs', () => {
      const result = getAudioFormatFromUrl('blob:https://example.com/123-456');
      expect(result).toBeNull();
    });

    it('extracts MIME type from data URLs', () => {
      const result = getAudioFormatFromUrl('data:audio/mpeg;base64,SGVsbG8=');
      expect(result).toBe('audio/mpeg');
    });

    it('detects MP3 from file extension', () => {
      const result = getAudioFormatFromUrl('https://example.com/audio.mp3');
      expect(result).toBe('audio/mpeg');
    });

    it('detects M4A from file extension', () => {
      const result = getAudioFormatFromUrl('https://example.com/audio.m4a');
      expect(result).toBe('audio/mp4');
    });

    it('detects OGG from file extension', () => {
      const result = getAudioFormatFromUrl('https://example.com/audio.ogg?v=123');
      expect(result).toBe('audio/ogg');
    });

    it('returns null for unknown extension', () => {
      const result = getAudioFormatFromUrl('https://example.com/audio.xyz');
      expect(result).toBeNull();
    });

    it('returns null for URL without extension', () => {
      const result = getAudioFormatFromUrl('https://example.com/audio');
      expect(result).toBeNull();
    });
  });

  describe('isAudioFormatSupported', () => {
    let mockAudio: any;
    
    beforeEach(() => {
      mockAudio = {
        canPlayType: jest.fn().mockReturnValue('probably'),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAudio);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns true for supported MP3', () => {
      const result = isAudioFormatSupported('https://example.com/audio.mp3');
      expect(result).toBe(true);
      expect(mockAudio.canPlayType).toHaveBeenCalledWith('audio/mpeg');
    });

    it('returns true when format cannot be determined', () => {
      const result = isAudioFormatSupported('https://example.com/audio');
      expect(result).toBe(true);
    });

    it('uses explicit MIME type when provided', () => {
      const result = isAudioFormatSupported('https://example.com/audio', 'audio/webm');
      expect(mockAudio.canPlayType).toHaveBeenCalledWith('audio/webm');
    });

    it('returns false for unsupported format', () => {
      mockAudio.canPlayType.mockReturnValue('');
      const result = isAudioFormatSupported('https://example.com/audio.xyz', 'audio/unknown');
      expect(result).toBe(false);
    });
  });

  describe('getBrowserAudioSupport', () => {
    let mockAudio: any;
    
    beforeEach(() => {
      mockAudio = {
        canPlayType: jest.fn((type: string) => {
          // Simulate typical browser support
          if (type.includes('mpeg') || type.includes('mp4')) return 'probably';
          if (type.includes('webm') || type.includes('ogg')) return 'maybe';
          return '';
        }),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAudio);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns support info for common formats', () => {
      const support = getBrowserAudioSupport();
      
      expect(support).toHaveProperty('MP3');
      expect(support).toHaveProperty('M4A/AAC');
      expect(support).toHaveProperty('OGG');
      expect(support).toHaveProperty('WebM');
      expect(support).toHaveProperty('WAV');
      expect(support).toHaveProperty('FLAC');
    });

    it('includes canPlay status for each format', () => {
      const support = getBrowserAudioSupport();
      
      expect(support['MP3'].canPlay).toBe(true);
      expect(support['M4A/AAC'].canPlay).toBe(true);
      expect(support['OGG'].canPlay).toBe(true);
    });
  });
});
