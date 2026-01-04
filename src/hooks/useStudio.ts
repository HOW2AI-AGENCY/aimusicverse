/**
 * useStudio Hook
 * Thin React Query wrapper around studio service
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as studioApi from '@/api/studio.api';
import * as studioService from '@/services/studio.service';
import { STALE_TIMES } from '@/lib/query-utils';

// ============= Replaced Sections =============

export function useReplacedSections(trackId: string | null) {
  return useQuery({
    queryKey: ['replaced-sections', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      return studioService.fetchReplacedSections(trackId);
    },
    enabled: !!trackId,
    staleTime: STALE_TIMES.TRACKS,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.some(s => s.status === 'pending' || s.status === 'processing')) {
        return 5000;
      }
      return false;
    },
  });
}

// ============= Track Versions =============

export function useTrackVersions(trackId: string | null) {
  return useQuery({
    queryKey: ['track-versions', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await studioApi.fetchTrackVersions(trackId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!trackId,
    staleTime: STALE_TIMES.TRACKS,
  });
}

// ============= Track Stems =============

export function useTrackStems(trackId: string | null) {
  return useQuery({
    queryKey: ['track-stems', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await studioApi.fetchTrackStems(trackId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!trackId,
    staleTime: STALE_TIMES.TRACKS,
  });
}

// ============= Guitar Analysis =============

export function useGuitarAnalysis(trackId: string | null) {
  return useQuery({
    queryKey: ['guitar-analysis', trackId],
    queryFn: async () => {
      if (!trackId) return null;
      const { data, error } = await studioApi.fetchGuitarAnalysis(trackId);
      if (error) throw error;
      return data;
    },
    enabled: !!trackId,
    staleTime: STALE_TIMES.STATIC,
  });
}

// ============= Stem Separation =============

export function useStemSeparation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trackId,
      audioId,
      audioUrl,
      mode,
    }: {
      trackId: string;
      audioId: string;
      audioUrl: string;
      mode: 'simple' | 'detailed';
    }) => {
      const result = await studioService.separateStems(trackId, audioId, audioUrl, mode);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, { trackId, mode }) => {
      queryClient.invalidateQueries({ queryKey: ['track-stems', trackId] });
      toast.success(
        mode === 'simple' 
          ? 'Разделение на 2 стема запущено' 
          : 'Разделение на 6+ стемов запущено',
        { description: 'Процесс займёт 1-3 минуты' }
      );
    },
    onError: (error) => {
      toast.error('Ошибка при разделении стемов', {
        description: error instanceof Error ? error.message : 'Попробуйте позже',
      });
    },
  });
}

// ============= Section Replacement =============

export function useSectionReplacement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Parameters<typeof studioService.replaceSection>[0]) => {
      const result = await studioService.replaceSection(params);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, { trackId }) => {
      queryClient.invalidateQueries({ queryKey: ['replaced-sections', trackId] });
      toast.success('Замена секции запущена', {
        description: 'Это займёт 1-2 минуты',
      });
    },
    onError: (error) => {
      toast.error('Ошибка при замене секции', {
        description: error instanceof Error ? error.message : 'Попробуйте позже',
      });
    },
  });
}

// ============= Version Switching =============

export function useVersionSwitcher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId, versionId }: { trackId: string; versionId: string }) => {
      const result = await studioService.switchToVersion(trackId, versionId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (_, { trackId }) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['track-versions', trackId] });
      toast.success('Версия изменена');
    },
    onError: (error) => {
      toast.error('Ошибка при смене версии', {
        description: error instanceof Error ? error.message : 'Попробуйте позже',
      });
    },
  });
}

// ============= Section Validation =============

export function useSectionValidation(duration: number, maxSectionDuration?: number) {
  return {
    validate: (section: studioService.SectionBounds) => 
      studioService.validateSectionBounds(section, duration, maxSectionDuration),
  };
}

// ============= Fallback Sections =============

export function useFallbackSections(duration: number) {
  return studioService.createFallbackSections(duration);
}
