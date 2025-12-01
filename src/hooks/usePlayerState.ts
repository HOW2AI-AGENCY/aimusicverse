import { create } from 'zustand';
import { Track } from '@/hooks/useTracksOptimized';

interface PlayerState {
  activeTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  closePlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  activeTrack: null,
  isPlaying: false,
  playTrack: (track) => set({ activeTrack: track, isPlaying: true }),
  pauseTrack: () => set({ isPlaying: false }),
  closePlayer: () => set({ activeTrack: null, isPlaying: false }),
}));
