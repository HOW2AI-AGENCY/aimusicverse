/**
 * Zustand Store Slices
 * 
 * Modular slices for building composable stores.
 * Each slice handles a specific domain of state.
 */

export {
  createStemMixerSlice,
  selectStemState,
  selectMasterControls,
  selectHasSoloStems,
  type StemState,
  type StemMixerState,
  type StemMixerActions,
  type StemMixerSlice,
} from './stemMixerSlice';

export {
  createPlaybackSlice,
  selectPlaybackStatus,
  selectLoopState,
  selectProgress,
  type LoopMode,
  type LoopRegion,
  type PlaybackState,
  type PlaybackActions,
  type PlaybackSlice,
} from './playbackSlice';
