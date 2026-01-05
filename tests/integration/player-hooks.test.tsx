/**
 * Integration Tests for Player with Extracted Hooks
 * 
 * Tests for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T044 - Integration test for player state management via hooks
 * 
 * Tests interaction between usePlayerControls and actual player components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/hooks/audio/usePlayerState', () => ({
  usePlayerStore: vi.fn((selector) => {
    const state = {
      activeTrack: null,
      isPlaying: false,
      volume: 1,
      queue: [],
      playTrack: vi.fn(),
      pauseTrack: vi.fn(),
      setVolume: vi.fn(),
      addToQueue: vi.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));

vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    impact: vi.fn(),
    notification: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Test component that uses usePlayerStore
function PlayerTestComponent() {
  const activeTrack = usePlayerStore((s) => s.activeTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const queue = usePlayerStore((s) => s.queue);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const pauseTrack = usePlayerStore((s) => s.pauseTrack);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  };

  return (
    <div>
      <div data-testid="current-track">
        {activeTrack ? activeTrack.title : 'No track'}
      </div>
      <div data-testid="is-playing">{isPlaying ? 'Playing' : 'Paused'}</div>
      <div data-testid="volume">{volume}</div>
      <div data-testid="queue-length">{queue.length}</div>
      
      <button
        onClick={() => playTrack({
          id: 'test-1',
          title: 'Test Track',
          audio_url: 'test.mp3',
        } as any)}
      >
        Play Track
      </button>
      <button onClick={pauseTrack}>Pause</button>
      <button onClick={togglePlayPause}>Toggle</button>
      <button onClick={() => setVolume(0.5)}>Set Volume</button>
      <button onClick={() => addToQueue({
        id: 'test-2',
        title: 'Queued Track',
        audio_url: 'test2.mp3',
      } as any)}>
        Add to Queue
      </button>
    </div>
  );
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('Player Integration with usePlayerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render player component with hook integration', () => {
    render(<PlayerTestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('current-track')).toHaveTextContent('No track');
    expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
    expect(screen.getByTestId('volume')).toHaveTextContent('1');
  });

  it('should play track through hook', async () => {
    const user = userEvent.setup();
    render(<PlayerTestComponent />, { wrapper: createWrapper() });

    const playButton = screen.getByText('Play Track');
    await user.click(playButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-track')).toHaveTextContent('Test Track');
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });
  });

  it('should pause playback through hook', async () => {
    const user = userEvent.setup();
    render(<PlayerTestComponent />, { wrapper: createWrapper() });

    // First play
    await user.click(screen.getByText('Play Track'));
    
    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });

    // Then pause
    await user.click(screen.getByText('Pause'));

    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
    });
  });

  it('should toggle play/pause through hook', async () => {
    const user = userEvent.setup();
    render(<PlayerTestComponent />, { wrapper: createWrapper() });

    const toggleButton = screen.getByText('Toggle');

    // First play a track
    await user.click(screen.getByText('Play Track'));
    
    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });

    // Toggle to pause
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
    });

    // Toggle back to play
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });
  });

  it('should manage volume through hook', async () => {
    const user = userEvent.setup();
    render(<PlayerTestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('volume')).toHaveTextContent('1');

    await user.click(screen.getByText('Set Volume'));

    await waitFor(() => {
      expect(screen.getByTestId('volume')).toHaveTextContent('0.5');
    });
  });

  it('should manage queue through hook', async () => {
    const user = userEvent.setup();
    render(<PlayerTestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId('queue-length')).toHaveTextContent('0');

    await user.click(screen.getByText('Add to Queue'));

    await waitFor(() => {
      expect(screen.getByTestId('queue-length')).toHaveTextContent('1');
    });
  });

  it('should handle multiple operations in sequence', async () => {
    const user = userEvent.setup();
    render(<PlayerTestComponent />, { wrapper: createWrapper() });

    // Play a track
    await user.click(screen.getByText('Play Track'));
    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Playing');
    });

    // Change volume
    await user.click(screen.getByText('Set Volume'));
    await waitFor(() => {
      expect(screen.getByTestId('volume')).toHaveTextContent('0.5');
    });

    // Add to queue
    await user.click(screen.getByText('Add to Queue'));
    await waitFor(() => {
      expect(screen.getByTestId('queue-length')).toHaveTextContent('1');
    });

    // Pause
    await user.click(screen.getByText('Pause'));
    await waitFor(() => {
      expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
    });
  });
});
