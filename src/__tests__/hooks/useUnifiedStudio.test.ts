/**
 * Unit tests for useUnifiedStudio hook
 * Tests unified studio state management across track and project modes
 */

import { renderHook, act } from '@testing-library/react';
import { useUnifiedStudio } from '@/hooks/useUnifiedStudio';

// Mock stores
const mockPlayerStore = {
  activeTrack: null as any,
  isPlaying: false,
  volume: 0.85,
  playTrack: jest.fn(),
  pauseTrack: jest.fn(),
  setVolume: jest.fn(),
};

const mockStudioStore = {
  project: null as any,
  isPlaying: false,
  currentTime: 0,
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  seek: jest.fn(),
  setMasterVolume: jest.fn(),
};

jest.mock('@/hooks/audio/usePlayerState', () => ({
  usePlayerStore: () => mockPlayerStore,
}));

jest.mock('@/stores/useUnifiedStudioStore', () => ({
  useUnifiedStudioStore: () => mockStudioStore,
}));

describe('useUnifiedStudio', () => {
  beforeEach(() => {
    // Reset mocks
    mockPlayerStore.activeTrack = null;
    mockPlayerStore.isPlaying = false;
    mockPlayerStore.volume = 0.85;
    mockPlayerStore.playTrack.mockClear();
    mockPlayerStore.pauseTrack.mockClear();
    mockPlayerStore.setVolume.mockClear();

    mockStudioStore.project = null;
    mockStudioStore.isPlaying = false;
    mockStudioStore.currentTime = 0;
    mockStudioStore.play.mockClear();
    mockStudioStore.pause.mockClear();
    mockStudioStore.stop.mockClear();
    mockStudioStore.seek.mockClear();
    mockStudioStore.setMasterVolume.mockClear();
  });

  describe('mode detection', () => {
    it('should be in idle mode when no track or project is active', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.mode).toBe('idle');
      expect(result.current.isIdle).toBe(true);
      expect(result.current.isTrackMode).toBe(false);
      expect(result.current.isProjectMode).toBe(false);
    });

    it('should be in track mode when activeTrack is set', () => {
      mockPlayerStore.activeTrack = {
        id: 'track-1',
        title: 'Test Track',
        audio_url: 'https://example.com/audio.mp3',
        duration_seconds: 180,
        cover_url: 'https://example.com/cover.jpg',
      };

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.mode).toBe('track');
      expect(result.current.isTrackMode).toBe(true);
      expect(result.current.isProjectMode).toBe(false);
    });

    it('should be in project mode when project is set', () => {
      mockStudioStore.project = {
        id: 'project-1',
        name: 'Test Project',
        durationSeconds: 240,
        masterVolume: 0.9,
        tracks: [{ id: 'track-1', name: 'Track 1', audioUrl: 'url' }],
      };

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.mode).toBe('project');
      expect(result.current.isProjectMode).toBe(true);
      expect(result.current.isTrackMode).toBe(false);
    });

    it('should prioritize project mode when both are set', () => {
      mockPlayerStore.activeTrack = { id: 'track-1', title: 'Track' };
      mockStudioStore.project = { id: 'project-1', name: 'Project', tracks: [] };

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.mode).toBe('project');
    });
  });

  describe('forceMode option', () => {
    it('should respect forceMode=track', () => {
      mockStudioStore.project = { id: 'project-1', tracks: [] };

      const { result } = renderHook(() => 
        useUnifiedStudio({ forceMode: 'track' })
      );

      expect(result.current.mode).toBe('track');
    });

    it('should respect forceMode=project', () => {
      mockPlayerStore.activeTrack = { id: 'track-1' };

      const { result } = renderHook(() => 
        useUnifiedStudio({ forceMode: 'project' })
      );

      expect(result.current.mode).toBe('project');
    });

    it('should force project mode when projectId is provided', () => {
      const { result } = renderHook(() => 
        useUnifiedStudio({ projectId: 'some-project-id' })
      );

      expect(result.current.mode).toBe('project');
    });

    it('should force track mode when track is provided', () => {
      const { result } = renderHook(() => 
        useUnifiedStudio({ track: { id: 'track-1' } as any })
      );

      expect(result.current.mode).toBe('track');
    });
  });

  describe('activeTrack normalization', () => {
    it('should normalize track info in track mode', () => {
      mockPlayerStore.activeTrack = {
        id: 'track-1',
        title: 'My Song',
        audio_url: 'https://example.com/audio.mp3',
        duration_seconds: 180,
        cover_url: 'https://example.com/cover.jpg',
      };

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.activeTrack).toEqual({
        id: 'track-1',
        name: 'My Song',
        audioUrl: 'https://example.com/audio.mp3',
        duration: 180,
        coverUrl: 'https://example.com/cover.jpg',
      });
    });

    it('should normalize project track info in project mode', () => {
      mockStudioStore.project = {
        id: 'project-1',
        durationSeconds: 240,
        tracks: [{
          id: 'ptrack-1',
          name: 'Project Track',
          audioUrl: 'https://example.com/project-audio.mp3',
        }],
      };

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.activeTrack).toEqual({
        id: 'ptrack-1',
        name: 'Project Track',
        audioUrl: 'https://example.com/project-audio.mp3',
        duration: 240,
        coverUrl: undefined,
      });
    });

    it('should return null for activeTrack in idle mode', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.activeTrack).toBeNull();
    });

    it('should use fallback name "Untitled" for tracks without title', () => {
      mockPlayerStore.activeTrack = {
        id: 'track-1',
        audio_url: 'url',
      };

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.activeTrack?.name).toBe('Untitled');
    });
  });

  describe('playback state', () => {
    it('should use player store state in track mode', () => {
      mockPlayerStore.activeTrack = { 
        id: 'track-1', 
        title: 'Track',
        duration_seconds: 200,
      };
      mockPlayerStore.isPlaying = true;
      mockPlayerStore.volume = 0.7;

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.playback.isPlaying).toBe(true);
      expect(result.current.playback.duration).toBe(200);
      expect(result.current.playback.volume).toBe(0.7);
    });

    it('should use studio store state in project mode', () => {
      mockStudioStore.project = {
        id: 'project-1',
        durationSeconds: 300,
        masterVolume: 0.8,
        tracks: [],
      };
      mockStudioStore.isPlaying = true;
      mockStudioStore.currentTime = 45;

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.playback.isPlaying).toBe(true);
      expect(result.current.playback.currentTime).toBe(45);
      expect(result.current.playback.duration).toBe(300);
      expect(result.current.playback.volume).toBe(0.8);
    });
  });

  describe('actions - track mode', () => {
    beforeEach(() => {
      mockPlayerStore.activeTrack = { id: 'track-1', title: 'Track' };
    });

    it('should call playerStore.playTrack on play', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.play();
      });

      expect(mockPlayerStore.playTrack).toHaveBeenCalled();
    });

    it('should call playerStore.pauseTrack on pause', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.pause();
      });

      expect(mockPlayerStore.pauseTrack).toHaveBeenCalled();
    });

    it('should call playerStore.setVolume on setVolume', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.setVolume(0.5);
      });

      expect(mockPlayerStore.setVolume).toHaveBeenCalledWith(0.5);
    });
  });

  describe('actions - project mode', () => {
    beforeEach(() => {
      mockStudioStore.project = { 
        id: 'project-1', 
        masterVolume: 0.85,
        tracks: [] 
      };
    });

    it('should call studioStore.play on play', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.play();
      });

      expect(mockStudioStore.play).toHaveBeenCalled();
    });

    it('should call studioStore.pause on pause', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.pause();
      });

      expect(mockStudioStore.pause).toHaveBeenCalled();
    });

    it('should call studioStore.stop on stop', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.stop();
      });

      expect(mockStudioStore.stop).toHaveBeenCalled();
    });

    it('should call studioStore.seek on seek', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.seek(30);
      });

      expect(mockStudioStore.seek).toHaveBeenCalledWith(30);
    });

    it('should call studioStore.setMasterVolume on setVolume', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.setVolume(0.6);
      });

      expect(mockStudioStore.setMasterVolume).toHaveBeenCalledWith(0.6);
    });
  });

  describe('toggleMute', () => {
    it('should set volume to 0 when currently unmuted in track mode', () => {
      mockPlayerStore.activeTrack = { id: 'track-1' };
      mockPlayerStore.volume = 0.85;

      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.toggleMute();
      });

      expect(mockPlayerStore.setVolume).toHaveBeenCalledWith(0);
    });

    it('should set volume to 0.85 when currently muted in track mode', () => {
      mockPlayerStore.activeTrack = { id: 'track-1' };
      mockPlayerStore.volume = 0;

      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.toggleMute();
      });

      expect(mockPlayerStore.setVolume).toHaveBeenCalledWith(0.85);
    });

    it('should toggle volume in project mode', () => {
      mockStudioStore.project = { 
        id: 'project-1', 
        masterVolume: 0.9,
        tracks: [] 
      };

      const { result } = renderHook(() => useUnifiedStudio());

      act(() => {
        result.current.actions.toggleMute();
      });

      expect(mockStudioStore.setMasterVolume).toHaveBeenCalledWith(0);
    });
  });

  describe('store access', () => {
    it('should provide direct access to playerStore', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.playerStore).toBe(mockPlayerStore);
    });

    it('should provide direct access to studioStore', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.studioStore).toBe(mockStudioStore);
    });
  });

  describe('tracks array', () => {
    it('should return empty array when no project', () => {
      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.tracks).toEqual([]);
    });

    it('should return project tracks when in project mode', () => {
      const tracks = [
        { id: 't1', name: 'Track 1' },
        { id: 't2', name: 'Track 2' },
      ];
      mockStudioStore.project = { id: 'p1', tracks };

      const { result } = renderHook(() => useUnifiedStudio());

      expect(result.current.tracks).toEqual(tracks);
    });
  });
});
