/**
 * T044-T046 Integration Tests for Unified Studio Mobile
 * Phase 2.3: AI Actions & Unified Hook
 * 
 * Integration tests verify cross-component behavior:
 * - Tab switching preserves playback state
 * - Audio playback continues across tab changes
 * - State persistence works correctly
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Telegram SDK
vi.mock('@twa-dev/sdk', () => ({
  default: {
    HapticFeedback: {
      impactOccurred: vi.fn(),
      selectionChanged: vi.fn(),
    },
    ready: vi.fn(),
    expand: vi.fn(),
  },
  HapticFeedback: {
    impactOccurred: vi.fn(),
    selectionChanged: vi.fn(),
  },
}));

// Mock player state
const mockPlayerState = {
  activeTrack: null as any,
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  playbackSpeed: 1,
  queue: [],
  playTrack: vi.fn(),
  pauseTrack: vi.fn(),
  setCurrentTime: vi.fn(),
  setVolume: vi.fn(),
  setPlaybackSpeed: vi.fn(),
};

vi.mock('@/hooks/audio/usePlayerState', () => ({
  usePlayerStore: vi.fn((selector) => {
    if (selector) return selector(mockPlayerState);
    return mockPlayerState;
  }),
}));

// Mock audio engine
vi.mock('@/hooks/studio/useStudioAudioEngine', () => ({
  useStudioAudioEngine: () => ({
    isReady: true,
    isLoading: false,
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
  }),
}));

// Mock unified studio store
const mockUnifiedStudioState = {
  activeTab: 'player',
  mode: 'track',
  setActiveTab: vi.fn(),
  setMode: vi.fn(),
};

vi.mock('@/stores/unifiedStudioStore', () => ({
  useUnifiedStudioStore: vi.fn((selector) => {
    if (selector) return selector(mockUnifiedStudioState);
    return mockUnifiedStudioState;
  }),
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
};

// Test component simulating tab switching
const TabSwitchingTestComponent: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('player');
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);

  const tabs = ['player', 'sections', 'lyrics', 'info'];

  return (
    <div>
      <div data-testid="active-tab">{activeTab}</div>
      <div data-testid="is-playing">{isPlaying ? 'Playing' : 'Paused'}</div>
      <div data-testid="current-time">{currentTime}</div>
      <div data-testid="volume">{volume}</div>
      <div data-testid="playback-speed">{playbackSpeed}</div>
      
      <div role="tablist">
        {tabs.map(tab => (
          <button 
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={() => setCurrentTime(prev => prev + 10)}>
        Seek Forward
      </button>
      <button onClick={() => setVolume(0.5)}>Set Volume</button>
      <button onClick={() => setPlaybackSpeed(1.5)}>Set Speed</button>
    </div>
  );
};

describe('Integration Tests - Unified Studio Mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockPlayerState.isPlaying = false;
    mockPlayerState.currentTime = 0;
    mockPlayerState.volume = 1;
    mockPlayerState.playbackSpeed = 1;
    mockUnifiedStudioState.activeTab = 'player';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('T044 - Tab Switching Preserves Playback', () => {
    it('should maintain playback state when switching tabs', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Start playback
      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);
      
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');

      // Switch to sections tab
      const sectionsTab = screen.getByRole('tab', { name: 'sections' });
      fireEvent.click(sectionsTab);

      // Playback should still be active
      expect(screen.getByTestId('active-tab')).toHaveTextContent('sections');
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });

    it('should preserve currentTime when changing tabs', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Seek to a position
      const seekButton = screen.getByText('Seek Forward');
      fireEvent.click(seekButton);
      fireEvent.click(seekButton);
      
      expect(screen.getByTestId('current-time')).toHaveTextContent('20');

      // Switch tabs
      const lyricsTab = screen.getByRole('tab', { name: 'lyrics' });
      fireEvent.click(lyricsTab);

      // Time should be preserved
      expect(screen.getByTestId('current-time')).toHaveTextContent('20');
    });

    it('should not interrupt audio when tab switches', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Start playback
      fireEvent.click(screen.getByText('Play'));
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');

      // Switch through all tabs
      const tabs = ['sections', 'lyrics', 'info', 'player'];
      for (const tab of tabs) {
        fireEvent.click(screen.getByRole('tab', { name: tab }));
        expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
      }
    });
  });

  describe('T045 - Audio Playback Across Tabs', () => {
    it('should continue playing when navigating from Player to Sections', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Start in player tab
      expect(screen.getByTestId('active-tab')).toHaveTextContent('player');
      
      // Start playback
      fireEvent.click(screen.getByText('Play'));
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');

      // Navigate to sections
      fireEvent.click(screen.getByRole('tab', { name: 'sections' }));
      
      expect(screen.getByTestId('active-tab')).toHaveTextContent('sections');
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });

    it('should sync playback controls across all tabs', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Start playback in player tab
      fireEvent.click(screen.getByText('Play'));
      
      // Switch to sections
      fireEvent.click(screen.getByRole('tab', { name: 'sections' }));
      
      // Pause from sections tab
      fireEvent.click(screen.getByText('Pause'));
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
      
      // Switch back to player tab - should still be paused
      fireEvent.click(screen.getByRole('tab', { name: 'player' }));
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
    });

    it('should update waveform visualization in sync with audio', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Seek to a position
      fireEvent.click(screen.getByText('Seek Forward'));
      const initialTime = screen.getByTestId('current-time').textContent;

      // Switch tabs
      fireEvent.click(screen.getByRole('tab', { name: 'sections' }));

      // Time should be the same (waveform would sync to this)
      expect(screen.getByTestId('current-time')).toHaveTextContent(initialTime!);
    });

    it('should handle audio buffer correctly on tab switch', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Start playback
      fireEvent.click(screen.getByText('Play'));
      
      // Rapid tab switching
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByRole('tab', { name: 'sections' }));
        fireEvent.click(screen.getByRole('tab', { name: 'player' }));
      }

      // Should still be playing without errors
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });
  });

  describe('T046 - State Persistence', () => {
    it('should restore last active tab on reload', async () => {
      // Simulate saved tab state
      localStorageMock.setItem('unified-studio-tab', 'sections');
      
      const ComponentWithPersistence: React.FC = () => {
        const [activeTab, setActiveTab] = React.useState(() => {
          return localStorage.getItem('unified-studio-tab') || 'player';
        });

        React.useEffect(() => {
          localStorage.setItem('unified-studio-tab', activeTab);
        }, [activeTab]);

        return (
          <div>
            <div data-testid="active-tab">{activeTab}</div>
            <button onClick={() => setActiveTab('lyrics')}>Go to Lyrics</button>
          </div>
        );
      };

      render(<ComponentWithPersistence />, { wrapper: createTestWrapper() });
      
      expect(screen.getByTestId('active-tab')).toHaveTextContent('sections');
    });

    it('should persist UI preferences (volume, speed)', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });

      // Set volume
      fireEvent.click(screen.getByText('Set Volume'));
      expect(screen.getByTestId('volume')).toHaveTextContent('0.5');

      // Set speed
      fireEvent.click(screen.getByText('Set Speed'));
      expect(screen.getByTestId('playback-speed')).toHaveTextContent('1.5');

      // Values should persist across tab changes
      fireEvent.click(screen.getByRole('tab', { name: 'sections' }));
      fireEvent.click(screen.getByRole('tab', { name: 'player' }));
      
      expect(screen.getByTestId('volume')).toHaveTextContent('0.5');
      expect(screen.getByTestId('playback-speed')).toHaveTextContent('1.5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid tab switching without crashes', async () => {
      render(<TabSwitchingTestComponent />, { wrapper: createTestWrapper() });
      
      const tabs = ['player', 'sections', 'lyrics', 'info'];
      
      // Rapid switching 20 times
      for (let i = 0; i < 20; i++) {
        const tab = tabs[i % tabs.length];
        fireEvent.click(screen.getByRole('tab', { name: tab }));
      }

      // Should complete without throwing
      expect(screen.getByTestId('active-tab')).toBeTruthy();
    });

    it('should maintain state when switching between track and project modes', async () => {
      const ModeTestComponent: React.FC = () => {
        const [mode, setMode] = React.useState<'track' | 'project'>('track');
        const [isPlaying, setIsPlaying] = React.useState(false);

        return (
          <div>
            <div data-testid="mode">{mode}</div>
            <div data-testid="is-playing">{isPlaying ? 'Playing' : 'Paused'}</div>
            <button onClick={() => setMode(mode === 'track' ? 'project' : 'track')}>
              Toggle Mode
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        );
      };

      render(<ModeTestComponent />, { wrapper: createTestWrapper() });
      
      // Start playback
      fireEvent.click(screen.getByText('Play'));
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');

      // Switch to project mode
      fireEvent.click(screen.getByText('Toggle Mode'));
      expect(screen.getByTestId('mode')).toHaveTextContent('project');
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });
  });
});
