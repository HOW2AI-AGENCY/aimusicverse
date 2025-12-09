import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetaTag {
  id: string;
  tag_name: string;
  category: string;
  description: string | null;
  syntax_format: string | null;
  is_explicit_format: boolean;
}

export interface MusicStyle {
  id: string;
  style_name: string;
  primary_genre: string | null;
  description: string | null;
  popularity_score: number;
  is_fusion: boolean;
  mood_atmosphere: string[] | null;
  geographic_influence: string[] | null;
}

export interface StyleTagMapping {
  id: string;
  style_id: string;
  tag_id: string;
  is_primary: boolean;
  relevance_score: number;
}

export interface TagRelationship {
  id: string;
  tag_id: string;
  related_tag_id: string;
  relationship_type: string;
  strength: number;
  description: string | null;
}

// Graph node types
export type NodeType = 'genre' | 'style' | 'tag' | 'category';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  category?: string;
  genre?: string;
  size: number;
  color: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'genre-style' | 'style-tag' | 'tag-tag' | 'category-tag';
  strength: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Color schemes for different node types
const CATEGORY_COLORS: Record<string, string> = {
  structure: '#3b82f6',
  vocal: '#ec4899',
  instrument: '#f59e0b',
  genre_style: '#8b5cf6',
  mood_energy: '#ef4444',
  production_texture: '#14b8a6',
  effect_processing: '#6366f1',
  special_effects: '#f97316',
  transition_dynamics: '#84cc16',
  format: '#06b6d4',
};

const GENRE_COLORS: Record<string, string> = {
  'Electronic': '#8b5cf6',
  'Hip-Hop': '#f59e0b',
  'Pop': '#ec4899',
  'Rock': '#ef4444',
  'Jazz': '#14b8a6',
  'Folk': '#84cc16',
  'Latin': '#f97316',
  'Soul': '#6366f1',
  'Funk': '#eab308',
  'Reggae': '#22c55e',
};

export function useMetaTags() {
  return useQuery({
    queryKey: ['meta-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suno_meta_tags')
        .select('*')
        .order('category', { ascending: true })
        .order('tag_name', { ascending: true });
      
      if (error) throw error;
      return data as MetaTag[];
    },
  });
}

export function useMusicStyles() {
  return useQuery({
    queryKey: ['music-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_styles')
        .select('*')
        .order('popularity_score', { ascending: false });
      
      if (error) throw error;
      return data as MusicStyle[];
    },
  });
}

export function useStyleTagMappings() {
  return useQuery({
    queryKey: ['style-tag-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('style_tag_mappings')
        .select('*');
      
      if (error) throw error;
      return data as StyleTagMapping[];
    },
  });
}

export function useTagRelationships() {
  return useQuery({
    queryKey: ['tag-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_relationships')
        .select('*');
      
      if (error) throw error;
      return data as TagRelationship[];
    },
  });
}

export function useMusicGraphData() {
  const { data: tags } = useMetaTags();
  const { data: styles } = useMusicStyles();
  const { data: mappings } = useStyleTagMappings();
  const { data: relationships } = useTagRelationships();

  const buildGraphData = (): GraphData => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const addedNodeIds = new Set<string>();

    if (!tags || !styles) {
      return { nodes, edges };
    }

    // Get unique genres
    const genres = [...new Set(styles.map(s => s.primary_genre).filter(Boolean))];
    
    // Add genre nodes
    genres.forEach(genre => {
      if (!genre) return;
      const id = `genre-${genre}`;
      if (!addedNodeIds.has(id)) {
        nodes.push({
          id,
          label: genre,
          type: 'genre',
          size: 40,
          color: GENRE_COLORS[genre] || '#6b7280',
          metadata: { genre },
        });
        addedNodeIds.add(id);
      }
    });

    // Add style nodes and connect to genres
    styles.forEach(style => {
      const id = `style-${style.id}`;
      if (!addedNodeIds.has(id)) {
        nodes.push({
          id,
          label: style.style_name,
          type: 'style',
          genre: style.primary_genre || undefined,
          size: 20 + (style.popularity_score || 0) * 2,
          color: style.primary_genre ? GENRE_COLORS[style.primary_genre] || '#6b7280' : '#6b7280',
          metadata: { ...style },
        });
        addedNodeIds.add(id);

        // Connect style to genre
        if (style.primary_genre) {
          edges.push({
            id: `edge-genre-${style.primary_genre}-style-${style.id}`,
            source: `genre-${style.primary_genre}`,
            target: id,
            type: 'genre-style',
            strength: 1,
          });
        }
      }
    });

    // Get unique categories
    const categories = [...new Set(tags.map(t => t.category))];

    // Add category nodes
    categories.forEach(category => {
      const id = `category-${category}`;
      if (!addedNodeIds.has(id)) {
        nodes.push({
          id,
          label: category.replace(/_/g, ' '),
          type: 'category',
          category,
          size: 35,
          color: CATEGORY_COLORS[category] || '#6b7280',
        });
        addedNodeIds.add(id);
      }
    });

    // Add tag nodes and connect to categories
    tags.forEach(tag => {
      const id = `tag-${tag.id}`;
      if (!addedNodeIds.has(id)) {
        nodes.push({
          id,
          label: tag.tag_name,
          type: 'tag',
          category: tag.category,
          size: 12,
          color: CATEGORY_COLORS[tag.category] || '#6b7280',
          metadata: { ...tag },
        });
        addedNodeIds.add(id);

        // Connect tag to category
        edges.push({
          id: `edge-category-${tag.category}-tag-${tag.id}`,
          source: `category-${tag.category}`,
          target: id,
          type: 'category-tag',
          strength: 0.5,
        });
      }
    });

    // Add style-tag edges from mappings
    if (mappings) {
      mappings.forEach(mapping => {
        const sourceId = `style-${mapping.style_id}`;
        const targetId = `tag-${mapping.tag_id}`;
        
        if (addedNodeIds.has(sourceId) && addedNodeIds.has(targetId)) {
          edges.push({
            id: `edge-${mapping.id}`,
            source: sourceId,
            target: targetId,
            type: 'style-tag',
            strength: (mapping.relevance_score || 5) / 10,
            label: mapping.is_primary ? 'primary' : undefined,
          });
        }
      });
    }

    // Add tag-tag edges from relationships
    if (relationships) {
      relationships.forEach(rel => {
        const sourceId = `tag-${rel.tag_id}`;
        const targetId = `tag-${rel.related_tag_id}`;
        
        if (addedNodeIds.has(sourceId) && addedNodeIds.has(targetId)) {
          edges.push({
            id: `edge-rel-${rel.id}`,
            source: sourceId,
            target: targetId,
            type: 'tag-tag',
            strength: (rel.strength || 1) / 10,
            label: rel.relationship_type,
          });
        }
      });
    }

    return { nodes, edges };
  };

  return {
    graphData: buildGraphData(),
    isLoading: !tags || !styles,
    tags,
    styles,
    mappings,
    relationships,
  };
}
