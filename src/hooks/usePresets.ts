/**
 * Presets Hook (Sprint 031 — US3 Professional Studio Dashboard)
 *
 * TanStack Query hook for managing studio presets (vocal, guitar, drums,
 * mastering, stem separation, MIDI). Wraps the presets API layer with caching,
 * optimistic updates, and toast notifications.
 *
 * @example
 * const { presets, isLoading } = usePresets({ category: 'vocal' });
 * const { createPreset, isCreating } = useCreatePreset();
 * const { applyPreset } = useApplyPreset();
 *
 * @module src/hooks/usePresets
 * @see src/api/presets.api.ts for the API layer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPresets,
  getPresetById,
  createPreset,
  updatePreset,
  deletePreset,
  applyPresetToTrack,
  clonePreset,
  type Preset,
  type PresetFilters,
  type CreatePresetInput,
  type UpdatePresetInput,
} from '@/api/presets.api';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const presetsKeys = {
  all: ['presets'] as const,
  list: (filters?: PresetFilters) => ['presets', 'list', filters || {}] as const,
  detail: (presetId: string) => ['presets', 'detail', presetId] as const,
} as const;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch presets, optionally filtered by category, scope, owner, or search.
 *
 * @param filters - Optional filters for category, scope, userId, and search
 * @returns Query result with `presets` array and loading/error state
 */
export function usePresets(filters?: PresetFilters) {
  const query = useQuery({
    queryKey: presetsKeys.list(filters),
    queryFn: async () => {
      const { presets, error } = await getPresets(filters);
      if (error) throw error;
      return presets;
    },
    staleTime: 5 * 60 * 1000, // presets change rarely
    gcTime: 10 * 60 * 1000,
  });

  return {
    presets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch a single preset by ID.
 */
export function usePreset(presetId: string | undefined) {
  return useQuery({
    queryKey: presetsKeys.detail(presetId || ''),
    queryFn: async () => {
      if (!presetId) throw new Error('Preset ID is required');
      const { data, error } = await getPresetById(presetId);
      if (error) throw error;
      return data;
    },
    enabled: !!presetId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new user preset.
 */
export function useCreatePreset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (input: CreatePresetInput) => {
      if (!user?.id) {
        throw new Error('You must be signed in to save presets');
      }
      const { preset, error } = await createPreset(input, user.id);
      if (error || !preset) throw error ?? new Error('Failed to create preset');
      return preset;
    },
    onSuccess: (preset) => {
      logger.info('Preset created', { presetId: preset.id, category: preset.category });
      toast.success('Пресет сохранён', { description: preset.name });
      queryClient.invalidateQueries({ queryKey: presetsKeys.all });
    },
    onError: (error) => {
      logger.error('Failed to create preset', { error });
      toast.error('Не удалось сохранить пресет', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    },
  });

  return {
    createPreset: mutation.mutate,
    createPresetAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Update an existing user preset.
 */
export function useUpdatePreset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ presetId, input }: { presetId: string; input: UpdatePresetInput }) => {
      if (!user?.id) {
        throw new Error('You must be signed in to edit presets');
      }
      const { preset, error } = await updatePreset(presetId, input, user.id);
      if (error || !preset) throw error ?? new Error('Failed to update preset');
      return preset;
    },
    onSuccess: (preset) => {
      logger.info('Preset updated', { presetId: preset.id });
      toast.success('Пресет обновлён', { description: preset.name });
      queryClient.invalidateQueries({ queryKey: presetsKeys.all });
    },
    onError: (error) => {
      logger.error('Failed to update preset', { error });
      toast.error('Не удалось обновить пресет', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    },
  });

  return {
    updatePreset: mutation.mutate,
    updatePresetAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Delete a user preset (with optimistic removal from cached lists).
 */
export function useDeletePreset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (presetId: string) => {
      if (!user?.id) {
        throw new Error('You must be signed in to delete presets');
      }
      const { success, error } = await deletePreset(presetId, user.id);
      if (error || !success) throw error ?? new Error('Failed to delete preset');
      return presetId;
    },
    onMutate: async (presetId) => {
      await queryClient.cancelQueries({ queryKey: presetsKeys.all });
      const snapshots = queryClient.getQueriesData<Preset[]>({ queryKey: ['presets', 'list'] });
      snapshots.forEach(([key, data]) => {
        if (data) {
          queryClient.setQueryData(
            key,
            data.filter((p) => p.id !== presetId)
          );
        }
      });
      return { snapshots };
    },
    onError: (error, _presetId, context) => {
      context?.snapshots?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      logger.error('Failed to delete preset', { error });
      toast.error('Не удалось удалить пресет', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    },
    onSuccess: () => {
      toast.success('Пресет удалён');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: presetsKeys.all });
    },
  });

  return {
    deletePreset: mutation.mutate,
    deletePresetAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Apply a preset's settings to a track.
 */
export function useApplyPreset() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ trackId, presetId }: { trackId: string; presetId: string }) => {
      const { success, appliedSettings, error } = await applyPresetToTrack(trackId, presetId);
      if (error || !success) throw error ?? new Error('Failed to apply preset');
      return appliedSettings;
    },
    onSuccess: () => {
      toast.success('Пресет применён');
      // usage_count changed on the server — refresh lists so sorting reflects it
      queryClient.invalidateQueries({ queryKey: presetsKeys.all });
    },
    onError: (error) => {
      logger.error('Failed to apply preset', { error });
      toast.error('Не удалось применить пресет', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    },
  });

  return {
    applyPreset: mutation.mutate,
    applyPresetAsync: mutation.mutateAsync,
    appliedSettings: mutation.data,
    isApplying: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Clone a public/system preset into the current user's library for editing.
 */
export function useClonePreset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ presetId, newName }: { presetId: string; newName?: string }) => {
      if (!user?.id) {
        throw new Error('You must be signed in to clone presets');
      }
      const { preset, error } = await clonePreset(presetId, user.id, newName);
      if (error || !preset) throw error ?? new Error('Failed to clone preset');
      return preset;
    },
    onSuccess: (preset) => {
      toast.success('Копия пресета создана', { description: preset.name });
      queryClient.invalidateQueries({ queryKey: presetsKeys.all });
    },
    onError: (error) => {
      logger.error('Failed to clone preset', { error });
      toast.error('Не удалось скопировать пресет', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    },
  });

  return {
    clonePreset: mutation.mutate,
    clonePresetAsync: mutation.mutateAsync,
    isCloning: mutation.isPending,
    error: mutation.error,
  };
}
