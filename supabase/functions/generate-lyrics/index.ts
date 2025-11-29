import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      theme,
      style,
      mood,
      structure = 'verse-chorus-verse-chorus-bridge-chorus',
      artistPersona,
      referenceLyrics,
      additionalContext,
      trackId,
    } = await req.json();

    if (!theme) {
      throw new Error('Theme is required');
    }

    console.log(`Generating lyrics for user: ${user.id}`);

    // Multi-stage lyrics generation pipeline

    // Stage 1: Generate concept and key phrases
    const conceptPrompt = `You are a professional songwriter. Create a concept and key phrases for a song.

Theme: ${theme}
Style: ${style || 'any'}
Mood: ${mood || 'any'}
${artistPersona ? `Artist Persona: ${artistPersona}` : ''}
${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate:
1. Core concept (1-2 sentences)
2. Key emotional phrases (5-7 phrases)
3. Metaphors and imagery suggestions
4. Hook/chorus ideas

Return as JSON:
{
  "concept": "...",
  "keyPhrases": ["...", "..."],
  "metaphors": ["...", "..."],
  "hookIdeas": ["...", "..."]
}`;

    const conceptResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: conceptPrompt }],
        temperature: 0.8,
      }),
    });

    if (!conceptResponse.ok) {
      throw new Error('Failed to generate concept');
    }

    const conceptData = await conceptResponse.json();
    const conceptText = conceptData.choices?.[0]?.message?.content || '{}';
    
    let concept;
    try {
      const jsonMatch = conceptText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       conceptText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : conceptText;
      concept = JSON.parse(jsonText);
    } catch (e) {
      concept = { concept: theme, keyPhrases: [], metaphors: [], hookIdeas: [] };
    }

    // Stage 2: Generate full lyrics based on concept
    const lyricsPrompt = `You are a professional songwriter. Write complete song lyrics based on the following:

Concept: ${concept.concept}
Key Phrases: ${concept.keyPhrases?.join(', ')}
Metaphors: ${concept.metaphors?.join(', ')}
Hook Ideas: ${concept.hookIdeas?.join(', ')}

Structure: ${structure}
Style: ${style || 'any'}
Mood: ${mood || 'any'}
${artistPersona ? `Artist Voice: ${artistPersona}` : ''}
${referenceLyrics ? `Reference Style:\n${referenceLyrics}` : ''}

Requirements:
- Follow the specified structure exactly
- Mark sections clearly: [Verse 1], [Chorus], [Verse 2], [Bridge], etc.
- Use natural, authentic language
- Include emotional depth
- Make it singable and memorable
- Rhyme scheme should feel natural, not forced

Write the complete lyrics now:`;

    const lyricsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: lyricsPrompt }],
        temperature: 0.9,
      }),
    });

    if (!lyricsResponse.ok) {
      throw new Error('Failed to generate lyrics');
    }

    const lyricsData = await lyricsResponse.json();
    const generatedLyrics = lyricsData.choices?.[0]?.message?.content || '';

    // Stage 3: Generate Suno-optimized tags
    const tagsPrompt = `Based on these lyrics and context, generate 5-7 descriptive tags optimized for Suno AI music generation.

Lyrics excerpt:
${generatedLyrics.substring(0, 500)}...

Style: ${style || 'any'}
Mood: ${mood || 'any'}

Return ONLY a comma-separated list of tags (no JSON, no explanation):`;

    const tagsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: tagsPrompt }],
        temperature: 0.5,
      }),
    });

    const tagsData = await tagsResponse.json();
    const generatedTags = tagsData.choices?.[0]?.message?.content?.trim() || '';

    // Log the generation if trackId provided
    if (trackId) {
      await supabase.from('track_change_log').insert({
        track_id: trackId,
        user_id: user.id,
        change_type: 'ai_generate_lyrics',
        changed_by: 'ai',
        ai_model_used: 'gemini_2.5_flash',
        prompt_used: theme,
        new_value: generatedLyrics,
        metadata: {
          concept,
          tags: generatedTags,
          structure,
          style,
          mood,
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        lyrics: generatedLyrics,
        concept,
        tags: generatedTags,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-lyrics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
