/**
 * useStudioOperationLock
 * 
 * Manages operation availability based on track state:
 * - Fresh track: all operations available
 * - After extend/replace_section: still available (operates on updated track)
 * - After separate_stems: blocks extend/replace_section (requires save as new version)
 * 
 * @see ADR-011 for architecture decisions
 */

import { useMemo, useCallback } from 'react';
import { StudioProject, StudioTrack } from '@/stores/useUnifiedStudioStore';

export type StudioOperation = 
  | 'generate'
  | 'extend' 
  | 'replace_section' 
  | 'add_instrumental' 
  | 'add_vocals'
  | 'separate_stems' 
  | 'cover'
  | 'replace_instrumental'
  | 'save_as_version';

interface OperationLockResult {
  /** Whether stems exist in the project */
  hasStems: boolean;
  /** Whether any track is pending/processing */
  hasPendingTracks: boolean;
  /** Whether any section has been replaced */
  hasReplacedSections: boolean;
  /** Current track version (for versioning) */
  trackVersion: number;
  /** Check if operation is allowed */
  isOperationAllowed: (op: StudioOperation) => boolean;
  /** Get reason why operation is blocked (null if allowed) */
  getBlockReason: (op: StudioOperation) => string | null;
  /** List of currently blocked operations */
  blockedOperations: StudioOperation[];
  /** Whether user can save as new version to bypass blocks */
  canSaveAsNewVersion: boolean;
  /** Get all operations with their availability status */
  getOperationStates: () => OperationState[];
}

export interface OperationState {
  operation: StudioOperation;
  allowed: boolean;
  reason: string | null;
  label: string;
}

const STEM_TYPES = ['vocal', 'instrumental', 'drums', 'bass', 'other'] as const;

const OPERATION_LABELS: Record<StudioOperation, string> = {
  generate: 'Создать',
  extend: 'Расширить',
  replace_section: 'Заменить секцию',
  add_instrumental: 'Добавить инструментал',
  add_vocals: 'Добавить вокал',
  separate_stems: 'Разделить на стемы',
  cover: 'Кавер',
  replace_instrumental: 'Заменить инструментал',
  save_as_version: 'Сохранить как версию',
};

export function useStudioOperationLock(project: StudioProject | null): OperationLockResult {
  // Check if project has separated stems
  const hasStems = useMemo(() => {
    if (!project?.tracks) return false;
    return project.tracks.some(t => STEM_TYPES.includes(t.type as typeof STEM_TYPES[number]));
  }, [project?.tracks]);

  // Check if any track is pending/processing
  const hasPendingTracks = useMemo(() => {
    if (!project?.tracks) return false;
    return project.tracks.some(t => t.status === 'pending' || t.status === 'processing');
  }, [project?.tracks]);

  // Check if any section has been replaced (would be tracked via metadata)
  const hasReplacedSections = useMemo(() => {
    if (!project?.tracks) return false;
    // Check for tracks that have version history indicating replace_section
    return project.tracks.some(t => 
      t.versions && t.versions.some(v => 
        v.metadata?.version_type === 'replace_section'
      )
    );
  }, [project?.tracks]);

  // Get current track version number
  const trackVersion = useMemo(() => {
    if (!project?.tracks) return 1;
    const mainTrack = project.tracks.find(t => t.type === 'main');
    return mainTrack?.versions?.length || 1;
  }, [project?.tracks]);

  // Whether save as new version is available
  const canSaveAsNewVersion = useMemo(() => {
    // Can save as new version if stems exist (to bypass stem blocks)
    return hasStems;
  }, [hasStems]);

  // Get list of blocked operations
  const blockedOperations = useMemo((): StudioOperation[] => {
    const blocked: StudioOperation[] = [];

    // When stems exist, extending or replacing sections would invalidate stems
    if (hasStems) {
      blocked.push('extend', 'replace_section');
      // Already have stems, can't separate again
      blocked.push('separate_stems');
    }

    // When pending tracks exist, block most generation operations
    if (hasPendingTracks) {
      blocked.push(
        'generate',
        'extend', 
        'replace_section', 
        'add_instrumental', 
        'add_vocals', 
        'cover', 
        'replace_instrumental',
        'separate_stems'
      );
    }

    return [...new Set(blocked)];
  }, [hasStems, hasPendingTracks]);

  // Check if specific operation is allowed
  const isOperationAllowed = useCallback((op: StudioOperation): boolean => {
    return !blockedOperations.includes(op);
  }, [blockedOperations]);

  // Get human-readable block reason
  const getBlockReason = useCallback((op: StudioOperation): string | null => {
    // Pending tracks block everything
    if (hasPendingTracks) {
      const pendingOps: StudioOperation[] = [
        'generate', 'extend', 'replace_section', 'add_instrumental', 
        'add_vocals', 'cover', 'replace_instrumental', 'separate_stems'
      ];
      if (pendingOps.includes(op)) {
        return 'Дождитесь завершения текущей генерации.';
      }
    }

    // Stems block structural changes
    if (hasStems) {
      if (op === 'extend' || op === 'replace_section') {
        return 'Стемы блокируют изменение структуры трека. Создайте новую версию для продолжения редактирования.';
      }
      if (op === 'separate_stems') {
        return 'Стемы уже разделены.';
      }
    }

    return null;
  }, [hasStems, hasPendingTracks]);

  // Get all operations with their states
  const getOperationStates = useCallback((): OperationState[] => {
    const allOps: StudioOperation[] = [
      'generate', 'extend', 'replace_section', 'cover',
      'add_vocals', 'add_instrumental', 'separate_stems', 
      'replace_instrumental', 'save_as_version'
    ];

    return allOps.map(op => ({
      operation: op,
      allowed: isOperationAllowed(op),
      reason: getBlockReason(op),
      label: OPERATION_LABELS[op],
    }));
  }, [isOperationAllowed, getBlockReason]);

  return {
    hasStems,
    hasPendingTracks,
    hasReplacedSections,
    trackVersion,
    isOperationAllowed,
    getBlockReason,
    blockedOperations,
    canSaveAsNewVersion,
    getOperationStates,
  };
}
