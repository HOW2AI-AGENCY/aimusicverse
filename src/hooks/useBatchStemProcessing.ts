/**
 * useBatchStemProcessing - Hook for managing batch stem operations
 * Provides UI-friendly interface for batch transcription and separation
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  initiateBatchTranscribe,
  initiateBatchSeparate,
  getBatchStatus,
  subscribeToBatchUpdates,
  cancelBatch,
  retryBatch,
  type BatchTranscribeRequest,
  type BatchSeparateRequest,
  type StemBatchStatus,
} from '@/api/batch.api';

export type BatchOperationType = 'transcribe' | 'separate';
export type BatchModel = 'basic' | 'advanced' | 'instrumental';
export type SeparationMode = 'simple' | 'detailed';

export interface BatchProcessingState {
  isProcessing: boolean;
  batchId: string | null;
  progress: number;
  status: StemBatchStatus['status'] | null;
  results: StemBatchStatus['results'] | null;
  error: string | null;
}

export interface StemSelection {
  id: string;
  name: string;
  type: string;
  selected: boolean;
}

const initialState: BatchProcessingState = {
  isProcessing: false,
  batchId: null,
  progress: 0,
  status: null,
  results: null,
  error: null,
};

export function useBatchStemProcessing(trackId: string | undefined) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BatchProcessingState>(initialState);
  const [selectedStems, setSelectedStems] = useState<Set<string>>(new Set());
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Subscribe to batch updates when we have a batchId
  useEffect(() => {
    if (!state.batchId || state.status === 'completed' || state.status === 'failed') {
      return;
    }

    subscriptionRef.current = subscribeToBatchUpdates(state.batchId, (newStatus) => {
      setState(prev => ({
        ...prev,
        progress: newStatus.progress,
        status: newStatus.status,
        results: newStatus.results,
        isProcessing: newStatus.status === 'processing' || newStatus.status === 'queued',
      }));

      // Show toast on completion
      if (newStatus.status === 'completed') {
        const { summary } = newStatus.results;
        toast.success('Пакетная обработка завершена', {
          description: `Успешно: ${summary.success}/${summary.total}`,
        });
        queryClient.invalidateQueries({ queryKey: ['track-stems'] });
      } else if (newStatus.status === 'failed') {
        toast.error('Ошибка пакетной обработки', {
          description: `Не удалось: ${newStatus.results.summary.failed}/${newStatus.results.summary.total}`,
        });
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [state.batchId, state.status, queryClient]);

  // Batch transcribe mutation
  const transcribeMutation = useMutation({
    mutationFn: async (params: { stemIds: string[]; model: BatchModel }) => {
      if (!trackId) throw new Error('Track ID is required');
      return initiateBatchTranscribe({
        trackId,
        stemIds: params.stemIds,
        model: params.model,
      });
    },
    onMutate: () => {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0,
      }));
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        batchId: data.batchId,
        status: data.status,
      }));
      toast.info('Пакетная транскрипция запущена', {
        description: `Обработка ${data.stemsCount} стемов...`,
      });
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message,
      }));
      toast.error('Ошибка запуска транскрипции', {
        description: error.message,
      });
    },
  });

  // Batch separate mutation
  const separateMutation = useMutation({
    mutationFn: async (params: { stemIds: string[]; mode: SeparationMode }) => {
      if (!trackId) throw new Error('Track ID is required');
      return initiateBatchSeparate({
        trackId,
        stemIds: params.stemIds,
        mode: params.mode,
      });
    },
    onMutate: () => {
      setState(prev => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: 0,
      }));
    },
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        batchId: data.batchId,
        status: data.status,
      }));
      toast.info('Пакетное разделение запущено', {
        description: `Режим: ${data.mode === 'detailed' ? 'Детальный' : 'Простой'}`,
      });
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error.message,
      }));
      toast.error('Ошибка запуска разделения', {
        description: error.message,
      });
    },
  });

  // Cancel batch mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!state.batchId) throw new Error('No active batch');
      return cancelBatch(state.batchId);
    },
    onSuccess: () => {
      setState(initialState);
      toast.info('Пакетная обработка отменена');
    },
    onError: (error: Error) => {
      toast.error('Ошибка отмены', { description: error.message });
    },
  });

  // Retry batch mutation
  const retryMutation = useMutation({
    mutationFn: async () => {
      if (!state.batchId) throw new Error('No batch to retry');
      return retryBatch(state.batchId);
    },
    onSuccess: (newBatchId) => {
      setState(prev => ({
        ...prev,
        batchId: newBatchId,
        status: 'queued',
        progress: 0,
        error: null,
        isProcessing: true,
      }));
      toast.info('Повторный запуск обработки');
    },
    onError: (error: Error) => {
      toast.error('Ошибка повторного запуска', { description: error.message });
    },
  });

  // Stem selection handlers
  const toggleStemSelection = useCallback((stemId: string) => {
    setSelectedStems(prev => {
      const next = new Set(prev);
      if (next.has(stemId)) {
        next.delete(stemId);
      } else {
        next.add(stemId);
      }
      return next;
    });
  }, []);

  const selectAllStems = useCallback((stemIds: string[]) => {
    setSelectedStems(new Set(stemIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStems(new Set());
  }, []);

  // Start batch operations
  const startBatchTranscribe = useCallback((model: BatchModel = 'basic') => {
    if (selectedStems.size === 0) {
      toast.warning('Выберите стемы для транскрипции');
      return;
    }
    transcribeMutation.mutate({
      stemIds: Array.from(selectedStems),
      model,
    });
  }, [selectedStems, transcribeMutation]);

  const startBatchSeparate = useCallback((mode: SeparationMode = 'simple') => {
    if (selectedStems.size === 0) {
      toast.warning('Выберите стемы для разделения');
      return;
    }
    separateMutation.mutate({
      stemIds: Array.from(selectedStems),
      mode,
    });
  }, [selectedStems, separateMutation]);

  const cancel = useCallback(() => {
    cancelMutation.mutate();
  }, [cancelMutation]);

  const retry = useCallback(() => {
    retryMutation.mutate();
  }, [retryMutation]);

  const reset = useCallback(() => {
    setState(initialState);
    setSelectedStems(new Set());
  }, []);

  return {
    // State
    ...state,
    selectedStems,
    selectedCount: selectedStems.size,
    
    // Selection actions
    toggleStemSelection,
    selectAllStems,
    clearSelection,
    isSelected: (stemId: string) => selectedStems.has(stemId),
    
    // Batch actions
    startBatchTranscribe,
    startBatchSeparate,
    cancel,
    retry,
    reset,
    
    // Loading states
    isStarting: transcribeMutation.isPending || separateMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRetrying: retryMutation.isPending,
  };
}
