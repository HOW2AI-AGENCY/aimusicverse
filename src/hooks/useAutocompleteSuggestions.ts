/**
 * Hook for AI-powered autocomplete suggestions
 * Sprint 010 - Phase 2: Foundational hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface PromptSuggestion {
  id: string;
  text: string;
  description: string | null;
  category: string;
  style: string | null;
  tags: string[];
  usage_count: number;
}

interface UseAutocompleteSuggestionsOptions {
  query: string;
  style?: string;
  category?: 'style' | 'mood' | 'instrument' | 'genre' | 'prompt_template';
  limit?: number;
  debounceMs?: number;
}

/**
 * Hook to get autocomplete suggestions for prompts
 * Features debouncing to avoid excessive API calls
 */
export function useAutocompleteSuggestions(options: UseAutocompleteSuggestionsOptions) {
  const { query, style, category, limit = 10, debounceMs = 300 } = options;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ['autocomplete-suggestions', debouncedQuery, style, category],
    queryFn: async () => {
      // Don't query if search term is too short
      if (debouncedQuery.length < 2) {
        return { suggestions: [] };
      }

      let dbQuery = supabase
        .from('prompt_suggestions')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(limit);

      // Filter by category if specified
      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      // Filter by style if specified
      if (style) {
        dbQuery = dbQuery.or(`style.eq.${style},style.is.null`);
      }

      // Search in text, description, and tags
      dbQuery = dbQuery.or(
        `text.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%,tags.cs.{${debouncedQuery}}`
      );

      const { data, error } = await dbQuery;

      if (error) throw error;

      return {
        suggestions: (data || []) as PromptSuggestion[],
      };
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to get style-specific suggestions
 */
export function useStyleSuggestions(style: string, category?: string) {
  return useQuery({
    queryKey: ['style-suggestions', style, category],
    queryFn: async () => {
      let query = supabase
        .from('prompt_suggestions')
        .select('*')
        .eq('is_active', true)
        .or(`style.eq.${style},style.is.null`)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as PromptSuggestion[];
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

/**
 * Hook to get mood suggestions
 */
export function useMoodSuggestions() {
  return useQuery({
    queryKey: ['mood-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_suggestions')
        .select('*')
        .eq('category', 'mood')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as PromptSuggestion[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get instrument suggestions
 */
export function useInstrumentSuggestions(style?: string) {
  return useQuery({
    queryKey: ['instrument-suggestions', style],
    queryFn: async () => {
      let query = supabase
        .from('prompt_suggestions')
        .select('*')
        .eq('category', 'instrument')
        .eq('is_active', true);

      if (style) {
        query = query.or(`style.eq.${style},style.is.null`);
      }

      query = query.order('usage_count', { ascending: false }).limit(20);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PromptSuggestion[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get prompt templates
 */
export function usePromptTemplates(style?: string) {
  return useQuery({
    queryKey: ['prompt-templates', style],
    queryFn: async () => {
      let query = supabase
        .from('prompt_suggestions')
        .select('*')
        .eq('category', 'prompt_template')
        .eq('is_active', true);

      if (style) {
        query = query.or(`style.eq.${style},style.is.null`);
      }

      query = query.order('usage_count', { ascending: false }).limit(10);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PromptSuggestion[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Increment usage count when a suggestion is used
 * This helps the AI learn which suggestions are most helpful
 */
export async function incrementSuggestionUsage(suggestionId: string) {
  const { error } = await supabase.rpc('increment_suggestion_usage', {
    suggestion_id: suggestionId,
  });

  if (error) {
    console.error('Failed to increment suggestion usage:', error);
  }
}
