/**
 * Tests for audioContextManager
 * 
 * Ensures:
 * 1. Single AudioContext instance
 * 2. Single MediaElementSource per audio element
 * 3. Proper error handling and recovery
 * 4. Audio routing to destination
 */

import {
  getAudioContext,
  resumeAudioContext,
  getAudioContextState,
  getOrCreateAudioNodes,
  ensureAudioRoutedToDestination,
  isAudioElementConnected,
  disconnectAudio,
  resetAudioContext,
} from '../audioContextManager';

// Mock AudioContext and related APIs
class MockAudioContext {
  state: AudioContextState = 'suspended';
  sampleRate = 48000;
  destination = { connect: jest.fn(), disconnect: jest.fn() };

  constructor() {
    this.state = 'suspended';
  }

  async resume() {
    this.state = 'running';
  }

  async close() {
    this.state = 'closed';
  }

  createAnalyser() {
    return {
      fftSize: 128,
      smoothingTimeConstant: 0.8,
      frequencyBinCount: 64,
      connect: jest.fn(),
      disconnect: jest.fn(),
      getByteFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn(),
    };
  }

  createMediaElementSource(audioElement: HTMLAudioElement) {
    // Check if audio element already has a source attached
    const alreadyAttached = (audioElement as any).__hasMediaSource;
    if (alreadyAttached) {
      throw new Error('The HTMLMediaElement already has a source node attached to it.');
    }
    
    // Mark element as having a source
    (audioElement as any).__hasMediaSource = true;
    
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      mediaElement: audioElement,
    };
  }
}

// Mock HTMLAudioElement
class MockAudioElement {
  src = 'https://example.com/audio.mp3';
  currentTime = 0;
  duration = 120;
  volume = 1;
  muted = false;
  paused = true;
  readyState = 4;
  networkState = 2;
  
  async play() {
    this.paused = false;
  }
  
  pause() {
    this.paused = true;
  }
  
  load() {}
}

describe('audioContextManager', () => {
  let mockAudioElement: HTMLAudioElement;

  beforeEach(() => {
    // Setup global mocks
    global.AudioContext = MockAudioContext as any;
    (global as any).webkitAudioContext = MockAudioContext;
    
    // Create mock audio element
    mockAudioElement = new MockAudioElement() as any;
    
    // Reset module state by forcing module reload
    jest.resetModules();
  });

  afterEach(async () => {
    // Clean up
    try {
      await resetAudioContext();
    } catch (err) {
      // Ignore cleanup errors
    }
    jest.clearAllMocks();
  });

  describe('getAudioContext', () => {
    it('should create a single AudioContext instance', () => {
      const ctx1 = getAudioContext();
      const ctx2 = getAudioContext();
      
      expect(ctx1).toBe(ctx2);
      expect(ctx1).toBeInstanceOf(MockAudioContext);
    });

    it('should initialize with suspended state', () => {
      const ctx = getAudioContext();
      expect(ctx.state).toBe('suspended');
    });
  });

  describe('resumeAudioContext', () => {
    it('should resume suspended AudioContext', async () => {
      const ctx = getAudioContext();
      expect(ctx.state).toBe('suspended');
      
      await resumeAudioContext();
      
      expect(ctx.state).toBe('running');
    });

    it('should not throw if AudioContext already running', async () => {
      const ctx = getAudioContext();
      await ctx.resume();
      
      await expect(resumeAudioContext()).resolves.not.toThrow();
    });

    it('should throw if resume fails', async () => {
      const ctx = getAudioContext();
      jest.spyOn(ctx, 'resume').mockRejectedValueOnce(new Error('Resume failed'));
      
      await expect(resumeAudioContext()).rejects.toThrow('Resume failed');
    });
  });

  describe('getAudioContextState', () => {
    it('should return current AudioContext state', () => {
      const ctx = getAudioContext();
      expect(getAudioContextState()).toBe('suspended');
      
      ctx.state = 'running';
      expect(getAudioContextState()).toBe('running');
    });

    it('should return null before AudioContext is created', async () => {
      await resetAudioContext();
      expect(getAudioContextState()).toBeNull();
    });
  });

  describe('getOrCreateAudioNodes', () => {
    it('should create audio nodes for new audio element', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      expect(result).not.toBeNull();
      expect(result?.analyser).toBeDefined();
      expect(result?.source).toBeDefined();
    });

    it('should reuse existing nodes for same audio element', async () => {
      const result1 = await getOrCreateAudioNodes(mockAudioElement);
      const result2 = await getOrCreateAudioNodes(mockAudioElement);
      
      expect(result1).toBe(result2);
      expect(result1?.analyser).toBe(result2?.analyser);
    });

    it('should connect source -> analyser -> destination', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      expect(result?.source.connect).toHaveBeenCalledWith(result?.analyser);
      expect(result?.analyser.connect).toHaveBeenCalled();
    });

    it('should resume AudioContext before creating nodes', async () => {
      const ctx = getAudioContext();
      const resumeSpy = jest.spyOn(ctx, 'resume');
      
      await getOrCreateAudioNodes(mockAudioElement);
      
      expect(resumeSpy).toHaveBeenCalled();
      expect(ctx.state).toBe('running');
    });

    it('should handle createMediaElementSource error gracefully', async () => {
      const ctx = getAudioContext();
      jest.spyOn(ctx, 'createMediaElementSource').mockImplementationOnce(() => {
        throw new Error('Source creation failed');
      });
      
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      // Should return null but not throw
      expect(result).toBeNull();
    });

    it('should return null for different audio element', async () => {
      const element1 = new MockAudioElement() as any;
      const element2 = new MockAudioElement() as any;
      
      await getOrCreateAudioNodes(element1);
      const result = await getOrCreateAudioNodes(element2);
      
      // Should return null because already connected to different element
      expect(result).toBeNull();
    });

    it('should apply custom fftSize and smoothing', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement, 256, 0.9);
      
      expect(result?.analyser.fftSize).toBe(256);
      expect(result?.analyser.smoothingTimeConstant).toBe(0.9);
    });
  });

  describe('ensureAudioRoutedToDestination', () => {
    it('should reconnect analyser to destination', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      // Clear mock calls from initial connection
      jest.clearAllMocks();
      
      ensureAudioRoutedToDestination();
      
      // Should attempt to connect
      expect(result?.analyser.connect).toHaveBeenCalled();
    });

    it('should handle InvalidStateError gracefully', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      // Simulate already connected error
      jest.spyOn(result!.analyser, 'connect').mockImplementationOnce(() => {
        const err: any = new Error('Already connected');
        err.name = 'InvalidStateError';
        throw err;
      });
      
      // Should not throw
      expect(() => ensureAudioRoutedToDestination()).not.toThrow();
    });

    it('should attempt direct connection as fallback', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      // Simulate analyser connection failure
      jest.spyOn(result!.analyser, 'connect').mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });
      
      const sourceSpy = jest.spyOn(result!.source, 'disconnect');
      
      ensureAudioRoutedToDestination();
      
      // Should attempt to disconnect and reconnect source
      expect(sourceSpy).toHaveBeenCalled();
    });

    it('should do nothing if no nodes exist', () => {
      // Should not throw when called before initialization
      expect(() => ensureAudioRoutedToDestination()).not.toThrow();
    });
  });

  describe('isAudioElementConnected', () => {
    it('should return true for connected element', async () => {
      await getOrCreateAudioNodes(mockAudioElement);
      
      expect(isAudioElementConnected(mockAudioElement)).toBe(true);
    });

    it('should return false for non-connected element', () => {
      const otherElement = new MockAudioElement() as any;
      
      expect(isAudioElementConnected(otherElement)).toBe(false);
    });

    it('should return false before any connection', () => {
      expect(isAudioElementConnected(mockAudioElement)).toBe(false);
    });
  });

  describe('disconnectAudio', () => {
    it('should disconnect all nodes', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      const sourceDisconnectSpy = jest.spyOn(result!.source, 'disconnect');
      const analyserDisconnectSpy = jest.spyOn(result!.analyser, 'disconnect');
      
      disconnectAudio();
      
      expect(sourceDisconnectSpy).toHaveBeenCalled();
      expect(analyserDisconnectSpy).toHaveBeenCalled();
    });

    it('should clear connection state', async () => {
      await getOrCreateAudioNodes(mockAudioElement);
      
      disconnectAudio();
      
      expect(isAudioElementConnected(mockAudioElement)).toBe(false);
    });

    it('should handle disconnect errors gracefully', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      jest.spyOn(result!.source, 'disconnect').mockImplementationOnce(() => {
        throw new Error('Disconnect failed');
      });
      
      // Should not throw
      expect(() => disconnectAudio()).not.toThrow();
    });
  });

  describe('resetAudioContext', () => {
    it('should close and reset AudioContext', async () => {
      const ctx = getAudioContext();
      await getOrCreateAudioNodes(mockAudioElement);
      
      const closeSpy = jest.spyOn(ctx, 'close');
      
      await resetAudioContext();
      
      expect(closeSpy).toHaveBeenCalled();
      expect(ctx.state).toBe('closed');
    });

    it('should clear all connection state', async () => {
      await getOrCreateAudioNodes(mockAudioElement);
      
      await resetAudioContext();
      
      expect(isAudioElementConnected(mockAudioElement)).toBe(false);
      expect(getAudioContextState()).toBeNull();
    });

    it('should handle close errors gracefully', async () => {
      const ctx = getAudioContext();
      jest.spyOn(ctx, 'close').mockRejectedValueOnce(new Error('Close failed'));
      
      // Should not throw
      await expect(resetAudioContext()).resolves.not.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should prevent duplicate MediaElementSource creation', async () => {
      await getOrCreateAudioNodes(mockAudioElement);
      
      // Second call should reuse existing source
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      expect(result).not.toBeNull();
      expect((mockAudioElement as any).__hasMediaSource).toBe(true);
    });

    it('should maintain audio routing during errors', async () => {
      const result = await getOrCreateAudioNodes(mockAudioElement);
      
      // Simulate error that requires recovery
      jest.spyOn(result!.analyser, 'connect').mockImplementationOnce(() => {
        throw new Error('Connection error');
      });
      
      ensureAudioRoutedToDestination();
      
      // Source should still be connected (fallback to direct connection)
      expect(result!.source.disconnect).toHaveBeenCalled();
    });

    it('should handle rapid context state changes', async () => {
      const ctx = getAudioContext();
      
      // Suspend -> Resume -> Suspend -> Resume
      ctx.state = 'suspended';
      await resumeAudioContext();
      expect(ctx.state).toBe('running');
      
      ctx.state = 'suspended';
      await resumeAudioContext();
      expect(ctx.state).toBe('running');
    });

    it('should clean up properly on reset', async () => {
      // Create connections
      await getOrCreateAudioNodes(mockAudioElement);
      
      // Reset
      await resetAudioContext();
      
      // Should be able to create fresh connection
      const result = await getOrCreateAudioNodes(mockAudioElement);
      expect(result).not.toBeNull();
    });
  });
});
