/**
 * useStudioOperationLock
 * 
 * Prevents conflicting operations after track transformations
 * E.g. blocks extend/replace_section when stems exist
 */

import { useMemo, useCallback } from 'react';
import { StudioProject, StudioTrack } from '@/stores/useUnifiedStudioStore';

export type StudioOperation = 
  | 'extend' 
  | 'replace_section' 
  | 'add_instrumental' 
  | 'add_vocals'
  | 'separate_stems' 
  | 'cover'
  | 'replace_instrumental';

interface OperationLockResult {
  /** Whether stems exist in the project */
  hasStems: boolean;
  /** Whether any track is pending/processing */
  hasPendingTracks: boolean;
  /** Check if operation is allowed */
  isOperationAllowed: (op: StudioOperation) => boolean;
  /** Get reason why operation is blocked (null if allowed) */
  getBlockReason: (op: StudioOperation) => string | null;
  /** List of currently blocked operations */
  blockedOperations: StudioOperation[];
}

const STEM_TYPES = ['vocal', 'instrumental', 'drums', 'bass'] as const;

export function useStudioOperationLock(project: StudioProject | null): OperationLockResult {
  // Check if project has separated stems
  const hasStems = useMemo(() => {
    if (!project?.tracks) return false;
    return project.tracks.some(t => STEM_TYPES.includes(t.type as any));
  }, [project?.tracks]);

  // Check if any track is pending/processing
  const hasPendingTracks = useMemo(() => {
    if (!project?.tracks) return false;
    return project.tracks.some(t => t.status === 'pending' || t.status === 'processing');
  }, [project?.tracks]);

  // Get list of blocked operations
  const blockedOperations = useMemo((): StudioOperation[] => {
    const blocked: StudioOperation[] = [];

    // When stems exist, extending or replacing sections would invalidate stems
    if (hasStems) {
      blocked.push('extend', 'replace_section');
    }

    // When pending tracks exist, block most generation operations
    if (hasPendingTracks) {
      blocked.push('extend', 'replace_section', 'add_instrumental', 'add_vocals', 'cover', 'replace_instrumental');
    }

    return [...new Set(blocked)];
  }, [hasStems, hasPendingTracks]);

  // Check if specific operation is allowed
  const isOperationAllowed = useCallback((op: StudioOperation): boolean => {
    return !blockedOperations.includes(op);
  }, [blockedOperations]);

  // Get human-readable block reason
  const getBlockReason = useCallback((op: StudioOperation): string | null => {
    // Stems block structural changes
    if (hasStems && (op === 'extend' || op === 'replace_section')) {
      return 'Стемы блокируют изменение структуры трека. Удалите стемы или создайте новую версию проекта.';
    }

    // Pending tracks block new generations
    if (hasPendingTracks) {
      if (['extend', 'replace_section', 'add_instrumental', 'add_vocals', 'cover', 'replace_instrumental'].includes(op)) {
        return 'Дождитесь завершения текущей генерации.';
      }
    }

    return null;
  }, [hasStems, hasPendingTracks]);

  return {
    hasStems,
    hasPendingTracks,
    isOperationAllowed,
    getBlockReason,
    blockedOperations,
  };
}
