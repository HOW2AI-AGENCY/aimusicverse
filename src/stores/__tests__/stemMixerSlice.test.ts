/**
 * Unit tests for stemMixerSlice
 */

import { createStemMixerSlice, selectStemState, selectMasterControls, selectHasSoloStems } from '../slices/stemMixerSlice';

describe('stemMixerSlice', () => {
  const createTestStore = () => {
    let state: ReturnType<typeof createStemMixerSlice>;
    const set = (fn: (s: typeof state) => Partial<typeof state>) => {
      const update = typeof fn === 'function' ? fn(state) : fn;
      state = { ...state, ...update };
    };
    const get = () => state;
    state = createStemMixerSlice(set as any, get as any, {} as any);
    return { get, set };
  };

  describe('initializeStemStates', () => {
    it('should initialize stems with default values', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1', 'stem2', 'stem3']);
      
      expect(get().stemStates).toEqual({
        stem1: { volume: 1, muted: false, solo: false, pan: 0 },
        stem2: { volume: 1, muted: false, solo: false, pan: 0 },
        stem3: { volume: 1, muted: false, solo: false, pan: 0 },
      });
    });

    it('should not reinitialize if stems already exist', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      get().setStemVolume('stem1', 0.5);
      get().initializeStemStates(['stem1', 'stem2']);
      
      expect(get().stemStates.stem1.volume).toBe(0.5);
      expect(get().stemStates.stem2.volume).toBe(1);
    });
  });

  describe('setStemVolume', () => {
    it('should set stem volume', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      get().setStemVolume('stem1', 0.7);
      
      expect(get().stemStates.stem1.volume).toBe(0.7);
    });

    it('should clamp volume to 0-1 range', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      
      get().setStemVolume('stem1', 1.5);
      expect(get().stemStates.stem1.volume).toBe(1);
      
      get().setStemVolume('stem1', -0.5);
      expect(get().stemStates.stem1.volume).toBe(0);
    });

    it('should create stem if not exists', () => {
      const { get } = createTestStore();
      get().setStemVolume('newStem', 0.5);
      expect(get().stemStates.newStem.volume).toBe(0.5);
    });
  });

  describe('toggleStemMute', () => {
    it('should toggle mute state', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      
      expect(get().stemStates.stem1.muted).toBe(false);
      get().toggleStemMute('stem1');
      expect(get().stemStates.stem1.muted).toBe(true);
      get().toggleStemMute('stem1');
      expect(get().stemStates.stem1.muted).toBe(false);
    });
  });

  describe('toggleStemSolo', () => {
    it('should toggle solo state', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      
      expect(get().stemStates.stem1.solo).toBe(false);
      get().toggleStemSolo('stem1');
      expect(get().stemStates.stem1.solo).toBe(true);
      get().toggleStemSolo('stem1');
      expect(get().stemStates.stem1.solo).toBe(false);
    });

    it('should update hasSoloStems', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1', 'stem2']);
      
      expect(get().hasSoloStems).toBe(false);
      get().toggleStemSolo('stem1');
      expect(get().hasSoloStems).toBe(true);
      get().toggleStemSolo('stem1');
      expect(get().hasSoloStems).toBe(false);
    });
  });

  describe('setStemPan', () => {
    it('should set stem pan', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      get().setStemPan('stem1', -0.5);
      
      expect(get().stemStates.stem1.pan).toBe(-0.5);
    });

    it('should clamp pan to -1 to 1 range', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      
      get().setStemPan('stem1', 2);
      expect(get().stemStates.stem1.pan).toBe(1);
      
      get().setStemPan('stem1', -2);
      expect(get().stemStates.stem1.pan).toBe(-1);
    });
  });

  describe('muteAllStems / unmuteAllStems', () => {
    it('should mute all stems', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1', 'stem2', 'stem3']);
      get().muteAllStems();
      
      expect(get().stemStates.stem1.muted).toBe(true);
      expect(get().stemStates.stem2.muted).toBe(true);
      expect(get().stemStates.stem3.muted).toBe(true);
    });

    it('should unmute all stems', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1', 'stem2']);
      get().muteAllStems();
      get().unmuteAllStems();
      
      expect(get().stemStates.stem1.muted).toBe(false);
      expect(get().stemStates.stem2.muted).toBe(false);
    });
  });

  describe('clearAllSolo', () => {
    it('should clear all solo states', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1', 'stem2']);
      get().toggleStemSolo('stem1');
      get().toggleStemSolo('stem2');
      get().clearAllSolo();
      
      expect(get().stemStates.stem1.solo).toBe(false);
      expect(get().stemStates.stem2.solo).toBe(false);
      expect(get().hasSoloStems).toBe(false);
    });
  });

  describe('master controls', () => {
    it('should set master volume', () => {
      const { get } = createTestStore();
      get().setMasterVolume(0.8);
      expect(get().masterVolume).toBe(0.8);
    });

    it('should toggle master mute', () => {
      const { get } = createTestStore();
      expect(get().masterMuted).toBe(false);
      get().toggleMasterMute();
      expect(get().masterMuted).toBe(true);
    });

    it('should set master pan', () => {
      const { get } = createTestStore();
      get().setMasterPan(-0.3);
      expect(get().masterPan).toBe(-0.3);
    });
  });

  describe('getEffectiveVolume', () => {
    it('should return 0 when master is muted', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      get().toggleMasterMute();
      
      expect(get().getEffectiveVolume('stem1')).toBe(0);
    });

    it('should return 0 when stem is muted', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      get().toggleStemMute('stem1');
      
      expect(get().getEffectiveVolume('stem1')).toBe(0);
    });

    it('should return 0 when another stem is solo', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1', 'stem2']);
      get().toggleStemSolo('stem2');
      
      expect(get().getEffectiveVolume('stem1')).toBe(0);
      // stem2 has effective volume = stem2.volume * masterVolume
      expect(get().getEffectiveVolume('stem2')).toBeCloseTo(0.85);
    });

    it('should calculate effective volume correctly', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1']);
      get().setStemVolume('stem1', 0.5);
      get().setMasterVolume(0.8);
      
      expect(get().getEffectiveVolume('stem1')).toBeCloseTo(0.4);
    });
  });

  describe('selectors', () => {
    it('selectStemState should return stem state or default', () => {
      const state = {
        stemStates: { stem1: { volume: 0.5, muted: true, solo: false, pan: 0.2 } },
      } as any;
      
      const selector = selectStemState('stem1');
      expect(selector(state)).toEqual({
        volume: 0.5,
        muted: true,
        solo: false,
        pan: 0.2,
      });
      
      const defaultSelector = selectStemState('nonexistent');
      expect(defaultSelector(state)).toEqual({
        volume: 1,
        muted: false,
        solo: false,
        pan: 0,
      });
    });

    it('selectMasterControls should return master state', () => {
      const state = { masterVolume: 0.7, masterMuted: true, masterPan: 0.1 } as any;
      expect(selectMasterControls(state)).toEqual({
        masterVolume: 0.7,
        masterMuted: true,
        masterPan: 0.1,
      });
    });

    it('selectHasSoloStems should detect solo stems', () => {
      expect(selectHasSoloStems({ hasSoloStems: false } as any)).toBe(false);
      expect(selectHasSoloStems({ hasSoloStems: true } as any)).toBe(true);
    });
  });

  describe('resetStemStates', () => {
    it('should reset all state to defaults', () => {
      const { get } = createTestStore();
      get().initializeStemStates(['stem1', 'stem2']);
      get().setStemVolume('stem1', 0.5);
      get().toggleStemMute('stem1');
      get().toggleStemSolo('stem2');
      get().setMasterVolume(0.3);
      get().toggleMasterMute();
      
      get().resetStemStates();
      
      expect(get().masterVolume).toBe(0.85);
      expect(get().masterMuted).toBe(false);
      expect(get().stemStates.stem1.volume).toBe(1);
      expect(get().stemStates.stem1.muted).toBe(false);
      expect(get().stemStates.stem2.solo).toBe(false);
      expect(get().hasSoloStems).toBe(false);
    });
  });
});
