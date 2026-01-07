/**
 * useStemMixerStore
 * 
 * Standalone Zustand store for stem mixing when used outside of unified studio.
 * Uses the stemMixerSlice for consistent behavior.
 * 
 * @example
 * ```tsx
 * const { stemStates, setStemVolume, toggleStemMute } = useStemMixerStore();
 * ```
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createStemMixerSlice, type StemMixerSlice } from './slices';

/**
 * Standalone stem mixer store
 * Use when mixing stems outside of the full studio context
 */
export const useStemMixerStore = create<StemMixerSlice>()(
  subscribeWithSelector((...a) => createStemMixerSlice(...a))
);

/**
 * Hook to get stem state with shallow comparison
 * Optimized to prevent unnecessary re-renders
 */
export function useStemState(stemId: string) {
  return useStemMixerStore((state) => state.stemStates[stemId] || {
    volume: 1,
    pan: 0,
    muted: false,
    solo: false,
  });
}

/**
 * Hook to get stem actions (stable references)
 */
export function useStemActions() {
  return useStemMixerStore((state) => ({
    setStemVolume: state.setStemVolume,
    setStemPan: state.setStemPan,
    toggleStemMute: state.toggleStemMute,
    toggleStemSolo: state.toggleStemSolo,
    initializeStemStates: state.initializeStemStates,
    resetStemStates: state.resetStemStates,
  }));
}

/**
 * Hook to get master controls
 */
export function useMasterControls() {
  return useStemMixerStore((state) => ({
    masterVolume: state.masterVolume,
    masterMuted: state.masterMuted,
    masterPan: state.masterPan,
    setMasterVolume: state.setMasterVolume,
    setMasterPan: state.setMasterPan,
    toggleMasterMute: state.toggleMasterMute,
  }));
}

/**
 * Hook to get effective volume for a stem
 */
export function useEffectiveStemVolume(stemId: string) {
  return useStemMixerStore((state) => state.getEffectiveVolume(stemId));
}

/**
 * Hook to check if stem is effectively muted
 */
export function useIsStemMuted(stemId: string) {
  return useStemMixerStore((state) => state.isStemEffectivelyMuted(stemId));
}
