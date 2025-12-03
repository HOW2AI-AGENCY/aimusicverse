/**
 * AI Assistant Context for global AI state management
 * Sprint 010 - Phase 2: Foundational context
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GenerationParams {
  prompt: string;
  style: string;
  mood?: string;
  instruments?: string[];
  duration?: number;
  vocals?: 'male' | 'female' | 'instrumental';
  lyrics?: string;
  [key: string]: any;
}

interface GenerationHistoryItem {
  id: string;
  generation_params: GenerationParams;
  ai_suggestions_used: string[];
  success: boolean | null;
  error_message: string | null;
  created_at: string;
  track_id?: string;
}

interface AIAssistantState {
  isEnabled: boolean;
  currentSuggestions: string[];
  selectedSuggestions: string[];
  generationHistory: GenerationHistoryItem[];
}

interface AIAssistantContextType extends AIAssistantState {
  toggleAssistant: () => void;
  addSuggestion: (suggestionId: string) => void;
  removeSuggestion: (suggestionId: string) => void;
  clearSuggestions: () => void;
  saveGenerationAttempt: (params: GenerationParams, suggestionIds: string[]) => Promise<string>;
  updateGenerationResult: (historyId: string, success: boolean, trackId?: string, error?: string) => Promise<void>;
  loadGenerationHistory: () => Promise<void>;
  replayGeneration: (historyItem: GenerationHistoryItem) => GenerationParams;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

interface AIAssistantProviderProps {
  children: ReactNode;
}

/**
 * AI Assistant Provider component
 * Manages global state for AI-powered music generation assistance
 */
export function AIAssistantProvider({ children }: AIAssistantProviderProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AIAssistantState>({
    isEnabled: false,
    currentSuggestions: [],
    selectedSuggestions: [],
    generationHistory: [],
  });

  // Toggle AI Assistant on/off
  const toggleAssistant = useCallback(() => {
    setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  // Add a suggestion to selected list
  const addSuggestion = useCallback((suggestionId: string) => {
    setState((prev) => ({
      ...prev,
      selectedSuggestions: [...new Set([...prev.selectedSuggestions, suggestionId])],
    }));
  }, []);

  // Remove a suggestion from selected list
  const removeSuggestion = useCallback((suggestionId: string) => {
    setState((prev) => ({
      ...prev,
      selectedSuggestions: prev.selectedSuggestions.filter((id) => id !== suggestionId),
    }));
  }, []);

  // Clear all selected suggestions
  const clearSuggestions = useCallback(() => {
    setState((prev) => ({ ...prev, selectedSuggestions: [] }));
  }, []);

  // Save generation attempt to history
  const saveGenerationAttempt = useCallback(
    async (params: GenerationParams, suggestionIds: string[]): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_generation_history')
        .insert({
          user_id: user.id,
          generation_params: params,
          ai_suggestions_used: suggestionIds,
          success: null, // Will be updated after generation completes
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setState((prev) => ({
        ...prev,
        generationHistory: [data, ...prev.generationHistory],
      }));

      return data.id;
    },
    []
  );

  // Update generation result after completion
  const updateGenerationResult = useCallback(
    async (historyId: string, success: boolean, trackId?: string, error?: string) => {
      const { error: updateError } = await supabase
        .from('user_generation_history')
        .update({
          success,
          track_id: trackId,
          error_message: error,
        })
        .eq('id', historyId);

      if (updateError) throw updateError;

      // Update local state
      setState((prev) => ({
        ...prev,
        generationHistory: prev.generationHistory.map((item) =>
          item.id === historyId
            ? { ...item, success, track_id: trackId, error_message: error }
            : item
        ),
      }));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['generation-history'] });
    },
    [queryClient]
  );

  // Load generation history from database
  const loadGenerationHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_generation_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to load generation history:', error);
      return;
    }

    setState((prev) => ({
      ...prev,
      generationHistory: data as GenerationHistoryItem[],
    }));
  }, []);

  // Replay a previous generation (return params for reuse)
  const replayGeneration = useCallback((historyItem: GenerationHistoryItem): GenerationParams => {
    // Restore the selected suggestions
    setState((prev) => ({
      ...prev,
      selectedSuggestions: historyItem.ai_suggestions_used,
    }));

    // Return the generation parameters for the form
    return historyItem.generation_params;
  }, []);

  const value: AIAssistantContextType = {
    ...state,
    toggleAssistant,
    addSuggestion,
    removeSuggestion,
    clearSuggestions,
    saveGenerationAttempt,
    updateGenerationResult,
    loadGenerationHistory,
    replayGeneration,
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
}

/**
 * Hook to use AI Assistant context
 */
export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
}

/**
 * Hook to check if AI Assistant is available and enabled
 */
export function useIsAIAssistantEnabled() {
  const { isEnabled } = useAIAssistant();
  return isEnabled;
}
