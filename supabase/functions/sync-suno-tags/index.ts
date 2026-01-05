import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SunoTrackData {
  id: string;
  title: string;
  tags?: string;
  metadata?: {
    tags?: string[];
    style?: string;
    prompt?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { trackData, tags: rawTags } = await req.json() as {
      trackData: SunoTrackData;
      tags?: string[];
    };

    console.log('Syncing tags for track:', trackData.id);

    // Extract tags from different sources
    const allTags: string[] = [];

    // From tags field (comma-separated or space-separated)
    if (trackData.tags) {
      const parsedTags = trackData.tags
        .split(/[,\s]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
      allTags.push(...parsedTags);
    }

    // From metadata.tags array
    if (trackData.metadata?.tags) {
      allTags.push(...trackData.metadata.tags);
    }

    // From style string (extract [Tag] patterns)
    if (trackData.metadata?.style) {
      // Match patterns like [Genre: Rock] or [Mood: Happy]
      const styleTagMatches = trackData.metadata.style.match(/\[([^\]]+)\]/g);
      if (styleTagMatches) {
        const styleTags = styleTagMatches.map(match => 
          match.replace(/[[\]]/g, '').trim()
        );
        allTags.push(...styleTags);
      }
    }

    // From prompt (extract [Tag] patterns)
    if (trackData.metadata?.prompt) {
      // Match patterns like [Verse] or [Chorus]
      const promptTagMatches = trackData.metadata.prompt.match(/\[([^\]]+)\]/g);
      if (promptTagMatches) {
        const promptTags = promptTagMatches.map(match => 
          match.replace(/[[\]]/g, '').trim()
        );
        allTags.push(...promptTags);
      }
    }

    // From manually provided tags
    if (rawTags && Array.isArray(rawTags)) {
      allTags.push(...rawTags);
    }

    // Remove duplicates and empty strings
    const uniqueTags = [...new Set(allTags.filter(t => t.length > 0))];

    console.log(`Found ${uniqueTags.length} unique tags:`, uniqueTags);

    // Sync each tag to database
    const syncedTags = [];
    for (const tagName of uniqueTags) {
      // Categorize tag based on common patterns
      let category = 'genre';
      const lowerTag = tagName.toLowerCase();

      if (/melanchol|happy|sad|dark|bright|aggressive|calm|dreamy|atmospheric|energetic|chill|upbeat|mellow|intense|romantic|nostalgic|epic|ethereal|groovy|funky|angry|peaceful|mysterious|playful|somber|triumphant/i.test(lowerTag)) {
        category = 'mood';
      } else if (/vocal|rap|sing|voice|female|male|choir|acapella|harmony/i.test(lowerTag)) {
        category = 'vocal';
      } else if (/slow|fast|medium|tempo|bpm|uptempo|downtempo/i.test(lowerTag)) {
        category = 'tempo';
      } else if (/piano|guitar|drum|bass|synth|string|orchestra|violin|cello|brass|horn|flute|sax|organ|harp|percussion|808/i.test(lowerTag)) {
        category = 'instrument';
      } else if (/intro|verse|chorus|bridge|outro|drop|breakdown|build|hook/i.test(lowerTag)) {
        category = 'structure';
      }

      // Insert into track_tags table (new normalized storage)
      const normalized = tagName.toLowerCase().trim();
      const { error: trackTagError } = await supabase
        .from('track_tags')
        .upsert({
          track_id: trackData.id,
          tag_name: tagName,
          normalized_name: normalized,
          category: category
        }, { onConflict: 'track_id,normalized_name' });

      if (trackTagError) {
        console.error(`Error saving track tag "${tagName}":`, trackTagError);
      }

      // Also use legacy RPC to sync tag to parsed_suno_tags (backward compatibility)
      const { data: tagId, error: syncError } = await supabase.rpc('sync_parsed_tag', {
        _tag_name: tagName,
        _category: category,
        _metadata: {
          track_id: trackData.id,
          first_seen_in: trackData.title,
        },
      });

      if (syncError) {
        console.error(`Error syncing tag "${tagName}":`, syncError);
      } else {
        syncedTags.push({ tagName, tagId, category });
      }
    }

    // Check which tags exist in main meta_tags table
    const { data: existingMetaTags } = await supabase
      .from('suno_meta_tags')
      .select('tag_name')
      .in('tag_name', uniqueTags);

    const existingTagNames = new Set(existingMetaTags?.map(t => t.tag_name) || []);
    const newTags = uniqueTags.filter(t => !existingTagNames.has(t));

    console.log(`Synced ${syncedTags.length} tags, ${newTags.length} are new and not in meta_tags`);

    return new Response(
      JSON.stringify({
        success: true,
        syncedTags: syncedTags.length,
        newTags: newTags,
        allTags: syncedTags,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing tags:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
