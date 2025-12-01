import { create } from 'zustand';
import { Track } from '@/hooks/useTracksOptimized';

interface PlayerState {
  activeTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  closePlayer: () => void;
}

export const playerLogic = {
  playTrack: (
    set: (state: Partial<PlayerState>) => void,
    get: () => PlayerState,
    track: Track
  ) => {
    const { activeTrack, isPlaying } = get();
    if (activeTrack && activeTrack.id === track.id && !isPlaying) {
      set({ isPlaying: true });
    } else if (activeTrack?.id !== track.id) {
      set({ activeTrack: track, isPlaying: true });
    }
  },
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeTrack: null,
  isPlaying: false,
  playTrack: (track) => playerLogic.playTrack(set, get, track),
  pauseTrack: () => set({ isPlaying: false }),
  closePlayer: () => set({ activeTrack: null, isPlaying: false }),
}));
