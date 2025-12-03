/**
 * Hook for AI-powered autocomplete suggestions
 * Sprint 010 - Phase 2: Foundational hooks
 * Uses prompt_templates table for suggestions
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface PromptSuggestion {
  id: string;
  name: string;
  template_text: string;
  tags: string[];
  style_id: string | null;
  is_public: boolean;
  usage_count: number | null;
}

interface UseAutocompleteSuggestionsOptions {
  query: string;
  style?: string;
  limit?: number;
  debounceMs?: number;
}

/**
 * Hook to get autocomplete suggestions for prompts
 * Features debouncing to avoid excessive API calls
 */
export function useAutocompleteSuggestions(options: UseAutocompleteSuggestionsOptions) {
  const { query, style, limit = 10, debounceMs = 300 } = options;
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ['autocomplete-suggestions', debouncedQuery, style],
    queryFn: async () => {
      // Don't query if search term is too short
      if (debouncedQuery.length < 2) {
        return { suggestions: [] };
      }

      let dbQuery = supabase
        .from('prompt_templates')
        .select('*')
        .or(`is_public.eq.true`)
        .order('usage_count', { ascending: false, nullsFirst: false })
        .limit(limit);

      // Search in name, template_text, and tags
      dbQuery = dbQuery.or(
        `name.ilike.%${debouncedQuery}%,template_text.ilike.%${debouncedQuery}%`
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
export function useStyleSuggestions(styleId?: string) {
  return useQuery({
    queryKey: ['style-suggestions', styleId],
    queryFn: async () => {
      let query = supabase
        .from('prompt_templates')
        .select('*')
        .or('is_public.eq.true')
        .order('usage_count', { ascending: false, nullsFirst: false })
        .limit(20);

      if (styleId) {
        query = query.eq('style_id', styleId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as PromptSuggestion[];
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

/**
 * Hook to get prompt templates
 */
export function usePromptTemplates(styleId?: string) {
  return useQuery({
    queryKey: ['prompt-templates', styleId],
    queryFn: async () => {
      let query = supabase
        .from('prompt_templates')
        .select('*')
        .or('is_public.eq.true');

      if (styleId) {
        query = query.eq('style_id', styleId);
      }

      query = query.order('usage_count', { ascending: false, nullsFirst: false }).limit(10);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PromptSuggestion[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Increment usage count when a suggestion is used
 */
export async function incrementSuggestionUsage(templateId: string) {
  const { data: template, error: fetchError } = await supabase
    .from('prompt_templates')
    .select('usage_count')
    .eq('id', templateId)
    .single();

  if (fetchError) {
    console.error('Failed to fetch template:', fetchError);
    return;
  }

  const { error } = await supabase
    .from('prompt_templates')
    .update({ usage_count: (template?.usage_count || 0) + 1 })
    .eq('id', templateId);

  if (error) {
    console.error('Failed to increment suggestion usage:', error);
  }
}
