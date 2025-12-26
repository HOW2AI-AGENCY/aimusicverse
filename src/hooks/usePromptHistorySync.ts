/**
 * Hook for syncing prompt history with database
 * Merges localStorage history with DB history for complete view
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { PromptHistoryItem, SavedPrompt } from '@/components/generate-form/PromptHistory';

const HISTORY_KEY = 'musicverse_prompt_history';
const SAVED_KEY = 'musicverse_saved_prompts';

interface DBGenerationHistory {
  id: string;
  prompt: string;
  style: string | null;
  tags: string[] | null;
  generation_mode: string | null;
  model_name: string | null;
  is_instrumental: boolean | null;
  lyrics: string | null;
  track_id: string | null;
  created_at: string;
}

// Fetch history from database
async function fetchDBHistory(userId: string, limit = 100): Promise<DBGenerationHistory[]> {
  const { data, error } = await supabase
    .from('user_generation_history')
    .select('id, prompt, style, tags, generation_mode, model_name, is_instrumental, lyrics, track_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data || [];
}

// Convert DB entry to UI format
function dbToHistoryItem(entry: DBGenerationHistory): PromptHistoryItem {
  return {
    id: entry.id,
    timestamp: new Date(entry.created_at),
    usageCount: 1,
    mode: entry.generation_mode === 'custom' ? 'custom' : 'simple',
    description: entry.generation_mode === 'simple' ? entry.prompt : undefined,
    title: entry.generation_mode === 'custom' ? entry.prompt : undefined,
    style: entry.style || undefined,
    lyrics: entry.lyrics || undefined,
    model: entry.model_name || 'V4_5ALL',
    tags: entry.tags || undefined,
  };
}

// Load from localStorage
function loadLocalHistory(): PromptHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  } catch {
    return [];
  }
}

function loadLocalSaved(): SavedPrompt[] {
  try {
    const stored = localStorage.getItem(SAVED_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  } catch {
    return [];
  }
}

export function usePromptHistorySync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch DB history
  const { data: dbHistory = [], isLoading: dbLoading } = useQuery({
    queryKey: ['db-generation-history', user?.id],
    queryFn: () => fetchDBHistory(user!.id, 100),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Merge local and DB history
  const mergedHistory = useCallback((): PromptHistoryItem[] => {
    const localHistory = loadLocalHistory();
    const dbItems = dbHistory.map(dbToHistoryItem);
    
    // Create a map to deduplicate by content hash
    const seen = new Map<string, PromptHistoryItem>();
    
    // Add DB items first (they are authoritative)
    for (const item of dbItems) {
      const key = `${item.description || item.title}-${item.style}-${item.mode}`;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }
    
    // Add local items if not already present
    for (const item of localHistory) {
      const key = `${item.description || item.title}-${item.style}-${item.mode}`;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }
    
    // Sort by timestamp descending
    return Array.from(seen.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [dbHistory]);

  // Save prompt to DB
  const saveToDBMutation = useMutation({
    mutationFn: async (params: {
      prompt: string;
      style?: string;
      tags?: string[];
      generation_mode?: string;
      model_name?: string;
      is_instrumental?: boolean;
      lyrics?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('user_generation_history')
        .insert({
          user_id: user.id,
          prompt: params.prompt,
          style: params.style,
          tags: params.tags,
          generation_mode: params.generation_mode,
          model_name: params.model_name,
          is_instrumental: params.is_instrumental,
          lyrics: params.lyrics,
          status: 'completed',
          metadata: {},
        });
      
      if (error) {
        logger.error('Failed to save prompt to DB', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['db-generation-history'] });
    },
  });

  // Get saved prompts (still localStorage for now, but with better structure)
  const savedPrompts = loadLocalSaved();

  return {
    history: mergedHistory(),
    savedPrompts,
    isLoading: dbLoading,
    saveToDB: saveToDBMutation.mutate,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['db-generation-history'] }),
  };
}

// Hook for saved style presets (aromas)
export function useSavedStylePresets() {
  const { user } = useAuth();

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['saved-style-presets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch from prompt_templates
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('usage_count', { ascending: false, nullsFirst: false })
        .limit(50);
      
      if (error) {
        logger.error('Failed to fetch style presets', { error });
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  return { presets, isLoading };
}
