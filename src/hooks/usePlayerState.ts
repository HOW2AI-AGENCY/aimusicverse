import { create } from 'zustand';
import { Track } from '@/hooks/useTracksOptimized';

type RepeatMode = 'off' | 'all' | 'one';
type PlayerMode = 'compact' | 'expanded' | 'fullscreen' | 'minimized';

interface PlayerState {
  activeTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: RepeatMode;
  playerMode: PlayerMode;
  playTrack: (track?: Track) => void;
  pauseTrack: () => void;
  closePlayer: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setPlayerMode: (mode: PlayerMode) => void;
  expandPlayer: () => void;
  minimizePlayer: () => void;
  maximizePlayer: () => void;
}

export const playerLogic = {
  playTrack: (
    set: (state: Partial<PlayerState>) => void,
    get: () => PlayerState,
    track?: Track
  ) => {
    const { activeTrack, isPlaying, queue, currentIndex } = get();
    
    if (track) {
      // Play specific track
      if (activeTrack && activeTrack.id === track.id && !isPlaying) {
        set({ isPlaying: true });
      } else if (activeTrack?.id !== track.id) {
        const trackIndex = queue.findIndex(t => t.id === track.id);
        if (trackIndex !== -1) {
          set({ activeTrack: track, isPlaying: true, currentIndex: trackIndex });
        } else {
          set({ activeTrack: track, isPlaying: true });
        }
      }
    } else {
      // Resume current track or play first in queue
      if (activeTrack) {
        set({ isPlaying: true });
      } else if (queue.length > 0) {
        set({ activeTrack: queue[0], isPlaying: true, currentIndex: 0 });
      }
    }
  },
  
  nextTrack: (
    set: (state: Partial<PlayerState>) => void,
    get: () => PlayerState
  ) => {
    const { queue, currentIndex, repeat, shuffle } = get();
    
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    
    if (shuffle) {
      // Random next track
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }
    
    set({ 
      activeTrack: queue[nextIndex], 
      currentIndex: nextIndex,
      isPlaying: true 
    });
  },
  
  previousTrack: (
    set: (state: Partial<PlayerState>) => void,
    get: () => PlayerState
  ) => {
    const { queue, currentIndex } = get();
    
    if (queue.length === 0) return;
    
    let prevIndex = currentIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }
    
    set({ 
      activeTrack: queue[prevIndex], 
      currentIndex: prevIndex,
      isPlaying: true 
    });
  },
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeTrack: null,
  isPlaying: false,
  queue: [],
  currentIndex: 0,
  shuffle: false,
  repeat: 'off',
  playerMode: 'minimized',
  
  playTrack: (track) => {
    playerLogic.playTrack(set, get, track);
    // Auto-open compact player when playing a track
    const { playerMode } = get();
    if (playerMode === 'minimized') {
      set({ playerMode: 'compact' });
    }
  },
  pauseTrack: () => set({ isPlaying: false }),
  closePlayer: () => set({ activeTrack: null, isPlaying: false, playerMode: 'minimized' }),
  
  nextTrack: () => playerLogic.nextTrack(set, get),
  previousTrack: () => playerLogic.previousTrack(set, get),
  
  addToQueue: (track) => {
    const { queue } = get();
    set({ queue: [...queue, track] });
  },
  
  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    let newCurrentIndex = currentIndex;
    
    if (index < currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (index === currentIndex && newQueue.length > 0) {
      // If removing current track, stay at same index (plays next track)
      if (newCurrentIndex >= newQueue.length) {
        newCurrentIndex = newQueue.length - 1;
      }
      set({ activeTrack: newQueue[newCurrentIndex] });
    }
    
    set({ queue: newQueue, currentIndex: newCurrentIndex });
  },
  
  clearQueue: () => {
    set({ queue: [], currentIndex: 0, activeTrack: null, isPlaying: false });
  },
  
  reorderQueue: (oldIndex, newIndex) => {
    const { queue, currentIndex } = get();
    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(oldIndex, 1);
    newQueue.splice(newIndex, 0, movedItem);
    
    // Update currentIndex if the current track was moved
    let newCurrentIndex = currentIndex;
    if (oldIndex === currentIndex) {
      newCurrentIndex = newIndex;
    } else if (oldIndex < currentIndex && newIndex >= currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (oldIndex > currentIndex && newIndex <= currentIndex) {
      newCurrentIndex = currentIndex + 1;
    }
    
    set({ queue: newQueue, currentIndex: newCurrentIndex });
  },
  
  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },
  
  toggleRepeat: () => {
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeat);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { repeat: modes[nextIndex] };
    });
  },
  
  // Player mode transitions (T043 - Player state management)
  setPlayerMode: (mode) => set({ playerMode: mode }),
  expandPlayer: () => set({ playerMode: 'expanded' }),
  minimizePlayer: () => set({ playerMode: 'compact' }),
  maximizePlayer: () => set({ playerMode: 'fullscreen' }),
}));
