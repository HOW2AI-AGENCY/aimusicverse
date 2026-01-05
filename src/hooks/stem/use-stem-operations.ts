/**
 * useStemOperations Hook
 * 
 * Implementation for User Story 2 (Phase 4): Business Logic Extraction
 * Per tasks.md T049 - Stem separation and mixing operations
 * 
 * Consolidates stem operation logic from stem-studio components:
 * - Stem separation (vocals, instrumental, drums, bass, etc.)
 * - Stem mixing and volume control
 * - Stem playback and export
 */

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface StemType {
  id: string;
  track_id: string;
  stem_type: 'vocals' | 'instrumental' | 'drums' | 'bass' | 'other' | 'piano' | 'guitar';
  audio_url: string;
  created_at: string;
}

interface StemMixState {
  [stemId: string]: {
    volume: number;
    muted: boolean;
    solo: boolean;
  };
}

interface UseStemOperationsParams {
  trackId: string;
}

interface UseStemOperationsReturn {
  // Stem data
  stems: StemType[];
  hasStems: boolean;
  isLoading: boolean;
  
  // Separation operations
  separateStems: (options?: SeparationOptions) => Promise<void>;
  isSeparating: boolean;
  separationProgress: number;
  
  // Mix state
  mixState: StemMixState;
  setStemVolume: (stemId: string, volume: number) => void;
  toggleStemMute: (stemId: string) => void;
  toggleStemSolo: (stemId: string) => void;
  resetMix: () => void;
  
  // Export operations
  exportMix: () => Promise<void>;
  isExporting: boolean;
  
  // Error state
  error: Error | null;
}

interface SeparationOptions {
  model?: 'demucs' | 'spleeter' | 'htdemucs';
  stems?: number; // 2, 4, or 6 stems
}

/**
 * Hook for managing stem separation and mixing operations
 */
export function useStemOperations({
  trackId,
}: UseStemOperationsParams): UseStemOperationsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const haptic = useHapticFeedback();

  // Query for existing stems
  const {
    data: stems = [],
    isLoading,
  } = useQuery({
    queryKey: ['track-stems', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('track_stems')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as StemType[];
    },
    enabled: !!trackId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for separation task status
  const { data: separationTask } = useQuery({
    queryKey: ['stem-separation-task', trackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stem_separation_tasks')
        .select('*')
        .eq('track_id', trackId)
        .eq('status', 'processing')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!trackId,
    refetchInterval: (data) => {
      // Poll every 2 seconds while processing
      return data?.status === 'processing' ? 2000 : false;
    },
  });

  // Local mix state management
  const [mixState, setMixState] = React.useState<StemMixState>({});

  // Initialize mix state when stems load
  React.useEffect(() => {
    if (stems.length > 0) {
      const initialState: StemMixState = {};
      stems.forEach(stem => {
        initialState[stem.id] = {
          volume: 1,
          muted: false,
          solo: false,
        };
      });
      setMixState(initialState);
    }
  }, [stems]);

  // Separate stems mutation
  const separateMutation = useMutation({
    mutationFn: async (options: SeparationOptions = {}) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Create separation task
      const { data: task, error: taskError } = await supabase
        .from('stem_separation_tasks')
        .insert({
          track_id: trackId,
          user_id: user.id,
          model: options.model || 'htdemucs',
          stems_count: options.stems || 4,
          status: 'pending',
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Trigger edge function to start separation
      const { error: functionError } = await supabase.functions.invoke(
        'separate-stems',
        {
          body: { task_id: task.id, track_id: trackId },
        }
      );

      if (functionError) throw functionError;

      return task;
    },
    onMutate: () => {
      haptic.impact('medium');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['stem-separation-task', trackId],
      });
      toast.success('Разделение началось');
      haptic.notification('success');
    },
    onError: (error) => {
      logger.error('Error starting stem separation:', error);
      toast.error('Не удалось начать разделение');
      haptic.notification('error');
    },
  });

  // Export mix mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Prepare mix configuration
      const mixConfig = Object.entries(mixState).map(([stemId, state]) => ({
        stem_id: stemId,
        volume: state.volume,
        muted: state.muted,
      }));

      // Trigger edge function to export mix
      const { data, error } = await supabase.functions.invoke(
        'export-stem-mix',
        {
          body: {
            track_id: trackId,
            mix_config: mixConfig,
          },
        }
      );

      if (error) throw error;

      return data;
    },
    onMutate: () => {
      haptic.impact('medium');
      toast.info('Экспорт начался...');
    },
    onSuccess: (data) => {
      toast.success('Микс экспортирован');
      haptic.notification('success');

      // Download the file
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error) => {
      logger.error('Error exporting mix:', error);
      toast.error('Не удалось экспортировать микс');
      haptic.notification('error');
    },
  });

  // Mix state setters
  const setStemVolume = React.useCallback((stemId: string, volume: number) => {
    setMixState(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        volume: Math.max(0, Math.min(1, volume)),
      },
    }));
    haptic.impact('light');
  }, [haptic]);

  const toggleStemMute = React.useCallback((stemId: string) => {
    setMixState(prev => ({
      ...prev,
      [stemId]: {
        ...prev[stemId],
        muted: !prev[stemId]?.muted,
      },
    }));
    haptic.impact('light');
  }, [haptic]);

  const toggleStemSolo = React.useCallback((stemId: string) => {
    setMixState(prev => {
      const newState = { ...prev };
      const isSolo = !newState[stemId]?.solo;

      // If enabling solo, mute all other stems
      if (isSolo) {
        Object.keys(newState).forEach(id => {
          if (id !== stemId) {
            newState[id] = { ...newState[id], muted: true };
          }
        });
      } else {
        // If disabling solo, unmute all stems
        Object.keys(newState).forEach(id => {
          newState[id] = { ...newState[id], muted: false };
        });
      }

      newState[stemId] = { ...newState[stemId], solo: isSolo };
      return newState;
    });
    haptic.impact('medium');
  }, [haptic]);

  const resetMix = React.useCallback(() => {
    const resetState: StemMixState = {};
    stems.forEach(stem => {
      resetState[stem.id] = {
        volume: 1,
        muted: false,
        solo: false,
      };
    });
    setMixState(resetState);
    haptic.impact('medium');
    toast.info('Микс сброшен');
  }, [stems, haptic]);

  return {
    // Stem data
    stems,
    hasStems: stems.length > 0,
    isLoading,

    // Separation operations
    separateStems: (options) => separateMutation.mutateAsync(options),
    isSeparating: separateMutation.isPending || separationTask?.status === 'processing',
    separationProgress: separationTask?.progress || 0,

    // Mix state
    mixState,
    setStemVolume,
    toggleStemMute,
    toggleStemSolo,
    resetMix,

    // Export operations
    exportMix: () => exportMutation.mutateAsync(),
    isExporting: exportMutation.isPending,

    // Error state
    error: separateMutation.error || exportMutation.error || null,
  };
}
