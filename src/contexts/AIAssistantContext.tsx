/**
 * AI Assistant Context for global AI state management
 * Sprint 010 - Phase 2: Foundational context
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface GenerationParams {
  prompt: string;
  style: string;
  mood?: string;
  instruments?: string[];
  duration?: number;
  vocals?: 'male' | 'female' | 'instrumental';
  lyrics?: string;
  [key: string]: unknown;
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
 * Note: Currently uses local state only. Database table will be added in future sprint.
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

  // Save generation attempt to history (local state only for now)
  const saveGenerationAttempt = useCallback(
    async (params: GenerationParams, suggestionIds: string[]): Promise<string> => {
      const newItem: GenerationHistoryItem = {
        id: crypto.randomUUID(),
        generation_params: params,
        ai_suggestions_used: suggestionIds,
        success: null,
        error_message: null,
        created_at: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        generationHistory: [newItem, ...prev.generationHistory].slice(0, 20),
      }));

      return newItem.id;
    },
    []
  );

  // Update generation result after completion
  const updateGenerationResult = useCallback(
    async (historyId: string, success: boolean, trackId?: string, error?: string) => {
      setState((prev) => ({
        ...prev,
        generationHistory: prev.generationHistory.map((item) =>
          item.id === historyId
            ? { ...item, success, track_id: trackId, error_message: error ?? null }
            : item
        ),
      }));

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['generation-history'] });
    },
    [queryClient]
  );

  // Load generation history (currently no-op as we use local state)
  const loadGenerationHistory = useCallback(async () => {
    // TODO: Will load from database when user_generation_history table is created
    console.log('Generation history loaded from local state');
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
