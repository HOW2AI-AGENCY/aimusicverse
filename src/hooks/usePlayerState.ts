import { create } from 'zustand';
import { Track } from '@/hooks/useTracksOptimized';

interface PlayerState {
  activeTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  closePlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeTrack: null,
  isPlaying: false,
  playTrack: (track) => {
    const { activeTrack, isPlaying } = get();
    // If the same track is played, and it's not currently playing, just resume.
    if (activeTrack && activeTrack.id === track.id && !isPlaying) {
      set({ isPlaying: true });
    } else if (activeTrack?.id !== track.id) {
      // If a new track is played, set it as active and play.
      set({ activeTrack: track, isPlaying: true });
    }
    // If the same track is played and it's already playing, do nothing.
  },
  pauseTrack: () => set({ isPlaying: false }),
  closePlayer: () => set({ activeTrack: null, isPlaying: false }),
}));
