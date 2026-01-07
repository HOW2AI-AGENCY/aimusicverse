/**
 * Modal state machine for UnifiedStudioMobile
 * Replaces 10+ individual useState calls with single state
 */

import { useState, useCallback, useMemo } from 'react';

// All possible modal types
export type StudioModalType =
  | 'none'
  | 'addTrack'
  | 'export'
  | 'saveVersion'
  | 'stemSeparation'
  | 'extend'
  | 'remix'
  | 'addVocals'
  | 'record'
  | 'notation'
  | 'chordSheet'
  | 'addInstrumental';

interface ModalPayload {
  /** Track selected for notation/chords */
  selectedTrack?: any;
}

interface ModalState {
  type: StudioModalType;
  payload: ModalPayload;
}

interface UseStudioModalsResult {
  /** Current active modal */
  activeModal: StudioModalType;
  /** Payload data for modal */
  payload: ModalPayload;
  /** Open a specific modal */
  open: (type: StudioModalType, payload?: ModalPayload) => void;
  /** Close current modal */
  close: () => void;
  /** Check if specific modal is open */
  isOpen: (type: StudioModalType) => boolean;
  /** Get open change handler for a specific modal */
  getOpenChangeHandler: (type: StudioModalType) => (open: boolean) => void;
}

/**
 * Hook for managing studio modal state
 * Single source of truth for all dialogs/drawers
 */
export function useStudioModals(): UseStudioModalsResult {
  const [state, setState] = useState<ModalState>({
    type: 'none',
    payload: {},
  });

  const open = useCallback((type: StudioModalType, payload: ModalPayload = {}) => {
    setState({ type, payload });
  }, []);

  const close = useCallback(() => {
    setState({ type: 'none', payload: {} });
  }, []);

  const isOpen = useCallback(
    (type: StudioModalType) => state.type === type,
    [state.type]
  );

  // Memoized handler factory - returns stable handler for each modal type
  const getOpenChangeHandler = useCallback(
    (type: StudioModalType) => (isOpen: boolean) => {
      if (isOpen) {
        setState(prev => ({ type, payload: prev.payload }));
      } else {
        setState({ type: 'none', payload: {} });
      }
    },
    []
  );

  return {
    activeModal: state.type,
    payload: state.payload,
    open,
    close,
    isOpen,
    getOpenChangeHandler,
  };
}

/**
 * Pre-built modal open handlers for common use cases
 */
export function useStudioModalHandlers(
  modals: UseStudioModalsResult,
  hapticPattern?: () => void
) {
  const withHaptic = useCallback(
    (fn: () => void) => () => {
      hapticPattern?.();
      fn();
    },
    [hapticPattern]
  );

  return useMemo(
    () => ({
      openAddTrack: withHaptic(() => modals.open('addTrack')),
      openExport: withHaptic(() => modals.open('export')),
      openSaveVersion: withHaptic(() => modals.open('saveVersion')),
      openStemSeparation: withHaptic(() => modals.open('stemSeparation')),
      openExtend: withHaptic(() => modals.open('extend')),
      openRemix: withHaptic(() => modals.open('remix')),
      openAddVocals: withHaptic(() => modals.open('addVocals')),
      openRecord: withHaptic(() => modals.open('record')),
      openNotation: (track: any) => {
        hapticPattern?.();
        modals.open('notation', { selectedTrack: track });
      },
      openChordSheet: (track: any) => {
        hapticPattern?.();
        modals.open('chordSheet', { selectedTrack: track });
      },
      openAddInstrumental: withHaptic(() => modals.open('addInstrumental')),
    }),
    [modals, hapticPattern, withHaptic]
  );
}
