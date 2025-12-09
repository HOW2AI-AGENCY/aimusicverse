import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

// Get current user from supabase
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

interface TagUsageStats {
  tag_name: string;
  usage_count: number;
  success_rate: number;
  avg_plays: number;
  avg_likes: number;
}

interface TagRecommendation {
  tag: string;
  score: number;
  reason: string;
  category?: string;
  relatedTags: string[];
}

interface TagCombination {
  tags: string[];
  success_rate: number;
  usage_count: number;
  avg_score: number;
}

// Fetch user's tag usage history
export function useTagUsageHistory() {
  return useQuery({
    queryKey: ['tag-usage-history'],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('generation_tag_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch global tag popularity stats
export function useTagPopularity() {
  return useQuery({
    queryKey: ['tag-popularity'],
    queryFn: async () => {
      // Get tag usage counts from generation_tag_usage
      const { data: usageData, error: usageError } = await supabase
        .from('generation_tag_usage')
        .select('tags_used, success, track_id');
      
      if (usageError) throw usageError;
      
      // Aggregate tag stats
      const tagStats: Record<string, { count: number; successes: number }> = {};
      
      (usageData || []).forEach(usage => {
        (usage.tags_used || []).forEach((tag: string) => {
          if (!tagStats[tag]) {
            tagStats[tag] = { count: 0, successes: 0 };
          }
          tagStats[tag].count++;
          if (usage.success) tagStats[tag].successes++;
        });
      });
      
      // Convert to array and sort by count
      return Object.entries(tagStats)
        .map(([tag, stats]) => ({
          tag,
          count: stats.count,
          successRate: stats.count > 0 ? stats.successes / stats.count : 0,
        }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Fetch tag relationships from database
export function useTagRelationships() {
  return useQuery({
    queryKey: ['tag-relationships-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_relationships')
        .select(`
          *,
          tag:suno_meta_tags!tag_relationships_tag_id_fkey(id, tag_name, category),
          related_tag:suno_meta_tags!tag_relationships_related_tag_id_fkey(id, tag_name, category)
        `);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Get personalized tag recommendations
export function useTagRecommendations(currentTags: string[] = [], genre?: string) {
  const { data: usageHistory } = useTagUsageHistory();
  const { data: popularity } = useTagPopularity();
  const { data: relationships } = useTagRelationships();
  const { data: metaTags } = useMetaTags();
  
  return useMemo(() => {
    const recommendations: TagRecommendation[] = [];
    
    if (!metaTags) return recommendations;
    
    // 1. Recommendations based on relationships with current tags
    if (relationships && currentTags.length > 0) {
      const relatedTagIds = new Set<string>();
      const relatedReasons: Record<string, string[]> = {};
      
      relationships.forEach(rel => {
        const tagName = rel.tag?.tag_name;
        const relatedName = rel.related_tag?.tag_name;
        
        if (currentTags.includes(tagName) && relatedName && !currentTags.includes(relatedName)) {
          relatedTagIds.add(relatedName);
          if (!relatedReasons[relatedName]) relatedReasons[relatedName] = [];
          relatedReasons[relatedName].push(`связан с "${tagName}"`);
        }
        if (currentTags.includes(relatedName) && tagName && !currentTags.includes(tagName)) {
          relatedTagIds.add(tagName);
          if (!relatedReasons[tagName]) relatedReasons[tagName] = [];
          relatedReasons[tagName].push(`связан с "${relatedName}"`);
        }
      });
      
      relatedTagIds.forEach(tag => {
        const tagInfo = metaTags.find(t => t.tag_name === tag);
        recommendations.push({
          tag,
          score: 0.9,
          reason: relatedReasons[tag]?.join(', ') || 'Связанный тег',
          category: tagInfo?.category,
          relatedTags: currentTags.filter(ct => relatedReasons[tag]?.some(r => r.includes(ct))),
        });
      });
    }
    
    // 2. Recommendations based on user history
    if (usageHistory && usageHistory.length > 0) {
      const userTagCounts: Record<string, number> = {};
      
      usageHistory.forEach(usage => {
        (usage.tags_used || []).forEach((tag: string) => {
          if (!currentTags.includes(tag)) {
            userTagCounts[tag] = (userTagCounts[tag] || 0) + 1;
          }
        });
      });
      
      Object.entries(userTagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tag, count]) => {
          const existing = recommendations.find(r => r.tag === tag);
          if (existing) {
            existing.score += 0.2;
            existing.reason += `, использовался ${count} раз`;
          } else {
            const tagInfo = metaTags.find(t => t.tag_name === tag);
            recommendations.push({
              tag,
              score: 0.6 + Math.min(count / 20, 0.3),
              reason: `Вы использовали ${count} раз`,
              category: tagInfo?.category,
              relatedTags: [],
            });
          }
        });
    }
    
    // 3. Recommendations based on popularity
    if (popularity && popularity.length > 0) {
      popularity.slice(0, 10).forEach(({ tag, count, successRate }) => {
        if (currentTags.includes(tag)) return;
        
        const existing = recommendations.find(r => r.tag === tag);
        if (existing) {
          existing.score += successRate * 0.3;
          existing.reason += `, популярен (${count} использований)`;
        } else {
          const tagInfo = metaTags.find(t => t.tag_name === tag);
          recommendations.push({
            tag,
            score: 0.4 + successRate * 0.4,
            reason: `Популярный тег (${Math.round(successRate * 100)}% успех)`,
            category: tagInfo?.category,
            relatedTags: [],
          });
        }
      });
    }
    
    // 4. Genre-based recommendations
    if (genre && metaTags) {
      metaTags
        .filter(t => t.category === 'genre_style' || t.category === 'mood_energy')
        .slice(0, 5)
        .forEach(tag => {
          if (currentTags.includes(tag.tag_name)) return;
          const existing = recommendations.find(r => r.tag === tag.tag_name);
          if (!existing) {
            recommendations.push({
              tag: tag.tag_name,
              score: 0.5,
              reason: `Подходит для ${genre}`,
              category: tag.category,
              relatedTags: [],
            });
          }
        });
    }
    
    // Sort by score and deduplicate
    return recommendations
      .sort((a, b) => b.score - a.score)
      .filter((r, i, arr) => arr.findIndex(x => x.tag === r.tag) === i)
      .slice(0, 15);
  }, [currentTags, genre, usageHistory, popularity, relationships, metaTags]);
}

// Track tag usage for analytics
export function useTrackTagUsage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      tags,
      styleId, 
      promptText, 
      trackId, 
      success 
    }: { 
      tags: string[]; 
      styleId?: string; 
      promptText?: string; 
      trackId?: string;
      success?: boolean;
    }) => {
      const user = await getCurrentUser();
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('generation_tag_usage')
        .insert({
          user_id: user.id,
          tags_used: tags,
          style_id: styleId,
          prompt_text: promptText,
          track_id: trackId,
          success: success ?? true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-usage-history'] });
      queryClient.invalidateQueries({ queryKey: ['tag-popularity'] });
    },
  });
}

// Helper hook to fetch meta tags
function useMetaTags() {
  return useQuery({
    queryKey: ['suno-meta-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suno_meta_tags')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Get successful tag combinations
export function useSuccessfulCombinations() {
  return useQuery({
    queryKey: ['successful-combinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generation_tag_usage')
        .select('tags_used, success, track_id')
        .eq('success', true)
        .not('track_id', 'is', null);
      
      if (error) throw error;
      
      // Find common combinations
      const comboCounts: Record<string, { count: number; trackIds: string[] }> = {};
      
      (data || []).forEach(usage => {
        if (usage.tags_used && usage.tags_used.length >= 2) {
          // Sort tags to create consistent key
          const key = [...usage.tags_used].sort().join('|');
          if (!comboCounts[key]) {
            comboCounts[key] = { count: 0, trackIds: [] };
          }
          comboCounts[key].count++;
          if (usage.track_id) {
            comboCounts[key].trackIds.push(usage.track_id);
          }
        }
      });
      
      return Object.entries(comboCounts)
        .map(([key, { count, trackIds }]) => ({
          tags: key.split('|'),
          count,
          trackIds,
        }))
        .filter(c => c.count >= 2)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    },
    staleTime: 5 * 60 * 1000,
  });
}
