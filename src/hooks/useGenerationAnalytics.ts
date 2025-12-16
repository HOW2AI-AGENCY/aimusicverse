/**
 * Generation Analytics Hook
 * Fetches comprehensive generation statistics including styles, tags, costs
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ServiceCost {
  service: string;
  requests: number;
  total_cost: number;
  avg_duration_ms: number;
}

interface StyleStat {
  style: string;
  count: number;
}

interface GenreStat {
  genre: string;
  count: number;
}

interface TagStat {
  tag: string;
  usage_count: number;
}

interface TagCombo {
  tag_combo: string;
  count: number;
}

interface ModelStat {
  model: string;
  count: number;
  successful: number;
  avg_time_seconds: number;
}

interface DayStat {
  day: string;
  total: number;
  completed: number;
  failed: number;
}

export interface GenerationAnalytics {
  // Generation stats
  total_generations: number;
  successful_generations: number;
  failed_generations: number;
  avg_generation_time_seconds: number;
  total_generation_time_minutes: number;
  
  // Cost stats
  total_estimated_cost: number;
  avg_cost_per_generation: number;
  cost_by_service: ServiceCost[];
  
  // Style/Genre stats
  top_styles: StyleStat[];
  top_genres: GenreStat[];
  
  // Tag usage stats
  top_tags: TagStat[];
  tag_combinations: TagCombo[];
  
  // Model usage
  model_distribution: ModelStat[];
  
  // Time distribution
  generations_by_day: DayStat[];
  generations_by_hour: Record<string, number>;
}

type TimePeriod = '7 days' | '30 days' | '90 days' | '365 days';

async function fetchGenerationAnalytics(timePeriod: TimePeriod): Promise<GenerationAnalytics> {
  const { data, error } = await supabase
    .rpc('get_generation_analytics', { _time_period: timePeriod });
  
  if (error) throw error;
  
  // The RPC returns a single row with all the data
  const row = Array.isArray(data) ? data[0] : data;
  
  if (!row) {
    return {
      total_generations: 0,
      successful_generations: 0,
      failed_generations: 0,
      avg_generation_time_seconds: 0,
      total_generation_time_minutes: 0,
      total_estimated_cost: 0,
      avg_cost_per_generation: 0,
      cost_by_service: [],
      top_styles: [],
      top_genres: [],
      top_tags: [],
      tag_combinations: [],
      model_distribution: [],
      generations_by_day: [],
      generations_by_hour: {},
    };
  }
  
  return {
    total_generations: Number(row.total_generations || 0),
    successful_generations: Number(row.successful_generations || 0),
    failed_generations: Number(row.failed_generations || 0),
    avg_generation_time_seconds: Number(row.avg_generation_time_seconds || 0),
    total_generation_time_minutes: Number(row.total_generation_time_minutes || 0),
    total_estimated_cost: Number(row.total_estimated_cost || 0),
    avg_cost_per_generation: Number(row.avg_cost_per_generation || 0),
    cost_by_service: (row.cost_by_service as ServiceCost[] | null) || [],
    top_styles: (row.top_styles as StyleStat[] | null) || [],
    top_genres: (row.top_genres as GenreStat[] | null) || [],
    top_tags: (row.top_tags as TagStat[] | null) || [],
    tag_combinations: (row.tag_combinations as TagCombo[] | null) || [],
    model_distribution: (row.model_distribution as ModelStat[] | null) || [],
    generations_by_day: (row.generations_by_day as DayStat[] | null) || [],
    generations_by_hour: (row.generations_by_hour as Record<string, number> | null) || {},
  };
}

export function useGenerationAnalytics(timePeriod: TimePeriod = '30 days') {
  return useQuery({
    queryKey: ['generation-analytics', timePeriod],
    queryFn: () => fetchGenerationAnalytics(timePeriod),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
