/**
 * T078: Unit tests for useStudioState hook
 * Tests for unified studio state management with proper memoization
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useStudioState } from '@/hooks/studio/useStudioState';

// Mock stem data
const mockStems = [
  { id: 'stem-1', name: 'Vocals', url: 'https://example.com/vocals.mp3' },
  { id: 'stem-2', name: 'Drums', url: 'https://example.com/drums.mp3' },
  { id: 'stem-3', name: 'Bass', url: 'https://example.com/bass.mp3' },
];

describe('T078 - useStudioState', () => {
  describe('Initialization', () => {
    it('should initialize with default stem states', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      expect(result.current.stemStates).toEqual({
        'stem-1': { volume: 1, muted: false, solo: false, pan: 0 },
        'stem-2': { volume: 1, muted: false, solo: false, pan: 0 },
        'stem-3': { volume: 1, muted: false, solo: false, pan: 0 },
      });
    });

    it('should initialize with custom master volume', () => {
      const { result } = renderHook(() =>
        useStudioState({
          stems: mockStems,
          initialMasterVolume: 0.8,
        })
      );

      expect(result.current.masterVolume).toBe(0.8);
    });

    it('should get stem state for individual stem', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      const state = result.current.getStemState('stem-1');
      expect(state).toEqual({
        volume: 1,
        muted: false,
        solo: false,
        pan: 0,
      });
    });

    it('should return default state for non-existent stem', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      const state = result.current.getStemState('non-existent');
      expect(state).toEqual({
        volume: 1,
        muted: false,
        solo: false,
        pan: 0,
      });
    });
  });

  describe('Volume Controls', () => {
    it('should set stem volume', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setStemVolume('stem-1', 0.5);
      });

      expect(result.current.stemStates['stem-1'].volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setStemVolume('stem-1', 1.5);
      });

      expect(result.current.stemStates['stem-1'].volume).toBe(1);

      act(() => {
        result.current.setStemVolume('stem-1', -0.5);
      });

      expect(result.current.stemStates['stem-1'].volume).toBe(0);
    });

    it('should set master volume', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setMasterVolume(0.7);
      });

      expect(result.current.masterVolume).toBe(0.7);
    });

    it('should calculate effective volume with master', () => {
      const { result } = renderHook(() =>
        useStudioState({
          stems: mockStems,
          initialMasterVolume: 0.5,
        })
      );

      act(() => {
        result.current.setStemVolume('stem-1', 0.8);
      });

      const effective = result.current.getEffectiveVolume('stem-1');
      expect(effective).toBe(0.4); // 0.8 * 0.5
    });
  });

  describe('Mute Controls', () => {
    it('should toggle mute state', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      expect(result.current.stemStates['stem-1'].muted).toBe(false);

      act(() => {
        result.current.toggleMute('stem-1');
      });

      expect(result.current.stemStates['stem-1'].muted).toBe(true);

      act(() => {
        result.current.toggleMute('stem-1');
      });

      expect(result.current.stemStates['stem-1'].muted).toBe(false);
    });

    it('should mute all stems', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.muteAll();
      });

      expect(result.current.stemStates['stem-1'].muted).toBe(true);
      expect(result.current.stemStates['stem-2'].muted).toBe(true);
      expect(result.current.stemStates['stem-3'].muted).toBe(true);
    });

    it('should unmute all stems', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      // First mute all
      act(() => {
        result.current.muteAll();
      });

      // Then unmute all
      act(() => {
        result.current.unmuteAll();
      });

      expect(result.current.stemStates['stem-1'].muted).toBe(false);
      expect(result.current.stemStates['stem-2'].muted).toBe(false);
      expect(result.current.stemStates['stem-3'].muted).toBe(false);
    });

    it('should track muted stem IDs', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.toggleMute('stem-1');
        result.current.toggleMute('stem-3');
      });

      expect(result.current.mutedStemIds).toEqual(['stem-1', 'stem-3']);
    });

    it('should return zero effective volume when muted', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setStemVolume('stem-1', 0.8);
        result.current.toggleMute('stem-1');
      });

      const effective = result.current.getEffectiveVolume('stem-1');
      expect(effective).toBe(0);
    });
  });

  describe('Solo Controls', () => {
    it('should toggle solo state', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      expect(result.current.stemStates['stem-1'].solo).toBe(false);

      act(() => {
        result.current.toggleSolo('stem-1');
      });

      expect(result.current.stemStates['stem-1'].solo).toBe(true);
    });

    it('should track solo stem IDs', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.toggleSolo('stem-1');
        result.current.toggleSolo('stem-2');
      });

      expect(result.current.soloStemIds).toEqual(['stem-1', 'stem-2']);
      expect(result.current.hasSoloStems).toBe(true);
    });

    it('should clear all solo states', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.toggleSolo('stem-1');
        result.current.toggleSolo('stem-2');
        result.current.clearSolo();
      });

      expect(result.current.stemStates['stem-1'].solo).toBe(false);
      expect(result.current.stemStates['stem-2'].solo).toBe(false);
      expect(result.current.hasSoloStems).toBe(false);
    });

    it('should return zero effective volume for non-solo stems when solo is active', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.toggleSolo('stem-1');
      });

      // Solo stem should have volume
      const soloEffective = result.current.getEffectiveVolume('stem-1');
      expect(soloEffective).toBe(1);

      // Non-solo stems should be muted
      const nonSoloEffective = result.current.getEffectiveVolume('stem-2');
      expect(nonSoloEffective).toBe(0);
    });

    it('should correctly identify effectively muted stems', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.toggleSolo('stem-1');
      });

      expect(result.current.isStemEffectivelyMuted('stem-1')).toBe(false);
      expect(result.current.isStemEffectivelyMuted('stem-2')).toBe(true);
      expect(result.current.isStemEffectivelyMuted('stem-3')).toBe(true);
    });
  });

  describe('Master Mute', () => {
    it('should toggle master mute', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      expect(result.current.masterMuted).toBe(false);

      act(() => {
        result.current.setMasterMuted(true);
      });

      expect(result.current.masterMuted).toBe(true);

      act(() => {
        result.current.setMasterMuted(false);
      });

      expect(result.current.masterMuted).toBe(false);
    });

    it('should return zero effective volume when master is muted', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setStemVolume('stem-1', 0.8);
        result.current.setMasterMuted(true);
      });

      const effective = result.current.getEffectiveVolume('stem-1');
      expect(effective).toBe(0);
    });

    it('should identify all stems as muted when master is muted', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setMasterMuted(true);
      });

      expect(result.current.isStemEffectivelyMuted('stem-1')).toBe(true);
      expect(result.current.isStemEffectivelyMuted('stem-2')).toBe(true);
    });
  });

  describe('Pan Controls', () => {
    it('should set stem pan', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setStemPan('stem-1', 0.5);
      });

      expect(result.current.stemStates['stem-1'].pan).toBe(0.5);
    });

    it('should clamp pan to -1 to 1 range', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      act(() => {
        result.current.setStemPan('stem-1', 1.5);
      });

      expect(result.current.stemStates['stem-1'].pan).toBe(1);

      act(() => {
        result.current.setStemPan('stem-1', -1.5);
      });

      expect(result.current.stemStates['stem-1'].pan).toBe(-1);
    });
  });

  describe('Batch Operations', () => {
    it('should set all stem states at once', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      const newStates = {
        'stem-1': { volume: 0.5, muted: true, solo: false, pan: 0 },
        'stem-2': { volume: 0.7, muted: false, solo: true, pan: -0.5 },
        'stem-3': { volume: 1, muted: false, solo: false, pan: 0.5 },
      };

      act(() => {
        result.current.setAllStemStates(newStates);
      });

      expect(result.current.stemStates).toEqual(newStates);
    });
  });

  describe('Reset', () => {
    it('should reset to default values', () => {
      const { result } = renderHook(() =>
        useStudioState({
          stems: mockStems,
          initialMasterVolume: 0.8,
        })
      );

      // Modify states
      act(() => {
        result.current.setMasterVolume(0.5);
        result.current.setMasterMuted(true);
        result.current.setStemVolume('stem-1', 0.3);
        result.current.toggleMute('stem-2');
        result.current.toggleSolo('stem-3');
        result.current.setStemPan('stem-1', 0.7);
      });

      // Reset
      act(() => {
        result.current.resetToDefaults();
      });

      // Check reset values
      expect(result.current.masterVolume).toBe(0.8); // Initial value
      expect(result.current.masterMuted).toBe(false);
      expect(result.current.stemStates['stem-1']).toEqual({
        volume: 1,
        muted: false,
        solo: false,
        pan: 0,
      });
      expect(result.current.stemStates['stem-2']).toEqual({
        volume: 1,
        muted: false,
        solo: false,
        pan: 0,
      });
      expect(result.current.stemStates['stem-3']).toEqual({
        volume: 1,
        muted: false,
        solo: false,
        pan: 0,
      });
    });
  });

  describe('Optimization', () => {
    it('should memoize computed values', () => {
      const { result, rerender } = renderHook(
        ({ stems }) => useStudioState({ stems }),
        {
          initialProps: { stems: mockStems },
        }
      );

      const initialHasSolo = result.current.hasSoloStems;
      const initialMutedIds = result.current.mutedStemIds;
      const initialSoloIds = result.current.soloStemIds;

      // Rerender without changing state
      rerender({ stems: mockStems });

      // References should be stable
      expect(result.current.hasSoloStems).toBe(initialHasSolo);
      expect(result.current.mutedStemIds).toBe(initialMutedIds);
      expect(result.current.soloStemIds).toBe(initialSoloIds);
    });

    it('should update computed values when stem states change', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      expect(result.current.hasSoloStems).toBe(false);

      act(() => {
        result.current.toggleSolo('stem-1');
      });

      expect(result.current.hasSoloStems).toBe(true);
      expect(result.current.soloStemIds).toEqual(['stem-1']);
    });

    it('should not update state if value is unchanged', () => {
      const { result } = renderHook(() =>
        useStudioState({ stems: mockStems })
      );

      const initialState = result.current.stemStates;

      act(() => {
        result.current.setStemVolume('stem-1', 1); // Already 1
      });

      // State reference should not change (no re-render)
      expect(result.current.stemStates).toBe(initialState);
    });
  });
});
