import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TagCategory = Database['public']['Enums']['tag_category'];

interface NewTagData {
  tag_name: string;
  category: TagCategory;
  description?: string;
  syntax_format?: string;
}

interface NewStyleData {
  style_name: string;
  primary_genre?: string;
  description?: string;
  mood_atmosphere?: string[];
}

// Auto-discover and add new tags from generation prompts
export function useAutoTagDiscovery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promptText: string) => {
      // Extract potential tags from prompt using brackets pattern
      const bracketTags = promptText.match(/\[([^\]]+)\]/g) || [];
      const extractedTags = bracketTags.map(t => t.replace(/[\[\]]/g, '').trim());
      
      if (extractedTags.length === 0) return [];
      
      // Check which tags already exist
      const { data: existingTags } = await supabase
        .from('suno_meta_tags')
        .select('tag_name')
        .in('tag_name', extractedTags);
      
      const existingNames = new Set((existingTags || []).map(t => t.tag_name.toLowerCase()));
      const newTags = extractedTags.filter(t => !existingNames.has(t.toLowerCase()));
      
      if (newTags.length === 0) return [];
      
      // Categorize new tags (simple heuristic)
      const categorizedTags = newTags.map(tag => {
        const lowerTag = tag.toLowerCase();
        let category: TagCategory = 'genre_style'; // default
        
        // Mood/Energy keywords
        if (/sad|happy|dark|bright|chill|intense|aggressive|peaceful|dreamy|euphoric|melancholic|energetic/i.test(lowerTag)) {
          category = 'mood_energy';
        }
        // Instrument keywords
        else if (/guitar|piano|bass|drums|synth|violin|flute|organ|brass|strings|harp|horn|sax/i.test(lowerTag)) {
          category = 'instrument';
        }
        // Vocal keywords
        else if (/vocal|voice|sing|rap|whisper|scream|choir|harmonies|falsetto|growl/i.test(lowerTag)) {
          category = 'vocal';
        }
        // Production keywords
        else if (/lo-fi|hi-fi|vinyl|tape|distortion|clean|compressed|reverb|delay|stereo/i.test(lowerTag)) {
          category = 'production_texture';
        }
        // Effect keywords
        else if (/filter|phaser|flanger|chorus|bitcrush|glitch|reverse|pitch/i.test(lowerTag)) {
          category = 'effect_processing';
        }
        // Structure keywords
        else if (/intro|outro|verse|chorus|bridge|drop|breakdown|build/i.test(lowerTag)) {
          category = 'structure';
        }
        
        return {
          tag_name: tag,
          category,
          syntax_format: `[${tag}]`,
          description: `Auto-discovered tag: ${tag}`,
        };
      });
      
      // Insert new tags
      const { data: insertedTags, error } = await supabase
        .from('suno_meta_tags')
        .insert(categorizedTags)
        .select();
      
      if (error) {
        console.error('Error inserting new tags:', error);
        return [];
      }
      
      return insertedTags || [];
    },
    onSuccess: (newTags) => {
      if (newTags.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['suno-meta-tags'] });
        queryClient.invalidateQueries({ queryKey: ['music-graph-data'] });
      }
    },
  });
}

// Manually add a new tag
export function useAddTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tagData: NewTagData) => {
      const { data, error } = await supabase
        .from('suno_meta_tags')
        .insert({
          tag_name: tagData.tag_name,
          category: tagData.category as any,
          description: tagData.description,
          syntax_format: tagData.syntax_format || `[${tagData.tag_name}]`,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suno-meta-tags'] });
      queryClient.invalidateQueries({ queryKey: ['music-graph-data'] });
    },
  });
}

// Add a new music style
export function useAddStyle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (styleData: NewStyleData) => {
      const { data, error } = await supabase
        .from('music_styles')
        .insert({
          style_name: styleData.style_name,
          primary_genre: styleData.primary_genre,
          description: styleData.description,
          mood_atmosphere: styleData.mood_atmosphere,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music-styles'] });
      queryClient.invalidateQueries({ queryKey: ['music-graph-data'] });
    },
  });
}

// Create tag relationships
export function useAddTagRelationship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      tagId, 
      relatedTagId, 
      relationshipType, 
      strength 
    }: { 
      tagId: string; 
      relatedTagId: string; 
      relationshipType: 'complements' | 'enhances' | 'similar' | 'contrasts';
      strength?: number;
    }) => {
      const { data, error } = await supabase
        .from('tag_relationships')
        .insert({
          tag_id: tagId,
          related_tag_id: relatedTagId,
          relationship_type: relationshipType,
          strength: strength || 5,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-relationships-full'] });
      queryClient.invalidateQueries({ queryKey: ['music-graph-data'] });
    },
  });
}

// Bulk learn from successful generations
export function useLearnFromGenerations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Get successful generations with their tags
      const { data: generations, error } = await supabase
        .from('generation_tag_usage')
        .select('tags_used')
        .eq('success', true)
        .not('track_id', 'is', null);
      
      if (error) throw error;
      
      // Count tag co-occurrences
      const coOccurrences: Record<string, Record<string, number>> = {};
      
      (generations || []).forEach(gen => {
        const tags = gen.tags_used || [];
        tags.forEach((tag1: string) => {
          tags.forEach((tag2: string) => {
            if (tag1 !== tag2) {
              if (!coOccurrences[tag1]) coOccurrences[tag1] = {};
              coOccurrences[tag1][tag2] = (coOccurrences[tag1][tag2] || 0) + 1;
            }
          });
        });
      });
      
      // Get tag IDs
      const allTags = Object.keys(coOccurrences);
      const { data: tagData } = await supabase
        .from('suno_meta_tags')
        .select('id, tag_name')
        .in('tag_name', allTags);
      
      const tagIdMap = new Map((tagData || []).map(t => [t.tag_name, t.id]));
      
      // Create relationships for frequently co-occurring tags
      const relationships: Array<{
        tag_id: string;
        related_tag_id: string;
        relationship_type: string;
        strength: number;
      }> = [];
      
      Object.entries(coOccurrences).forEach(([tag1, related]) => {
        Object.entries(related).forEach(([tag2, count]) => {
          if (count >= 3) { // At least 3 co-occurrences
            const id1 = tagIdMap.get(tag1);
            const id2 = tagIdMap.get(tag2);
            if (id1 && id2 && id1 < id2) { // Avoid duplicates
              relationships.push({
                tag_id: id1,
                related_tag_id: id2,
                relationship_type: 'complements',
                strength: Math.min(10, Math.ceil(count / 2)),
              });
            }
          }
        });
      });
      
      if (relationships.length > 0) {
        const { error: insertError } = await supabase
          .from('tag_relationships')
          .upsert(relationships, { onConflict: 'tag_id,related_tag_id' });
        
        if (insertError) console.error('Error inserting relationships:', insertError);
      }
      
      return { 
        newRelationships: relationships.length,
        analyzedGenerations: generations?.length || 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tag-relationships-full'] });
      queryClient.invalidateQueries({ queryKey: ['music-graph-data'] });
    },
  });
}
