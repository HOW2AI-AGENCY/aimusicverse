import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');

    if (!sunoApiKey) {
      console.error('SUNO_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Build dynamic prompt with variety based on track details
function buildDynamicPrompt(track: any, style?: string): string {
  const title = track.title || 'Music';
  const trackStyle = track.style || style || 'abstract music';
  
  // Hash for consistent but varied selection
  const hash = simpleHash(title + trackStyle + (track.id || ''));
  
  // Art styles variety
  const artStyles = [
    'digital 3D render',
    'abstract expressionist painting',
    'surrealist artwork',
    'minimalist design',
    'neon cyberpunk',
    'vintage photograph style',
    'watercolor illustration',
    'geometric abstract',
    'photorealistic',
    'pop art',
    'anime-inspired',
    'oil painting',
    'glitch art',
    'collage mixed media',
    'vector illustration',
  ];
  
  // Color palettes
  const colorPalettes = [
    'vibrant neon colors with electric blue and hot pink',
    'warm sunset tones with orange, gold, and magenta',
    'cool ocean hues with teal, navy, and seafoam',
    'dark moody palette with deep purple and crimson',
    'pastel dreamscape with soft pink, lavender, and mint',
    'high contrast black and white with red accent',
    'earthy natural tones with forest green and terracotta',
    'cosmic palette with deep space purple and starlight gold',
    'candy colors with bright pink, yellow, and turquoise',
    'monochromatic blue variations from navy to sky',
    'autumn warmth with rust, amber, and burgundy',
    'icy cool tones with silver, ice blue, and white',
    'retro 80s with neon pink, cyan, and yellow',
    'golden hour with warm amber, coral, and champagne',
    'midnight palette with indigo, violet, and silver',
  ];
  
  // Compositions
  const compositions = [
    'centered focal point with radial symmetry',
    'dramatic diagonal composition',
    'minimalist with lots of negative space',
    'layered depth with foreground and background',
    'extreme close-up abstract detail',
    'panoramic wide view',
    'symmetrical mirror reflection',
    'chaotic but balanced arrangement',
    'spiral golden ratio composition',
    'split screen contrast',
  ];
  
  // Visual themes based on style
  const getVisualTheme = (s: string): string => {
    const styleLower = s.toLowerCase();
    if (styleLower.includes('rock') || styleLower.includes('metal')) {
      return 'dramatic flames, lightning, or shattered elements';
    }
    if (styleLower.includes('electronic') || styleLower.includes('edm')) {
      return 'futuristic cityscapes, digital particles, or holographic surfaces';
    }
    if (styleLower.includes('jazz') || styleLower.includes('soul')) {
      return 'smoky atmosphere, musical instruments, or vintage club scene';
    }
    if (styleLower.includes('hip') || styleLower.includes('rap')) {
      return 'urban street scene, luxury elements, or bold graphic shapes';
    }
    if (styleLower.includes('pop')) {
      return 'colorful bubbles, glossy surfaces, or playful shapes';
    }
    if (styleLower.includes('ambient') || styleLower.includes('chill')) {
      return 'serene landscapes, misty mountains, or calm water';
    }
    if (styleLower.includes('classical')) {
      return 'elegant baroque flourishes, marble sculpture, or concert hall';
    }
    return 'abstract shapes and dynamic movement';
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
Professional quality, suitable for streaming platforms.
NO text, NO watermarks, NO logos, NO words, NO letters.
Square format, high resolution, distinctive and memorable.`;
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
