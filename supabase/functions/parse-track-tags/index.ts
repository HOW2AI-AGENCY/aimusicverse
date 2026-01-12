import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger("parse-track-tags");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Track {
  id: string;
  style: string | null;
  tags: string | null;
  prompt: string | null;
  title: string | null;
}

// Known genres from database
const KNOWN_GENRES = [
  'electronic', 'rock', 'pop', 'hip-hop', 'jazz', 'classical', 'r&b', 'country', 
  'metal', 'folk', 'ambient', 'synthwave', 'house', 'techno', 'drum and bass',
  'dubstep', 'trance', 'chillout', 'lo-fi', 'indie', 'punk', 'blues', 'soul',
  'funk', 'disco', 'reggae', 'latin', 'world', 'experimental'
];

// Tag categories
const TAG_CATEGORIES: Record<string, string[]> = {
  vocal: ['male vocal', 'female vocal', 'duet', 'choir', 'harmony', 'falsetto', 'rap', 'spoken word', 'whisper', 'shout'],
  instrument: ['guitar', 'piano', 'drums', 'bass', 'synth', 'strings', 'brass', 'saxophone', 'violin', 'cello', 'flute', 'trumpet', 'organ'],
  mood_energy: ['energetic', 'calm', 'dark', 'bright', 'melancholic', 'happy', 'aggressive', 'peaceful', 'romantic', 'nostalgic', 'epic', 'dreamy'],
  production_texture: ['lo-fi', 'hi-fi', 'distorted', 'clean', 'reverb', 'delay', 'compressed', 'acoustic', 'electronic', 'organic'],
  structure: ['intro', 'verse', 'chorus', 'bridge', 'outro', 'breakdown', 'drop', 'build-up'],
  tempo: ['slow', 'mid-tempo', 'fast', 'uptempo', 'downtempo'],
};

function extractTags(text: string): string[] {
  if (!text) return [];
  
  const normalizedText = text.toLowerCase();
  const foundTags: string[] = [];
  
  // Extract genres
  KNOWN_GENRES.forEach(genre => {
    if (normalizedText.includes(genre)) {
      foundTags.push(genre);
    }
  });
  
  // Extract categorized tags
  Object.values(TAG_CATEGORIES).flat().forEach(tag => {
    if (normalizedText.includes(tag)) {
      foundTags.push(tag);
    }
  });
  
  // Extract from comma-separated style field
  const words = normalizedText.split(/[,\s]+/).filter(w => w.length > 2);
  words.forEach(word => {
    if (!foundTags.includes(word) && word.length > 3) {
      // Check if it's a potential style descriptor
      if (/^[a-z-]+$/.test(word)) {
        foundTags.push(word);
      }
    }
  });
  
  return [...new Set(foundTags)];
}

function categorizeTag(tag: string): string {
  for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
    if (tags.includes(tag)) {
      return category;
    }
  }
  if (KNOWN_GENRES.includes(tag)) {
    return 'genre_style';
  }
  return 'genre_style'; // default
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    const { trackId, parseAll } = await req.json();

    let tracksToProcess: Track[] = [];

    if (parseAll) {
      // Get all completed tracks
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select('id, style, tags, prompt, title')
        .eq('status', 'completed')
        .limit(500);

      if (error) throw error;
      tracksToProcess = tracks || [];
    } else if (trackId) {
      const { data: track, error } = await supabase
        .from('tracks')
        .select('id, style, tags, prompt, title')
        .eq('id', trackId)
        .single();

      if (error) throw error;
      if (track) tracksToProcess = [track];
    }

    logger.info(`Processing ${tracksToProcess.length} tracks`);

    // Get existing tags
    const { data: existingTags } = await supabase
      .from('suno_meta_tags')
      .select('tag_name');

    const existingTagNames = new Set((existingTags || []).map(t => t.tag_name.toLowerCase()));

    // Get existing styles
    const { data: existingStyles } = await supabase
      .from('music_styles')
      .select('style_name');

    const existingStyleNames = new Set((existingStyles || []).map(s => s.style_name.toLowerCase()));

    const newTags: { tag_name: string; category: string; description: string }[] = [];
    const newStyles: { style_name: string; primary_genre: string; description: string }[] = [];
    const discoveredTags = new Map<string, number>();
    const discoveredStyles = new Map<string, number>();

    for (const track of tracksToProcess) {
      // Combine all text fields for analysis
      const combinedText = [track.style, track.tags, track.prompt, track.title].filter(Boolean).join(' ');
      
      const tags = extractTags(combinedText);
      
      tags.forEach(tag => {
        discoveredTags.set(tag, (discoveredTags.get(tag) || 0) + 1);
        
        // Add new tag if not exists and appears in multiple tracks
        if (!existingTagNames.has(tag) && discoveredTags.get(tag)! >= 2) {
          const category = categorizeTag(tag);
          if (!newTags.find(t => t.tag_name === tag)) {
            newTags.push({
              tag_name: tag,
              category: category,
              description: `Тег "${tag}" извлечен из сгенерированных треков`
            });
          }
        }
      });

      // Extract potential style names
      if (track.style) {
        const styleName = track.style.split(',')[0]?.trim();
        if (styleName && styleName.length > 3 && styleName.length < 50) {
          discoveredStyles.set(styleName, (discoveredStyles.get(styleName) || 0) + 1);
          
          if (!existingStyleNames.has(styleName.toLowerCase()) && discoveredStyles.get(styleName)! >= 2) {
            const genre = KNOWN_GENRES.find(g => styleName.toLowerCase().includes(g)) || 'electronic';
            if (!newStyles.find(s => s.style_name === styleName)) {
              newStyles.push({
                style_name: styleName,
                primary_genre: genre,
                description: `Стиль "${styleName}" обнаружен в сгенерированных треках`
              });
            }
          }
        }
      }
    }

    // Insert new tags (limit to prevent spam)
    let insertedTags = 0;
    if (newTags.length > 0) {
      const tagsToInsert = newTags.slice(0, 20).map(t => ({
        tag_name: t.tag_name,
        category: t.category as any,
        description: t.description,
        is_explicit_format: false
      }));

      const { error: insertError } = await supabase
        .from('suno_meta_tags')
        .insert(tagsToInsert)
        .select();

      if (!insertError) {
        insertedTags = tagsToInsert.length;
      } else {
        logger.warn('Error inserting tags', { error: insertError });
      }
    }

    // Insert new styles (limit to prevent spam)
    let insertedStyles = 0;
    if (newStyles.length > 0) {
      const stylesToInsert = newStyles.slice(0, 10).map(s => ({
        style_name: s.style_name,
        primary_genre: s.primary_genre,
        description: s.description,
        popularity_score: 1
      }));

      const { error: insertError } = await supabase
        .from('music_styles')
        .insert(stylesToInsert)
        .select();

      if (!insertError) {
        insertedStyles = stylesToInsert.length;
      } else {
        logger.warn('Error inserting styles', { error: insertError });
      }
    }

    const result = {
      tracksProcessed: tracksToProcess.length,
      discoveredTags: Array.from(discoveredTags.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50),
      discoveredStyles: Array.from(discoveredStyles.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20),
      insertedTags,
      insertedStyles,
      newTagsList: newTags.slice(0, 20),
      newStylesList: newStyles.slice(0, 10)
    };

    logger.info('Parsing complete', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Error parsing tags", error as Error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
