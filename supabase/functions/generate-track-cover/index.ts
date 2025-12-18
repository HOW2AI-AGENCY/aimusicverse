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

    const { trackId, title, style, lyrics, mood, userId, projectId, customPrompt } = await req.json();

    if (!trackId) {
      throw new Error('trackId is required');
    }

    console.log(`🎨 Generating MusicVerse cover for track: ${trackId}`);
    console.log(`📋 Title: ${title}, Style: ${style}, ProjectId: ${projectId || 'none'}`);
    console.log(`📝 Custom prompt: ${customPrompt ? 'yes' : 'no'}`);

    // If custom prompt provided, use it directly
    let imagePrompt: string;
    
    if (customPrompt) {
      imagePrompt = `${customPrompt}. 
Design requirements:
- Square format (1:1 aspect ratio), high resolution
- NO text, NO watermarks, NO logos, NO words, NO letters
- Professional digital art suitable for music streaming platforms
- Clean composition with focal point in center`;
    } else {
      // Fetch project context if track belongs to a project
      let projectContext: { 
        genre?: string; 
        mood?: string; 
        concept?: string; 
        title?: string;
        visualAesthetic?: string;
      } = {};
      
      // Try to get project from track if not provided directly
      let resolvedProjectId = projectId;
      if (!resolvedProjectId) {
        const { data: trackData } = await supabase
          .from('tracks')
          .select('project_id')
          .eq('id', trackId)
          .single();
        resolvedProjectId = trackData?.project_id;
      }
      
      if (resolvedProjectId) {
        const { data: project } = await supabase
          .from('music_projects')
          .select('title, genre, mood, concept, description, visual_aesthetic')
          .eq('id', resolvedProjectId)
          .single();
        
        if (project) {
          projectContext = {
            genre: project.genre,
            mood: project.mood,
            concept: project.concept || project.description,
            title: project.title,
            visualAesthetic: project.visual_aesthetic,
          };
          console.log(`📁 Project context loaded: ${project.title}, visual: ${project.visual_aesthetic || 'none'}`);
        }
      }

      // Build creative prompt for MusicVerse style cover with full context
      const moodHint = mood || projectContext.mood || extractMoodFromStyle(style) || 'energetic and modern';
      const styleHint = style || projectContext.genre || 'electronic music';
      const lyricsTheme = lyrics ? extractThemeFromLyrics(lyrics) : '';
      const conceptHint = projectContext.concept ? extractThemeFromLyrics(projectContext.concept) : '';
      const visualAesthetic = projectContext.visualAesthetic;

      // Analyze lyrics for visual themes
      const visualThemes = extractVisualThemes(lyrics);
      
      // Build a unique, contextual prompt
      imagePrompt = `Create a striking, unique album cover art for a music streaming platform.

Track: "${title || 'Untitled Track'}"
${projectContext.title ? `Album/Project: "${projectContext.title}"` : ''}
Music Genre: ${styleHint}
Mood & Atmosphere: ${moodHint}
${lyricsTheme ? `Lyrical Theme: ${lyricsTheme}` : ''}
${conceptHint ? `Project Concept: ${conceptHint}` : ''}
${visualThemes ? `Visual Imagery from lyrics: ${visualThemes}` : ''}
${visualAesthetic ? `
IMPORTANT - Artist's Visual Direction: ${visualAesthetic}
Follow the artist's visual direction closely - this is the creative vision for the album artwork.` : ''}

Design requirements:
- Create a UNIQUE composition that tells the story of this specific track
- ${visualAesthetic ? 'Follow the artist visual direction above as primary style guide' : `Color palette should reflect the mood: ${getColorPaletteForMood(moodHint)}`}
- NO generic abstract patterns - create meaningful visual narrative
- ${getCreativeDirection(styleHint, moodHint)}
- NO text, NO watermarks, NO logos, NO words, NO letters
- Square format (1:1 aspect ratio), high resolution
- Professional digital art suitable for streaming platforms
- Make this cover DISTINCTIVE - it should stand out in a playlist

Style: ${visualAesthetic || `${getStyleForGenre(styleHint)}, modern album artwork, emotionally resonant`}`;
    }

    console.log('🖼️ Generating cover with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
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

// Helper to extract visual themes from lyrics
function extractVisualThemes(lyrics: string | undefined): string {
  if (!lyrics || lyrics.length < 20) return '';
  
  const visualKeywords: Record<string, string> = {
    'звезд': 'starry night sky',
    'star': 'starry night sky',
    'небо': 'expansive sky',
    'sky': 'expansive sky',
    'ночь': 'night atmosphere',
    'night': 'night atmosphere',
    'солнц': 'bright sunlight',
    'sun': 'bright sunlight',
    'огонь': 'flames and fire',
    'fire': 'flames and fire',
    'вод': 'water elements',
    'water': 'water elements',
    'ocean': 'ocean waves',
    'океан': 'ocean waves',
    'море': 'sea horizon',
    'sea': 'sea horizon',
    'город': 'urban cityscape',
    'city': 'urban cityscape',
    'дожд': 'rain drops',
    'rain': 'rain drops',
    'любов': 'romantic hearts',
    'love': 'romantic hearts',
    'сердц': 'heart shapes',
    'heart': 'heart shapes',
    'свет': 'rays of light',
    'light': 'rays of light',
    'тьма': 'shadows and darkness',
    'dark': 'shadows and darkness',
    'космос': 'cosmic space',
    'space': 'cosmic space',
    'лес': 'forest landscape',
    'forest': 'forest landscape',
    'горы': 'mountain peaks',
    'mountain': 'mountain peaks',
  };
  
  const lyricsLower = lyrics.toLowerCase();
  const themes: string[] = [];
  
  for (const [keyword, theme] of Object.entries(visualKeywords)) {
    if (lyricsLower.includes(keyword) && !themes.includes(theme)) {
      themes.push(theme);
      if (themes.length >= 3) break;
    }
  }
  
  return themes.join(', ');
}

// Helper to get color palette based on mood
function getColorPaletteForMood(mood: string): string {
  const moodLower = mood.toLowerCase();
  
  if (moodLower.includes('dark') || moodLower.includes('mysterious') || moodLower.includes('moody')) {
    return 'deep purples, blacks, dark blues with subtle red accents';
  }
  if (moodLower.includes('energetic') || moodLower.includes('aggressive') || moodLower.includes('powerful')) {
    return 'bold reds, oranges, electric yellows with high contrast';
  }
  if (moodLower.includes('romantic') || moodLower.includes('soulful') || moodLower.includes('love')) {
    return 'soft pinks, warm reds, rose golds with gentle gradients';
  }
  if (moodLower.includes('chill') || moodLower.includes('relaxed') || moodLower.includes('mellow')) {
    return 'soft blues, teals, lavenders with pastel tones';
  }
  if (moodLower.includes('nostalgic') || moodLower.includes('retro')) {
    return 'warm oranges, sunset yellows, vintage browns with film grain feel';
  }
  if (moodLower.includes('ethereal') || moodLower.includes('atmospheric')) {
    return 'soft whites, silvers, light blues with dreamy glow effects';
  }
  if (moodLower.includes('futuristic') || moodLower.includes('neon')) {
    return 'neon pinks, electric blues, cyans with glowing effects';
  }
  if (moodLower.includes('elegant') || moodLower.includes('sophisticated')) {
    return 'golds, deep burgundies, rich blacks with refined textures';
  }
  
  return 'vibrant purples, blues, magentas, cyans with smooth gradient effects';
}

// Helper to get visual style based on genre
function getStyleForGenre(genre: string): string {
  const genreLower = genre.toLowerCase();
  
  if (genreLower.includes('synthwave') || genreLower.includes('retrowave')) {
    return 'synthwave influences, neon grid, retro 80s aesthetic';
  }
  if (genreLower.includes('rock') || genreLower.includes('metal')) {
    return 'bold graphic elements, sharp edges, grunge textures';
  }
  if (genreLower.includes('jazz') || genreLower.includes('blues')) {
    return 'smoky atmosphere, warm tones, vintage photography feel';
  }
  if (genreLower.includes('classical')) {
    return 'elegant flourishes, timeless composition, renaissance influences';
  }
  if (genreLower.includes('hip-hop') || genreLower.includes('rap')) {
    return 'urban aesthetic, bold typography-inspired shapes, street art influences';
  }
  if (genreLower.includes('ambient') || genreLower.includes('chill')) {
    return 'minimal design, soft gradients, zen-like simplicity';
  }
  if (genreLower.includes('edm') || genreLower.includes('dance') || genreLower.includes('electronic')) {
    return 'geometric patterns, pulsating waves, club atmosphere';
  }
  if (genreLower.includes('lofi') || genreLower.includes('lo-fi')) {
    return 'anime-inspired, cozy room aesthetic, warm nostalgic tones';
  }
  if (genreLower.includes('pop')) {
    return 'bright colors, playful shapes, contemporary design';
  }
  
  return 'modern abstract digital art with dynamic composition';
}

// Helper to get creative direction for unique covers
function getCreativeDirection(genre: string, mood: string): string {
  const genreLower = genre.toLowerCase();
  const moodLower = mood.toLowerCase();
  
  const directions: string[] = [];
  
  // Add unique visual narrative suggestions based on genre
  if (genreLower.includes('rock') || genreLower.includes('metal')) {
    directions.push('dramatic lighting with bold contrasts');
    directions.push('powerful silhouettes or dynamic motion blur');
  } else if (genreLower.includes('pop')) {
    directions.push('vibrant and eye-catching with bold focal point');
    directions.push('playful visual metaphors');
  } else if (genreLower.includes('electronic') || genreLower.includes('edm')) {
    directions.push('futuristic elements with depth and dimension');
    directions.push('light trails and energy flows');
  } else if (genreLower.includes('jazz') || genreLower.includes('soul')) {
    directions.push('rich textures and warm atmospheric depth');
    directions.push('elegant simplicity with sophisticated details');
  } else if (genreLower.includes('hip-hop') || genreLower.includes('rap')) {
    directions.push('bold visual statement with cultural elements');
    directions.push('striking composition with attitude');
  } else if (genreLower.includes('ambient') || genreLower.includes('chill')) {
    directions.push('serene landscape or dreamscape');
    directions.push('ethereal depth with calming visual flow');
  } else {
    directions.push('creative visual storytelling');
    directions.push('unique artistic interpretation');
  }
  
  // Add mood-specific elements
  if (moodLower.includes('dark') || moodLower.includes('mysterious')) {
    directions.push('shadows and hidden elements creating intrigue');
  } else if (moodLower.includes('energetic') || moodLower.includes('powerful')) {
    directions.push('dynamic movement and explosive energy');
  } else if (moodLower.includes('romantic') || moodLower.includes('emotional')) {
    directions.push('soft emotional resonance and intimate feeling');
  } else if (moodLower.includes('happy') || moodLower.includes('upbeat')) {
    directions.push('bright optimistic elements and positive energy');
  }
  
  return directions.slice(0, 2).join(', ');
}
