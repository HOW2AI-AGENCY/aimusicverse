/**
 * Hook that bridges the LyricsWizard store with the state machine
 * Provides type-safe transitions while maintaining store compatibility
 */

import { useCallback, useEffect } from 'react';
import { 
  useStateMachine, 
  lyricsWizardMachineConfig,
  LyricsWizardState,
  LyricsWizardEvent,
  LyricsWizardContext 
} from '@/lib/stateMachine';
import { useLyricsWizardStore } from '@/stores/lyricsWizardStore';

// Map numeric steps to state machine states
const STEP_TO_STATE: Record<number, LyricsWizardState> = {
  1: 'concept',
  2: 'structure',
  3: 'writing',
  4: 'enrichment',
  5: 'validation',
};

const STATE_TO_STEP: Record<LyricsWizardState, number> = {
  concept: 1,
  structure: 2,
  writing: 3,
  enrichment: 4,
  validation: 5,
};

export function useLyricsWizardMachine() {
  const store = useLyricsWizardStore();
  const machine = useStateMachine<LyricsWizardState, LyricsWizardContext, LyricsWizardEvent>(
    lyricsWizardMachineConfig
  );

  // Sync store step with machine state
  useEffect(() => {
    const machineStep = STATE_TO_STEP[machine.state];
    if (store.step !== machineStep) {
      store.setStep(machineStep);
    }
  }, [machine.state, store.step, store.setStep]);

  // Type-safe navigation methods
  const next = useCallback(() => {
    if (machine.can('NEXT')) {
      machine.send('NEXT');
    }
  }, [machine]);

  const back = useCallback(() => {
    if (machine.can('BACK')) {
      machine.send('BACK');
    }
  }, [machine]);

  const jumpTo = useCallback((step: LyricsWizardState) => {
    const event = `JUMP_TO_${step.toUpperCase()}` as LyricsWizardEvent;
    if (machine.can(event)) {
      machine.send(event);
    }
  }, [machine]);

  const resetWizard = useCallback(() => {
    machine.reset();
    store.reset();
  }, [machine, store]);

  // Validation helpers
  const canProceed = useCallback((): boolean => {
    const { step, concept, structure, writing, validation } = store;
    switch (step) {
      case 1:
        return concept.theme.trim().length > 0;
      case 2:
        return structure.sections.length > 0;
      case 3:
        return writing.sections.some(s => s.content.trim().length > 0);
      case 4:
        return true; // Tags are optional
      case 5:
        return validation.isValid || validation.warnings.length === 0;
      default:
        return true;
    }
  }, [store]);

  return {
    // Current state
    state: machine.state,
    step: STATE_TO_STEP[machine.state],
    context: machine.context,
    
    // Navigation
    next,
    back,
    jumpTo,
    reset: resetWizard,
    
    // Checks
    canProceed,
    canGoNext: machine.can('NEXT') && canProceed(),
    canGoBack: machine.can('BACK'),
    
    // Store access for data
    store,
  };
}
