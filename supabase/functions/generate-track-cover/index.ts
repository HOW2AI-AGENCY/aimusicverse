import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { trackId, title, style, lyrics, mood, userId } = await req.json();

    if (!trackId) {
      throw new Error('trackId is required');
    }

    console.log(`🎨 Generating MusicVerse cover for track: ${trackId}`);
    console.log(`📋 Title: ${title}, Style: ${style}`);

    // Build creative prompt for MusicVerse style cover
    const moodHint = mood || extractMoodFromStyle(style) || 'energetic and modern';
    const styleHint = style || 'electronic music';
    const lyricsContext = lyrics ? extractThemeFromLyrics(lyrics) : '';

    const imagePrompt = `Create a stunning album cover art for a music streaming platform.

Track: "${title || 'Untitled Track'}"
Music Style: ${styleHint}
Mood: ${moodHint}
${lyricsContext ? `Theme inspiration: ${lyricsContext}` : ''}

Design requirements:
- Modern, minimalistic aesthetic with abstract visual representation
- Deep vibrant colors with smooth gradient effects (purples, blues, magentas, cyans)
- Futuristic, ethereal, dynamic atmosphere
- NO text, NO watermarks, NO logos, NO words, NO letters
- Square format (1:1 aspect ratio), high resolution
- Professional digital art suitable for streaming platforms
- Abstract shapes, light effects, sound wave visualizations
- Clean composition with focal point in center

Style: Abstract digital art, synthwave influences, modern album artwork`;

    console.log('🖼️ Generating cover with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp',
        messages: [
          {
            role: 'user',
            content: imagePrompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Lovable AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const result = await response.json();
    const imageData = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error('❌ No image in response:', JSON.stringify(result).substring(0, 500));
      throw new Error('No image generated');
    }

    console.log('✅ Cover generated, uploading to storage...');

    // Convert base64 to blob
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const coverFileName = `covers/${userId || 'system'}/${trackId}_cover_${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(coverFileName, binaryData, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const publicUrl = supabase.storage.from('project-assets').getPublicUrl(coverFileName).data.publicUrl;
    console.log(`✅ Cover uploaded: ${publicUrl}`);

    // Update track with new cover
    const { error: trackUpdateError } = await supabase
      .from('tracks')
      .update({
        cover_url: publicUrl,
        local_cover_url: publicUrl,
      })
      .eq('id', trackId);

    if (trackUpdateError) {
      console.error('❌ Track update error:', trackUpdateError);
    } else {
      console.log('✅ Track cover updated');
    }

    // Update ALL versions with the same cover (one cover for all A/B versions)
    const { error: versionsUpdateError } = await supabase
      .from('track_versions')
      .update({
        cover_url: publicUrl,
      })
      .eq('track_id', trackId);

    if (versionsUpdateError) {
      console.error('❌ Versions update error:', versionsUpdateError);
    } else {
      console.log('✅ All track versions updated with new cover');
    }

    return new Response(
      JSON.stringify({
        success: true,
        coverUrl: publicUrl,
        trackId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error generating cover:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Cover generation failed',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper to extract mood from style string
function extractMoodFromStyle(style: string | undefined): string {
  if (!style) return '';
  
  const moodKeywords: Record<string, string> = {
    'rock': 'powerful and energetic',
    'pop': 'upbeat and catchy',
    'electronic': 'futuristic and pulsating',
    'jazz': 'smooth and sophisticated',
    'classical': 'elegant and timeless',
    'hip-hop': 'bold and rhythmic',
    'r&b': 'soulful and romantic',
    'metal': 'intense and aggressive',
    'ambient': 'ethereal and atmospheric',
    'dance': 'energetic and euphoric',
    'chill': 'relaxed and mellow',
    'dark': 'mysterious and moody',
    'epic': 'grand and cinematic',
    'lofi': 'nostalgic and cozy',
    'synthwave': 'retro-futuristic and neon',
  };

  const styleLower = style.toLowerCase();
  for (const [keyword, mood] of Object.entries(moodKeywords)) {
    if (styleLower.includes(keyword)) {
      return mood;
    }
  }
  
  return 'modern and dynamic';
}

// Helper to extract theme from lyrics
function extractThemeFromLyrics(lyrics: string | undefined): string {
  if (!lyrics || lyrics.length < 20) return '';
  
  // Take first 200 chars and extract key themes
  const snippet = lyrics.substring(0, 200).replace(/\[.*?\]/g, '').trim();
  if (snippet.length < 10) return '';
  
  return snippet.substring(0, 100);
}
