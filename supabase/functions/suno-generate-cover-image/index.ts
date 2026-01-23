import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { isSunoSuccessCode } from "../_shared/suno.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      console.error('SUNO_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { trackId, prompt, style } = await req.json();

    if (!trackId) {
      return new Response(
        JSON.stringify({ error: 'trackId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', trackId)
      .eq('user_id', user.id)
      .single();

    if (trackError || !track) {
      return new Response(
        JSON.stringify({ error: 'Track not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating cover image for track:', trackId);

    const callBackUrl = `${supabaseUrl}/functions/v1/suno-cover-callback`;

    // Build comprehensive prompt with variety based on track details
    const imagePrompt = prompt || buildDynamicPrompt(track, style);

    // Call Suno API for cover image generation
    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/image/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        callBackUrl,
        size: '1024x1024',
      }),
    });

    const sunoData = await sunoResponse.json();

    if (!sunoResponse.ok || !isSunoSuccessCode(sunoData.code)) {
      console.error('Suno API error:', sunoData);
      return new Response(
        JSON.stringify({ error: sunoData.msg || 'Failed to generate cover' }),
        { status: sunoResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const taskId = sunoData.data?.taskId;

    if (!taskId) {
      throw new Error('No taskId in Suno response');
    }

    console.log('Cover generation task created:', taskId);

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        message: 'Cover generation started',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suno-generate-cover-image:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Build dynamic prompt with variety and MusicVerse branding
function buildDynamicPrompt(track: any, style?: string): string {
  const title = track.title || 'Music';
  const trackStyle = track.style || style || 'abstract music';
  
  // Hash for consistent but varied selection
  const hash = simpleHash(title + trackStyle + (track.id || ''));
  
  // MusicVerse branded art styles
  const artStyles = [
    'sleek MusicVerse-style 3D render',
    'abstract expressionist with MV signature gradients',
    'surrealist artwork with MusicVerse aesthetic',
    'minimalist MusicVerse design',
    'neon cyberpunk with MV purple-blue accents',
    'vintage photograph with MusicVerse touch',
    'watercolor illustration MusicVerse edition',
    'geometric abstract with MV color palette',
    'photorealistic MusicVerse production',
    'pop art with MusicVerse branding elements',
    'anime-inspired MV style',
    'oil painting with MusicVerse signature',
    'glitch art with MV digital aesthetic',
    'collage mixed media MusicVerse style',
    'vector illustration with MV gradients',
  ];
  
  // MusicVerse signature color palettes (purple-blue as signature)
  const colorPalettes = [
    'MusicVerse signature purple-blue gradient with neon accents',
    'warm sunset tones with MV purple undertones',
    'cool ocean hues transitioning to MV violet',
    'dark moody palette with MusicVerse deep purple and crimson',
    'pastel dreamscape with MV soft lavender accent',
    'high contrast with MusicVerse purple accent stripe',
    'cosmic palette with MV deep space purple and starlight',
    'MusicVerse neon: electric blue fading to hot pink',
    'monochromatic MV purple variations from deep violet to lilac',
    'icy cool tones with MusicVerse indigo glow',
    'retro 80s with MusicVerse cyan-magenta gradient',
    'golden hour warmth with MV purple shadow',
    'midnight palette with MusicVerse violet aurora',
    'MV premium: black and gold with purple accent',
    'holographic MusicVerse spectrum effect',
  ];
  
  // Compositions
  const compositions = [
    'centered focal point with MusicVerse radial glow',
    'dramatic diagonal with MV color sweep',
    'minimalist with MusicVerse subtle branding',
    'layered depth with MV gradient overlay',
    'extreme close-up with MusicVerse light refraction',
    'panoramic with MV horizon accent',
    'symmetrical with MusicVerse mirror effect',
    'dynamic arrangement with MV energy lines',
    'spiral composition with MusicVerse color flow',
    'split contrast with MV gradient bridge',
  ];
  
  // Visual themes based on style
  const getVisualTheme = (s: string): string => {
    const styleLower = s.toLowerCase();
    if (styleLower.includes('rock') || styleLower.includes('metal')) {
      return 'dramatic flames and lightning with MusicVerse purple glow';
    }
    if (styleLower.includes('electronic') || styleLower.includes('edm')) {
      return 'futuristic cityscape with MusicVerse holographic overlays';
    }
    if (styleLower.includes('jazz') || styleLower.includes('soul')) {
      return 'smoky atmosphere with MusicVerse warm purple lighting';
    }
    if (styleLower.includes('hip') || styleLower.includes('rap')) {
      return 'urban scene with MusicVerse neon signs and purple accents';
    }
    if (styleLower.includes('pop')) {
      return 'colorful bubbles with MusicVerse gradient reflections';
    }
    if (styleLower.includes('ambient') || styleLower.includes('chill')) {
      return 'serene landscape with MusicVerse aurora borealis';
    }
    if (styleLower.includes('classical')) {
      return 'elegant baroque with MusicVerse purple velvet accents';
    }
    return 'abstract soundwaves with MusicVerse signature purple-blue energy';
  };
  
  const selectedArtStyle = artStyles[hash % artStyles.length];
  const selectedPalette = colorPalettes[(hash + 3) % colorPalettes.length];
  const selectedComposition = compositions[(hash + 7) % compositions.length];
  const visualTheme = getVisualTheme(trackStyle);
  
  return `Create a ${selectedArtStyle} album cover art for "${title}".
Music style: ${trackStyle}.
Color palette: ${selectedPalette}.
Composition: ${selectedComposition}.
Visual theme: ${visualTheme}.
MusicVerse aesthetic: modern, premium, distinctive.
Professional quality, suitable for streaming platforms.
NO text, NO watermarks, NO logos, NO words, NO letters.
Square format, high resolution, memorable and shareable.`;
}

// Simple string hash for consistent randomization
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
