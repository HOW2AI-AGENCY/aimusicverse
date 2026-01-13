import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = getSupabaseClient();

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
      
      // Get randomized visual style for variety
      const visualStyle = getRandomizedVisualStyle(styleHint, moodHint, title || '');
      const colorPalette = getRandomizedColorPalette(moodHint, styleHint, title || '');
      const artStyle = getRandomArtStyle(styleHint);
      const composition = getRandomComposition();

      // Build a unique, contextual prompt
      imagePrompt = `Create a ${artStyle} album cover art for a music streaming platform.

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
- Visual Style: ${visualStyle.style}
- ${visualAesthetic ? 'Follow the artist visual direction above as primary style guide' : `Color palette: ${colorPalette.colors} with ${colorPalette.technique}`}
- Composition: ${composition}
- Mood expression: ${visualStyle.moodExpression}
- ${visualStyle.uniqueElement}
- NO text, NO watermarks, NO logos, NO words, NO letters
- Square format (1:1 aspect ratio), high resolution
- Professional digital art suitable for streaming platforms
- Make this cover DISTINCTIVE and MEMORABLE

Art direction: ${artStyle}, ${visualStyle.aesthetic}`;
    }

    // Try Lovable AI first, fallback to Replicate if it fails
    let imageData: string | null = null;
    let usedProvider = 'lovable';

    console.log('🖼️ Generating cover with Lovable AI...');
    try {
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
        // If 402 (payment required) or 429 (rate limit), try Replicate
        if (response.status === 402 || response.status === 429) {
          throw new Error(`Lovable AI unavailable: ${response.status}`);
        }
        throw new Error(`AI generation failed: ${response.status}`);
      }

      const result = await response.json();
      imageData = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) {
        console.error('❌ No image in Lovable response:', JSON.stringify(result).substring(0, 500));
        throw new Error('No image generated from Lovable AI');
      }
    } catch (lovableError: any) {
      console.warn('⚠️ Lovable AI failed, trying Replicate fallback...', lovableError.message);
      
      // Fallback to Replicate with FLUX Schnell
      const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
      if (!replicateApiKey) {
        throw new Error('Both Lovable AI and Replicate are unavailable');
      }

      usedProvider = 'replicate';
      
      // Simplify prompt for FLUX
      const fluxPrompt = `Album cover art, square format 1:1, no text, no watermarks, no logos, no letters. ${title || 'Music track'}. Style: ${style || 'modern music'}. Professional digital art for streaming platforms, high quality, distinctive and memorable.`;
      
      console.log('🎨 Generating with Replicate FLUX...');
      
      const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${replicateApiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait',
        },
        body: JSON.stringify({
          version: 'black-forest-labs/flux-schnell',
          input: {
            prompt: fluxPrompt,
            go_fast: true,
            megapixels: '1',
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'png',
            output_quality: 90,
            num_inference_steps: 4,
          },
        }),
      });

      if (!replicateResponse.ok) {
        const errorText = await replicateResponse.text();
        console.error('❌ Replicate error:', replicateResponse.status, errorText);
        throw new Error(`Replicate generation failed: ${replicateResponse.status}`);
      }

      const replicateResult = await replicateResponse.json();
      
      // If still processing, wait and poll
      let prediction = replicateResult;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max
      
      while (prediction.status === 'starting' || prediction.status === 'processing') {
        if (attempts >= maxAttempts) {
          throw new Error('Replicate generation timeout');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: {
            'Authorization': `Bearer ${replicateApiKey}`,
          },
        });
        prediction = await statusResponse.json();
        attempts++;
      }

      if (prediction.status === 'failed') {
        console.error('❌ Replicate prediction failed:', prediction.error);
        throw new Error(`Replicate failed: ${prediction.error}`);
      }

      const replicateImageUrl = prediction.output?.[0];
      if (!replicateImageUrl) {
        throw new Error('No image from Replicate');
      }

      console.log('✅ Replicate generated image, downloading...');
      
      // Download the image from Replicate URL
      const imageResponse = await fetch(replicateImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const replicateBinaryData = new Uint8Array(imageBuffer);

      // Upload directly to Supabase Storage
      const coverFileName = `covers/${userId || 'system'}/${trackId}_cover_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(coverFileName, replicateBinaryData, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const publicUrl = supabase.storage.from('project-assets').getPublicUrl(coverFileName).data.publicUrl;
      console.log(`✅ Cover uploaded via Replicate: ${publicUrl}`);

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

      // Update ALL versions with the same cover
      await supabase
        .from('track_versions')
        .update({ cover_url: publicUrl })
        .eq('track_id', trackId);

      // Log to content_audit_log
      await supabase.from('content_audit_log').insert({
        entity_type: 'cover',
        entity_id: trackId,
        user_id: userId || 'system',
        actor_type: 'ai',
        ai_model_used: 'replicate/flux-schnell',
        action_type: 'generated',
        action_category: 'generation',
        prompt_used: fluxPrompt,
        output_metadata: {
          cover_url: publicUrl,
          storage_path: coverFileName,
          provider: 'replicate',
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          coverUrl: publicUrl,
          trackId,
          provider: 'replicate',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Cover generated via ${usedProvider}, uploading to storage...`);

    // Convert base64 to blob for Lovable AI response
    const base64Data = imageData!.replace(/^data:image\/\w+;base64,/, '');
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

    // Log to content_audit_log for deposition
    await supabase.from('content_audit_log').insert({
      entity_type: 'cover',
      entity_id: trackId,
      user_id: userId || 'system',
      actor_type: 'ai',
      ai_model_used: 'google/gemini-3-pro-image-preview',
      action_type: 'generated',
      action_category: 'generation',
      prompt_used: imagePrompt,
      input_metadata: {
        title,
        style,
        mood,
        project_id: projectId,
        custom_prompt: !!customPrompt,
      },
      output_metadata: {
        cover_url: publicUrl,
        storage_path: coverFileName,
      },
    });

    console.log(`[generate-track-cover] ✅ Audit logged for cover generation`);

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

// ============= VISUAL STYLE GENERATORS =============

// Get randomized visual style based on context
function getRandomizedVisualStyle(genre: string, mood: string, title: string): {
  style: string;
  aesthetic: string;
  moodExpression: string;
  uniqueElement: string;
} {
  const genreLower = genre.toLowerCase();
  const moodLower = mood.toLowerCase();
  
  // Hash title for consistent but varied selection
  const hash = simpleHash(title + genre + mood);
  
  // Visual style variations by genre
  const styleOptions: Record<string, string[][]> = {
    electronic: [
      ['cyberpunk cityscapes with neon rain', 'neo-tokyo aesthetic', 'futuristic skyline reflections'],
      ['abstract data visualization', 'digital particles forming patterns', 'glitch art with geometric shapes'],
      ['holographic surfaces', 'iridescent liquid metal', 'chrome reflections on glass'],
      ['wireframe landscapes', 'vector art environments', 'low-poly crystal formations'],
    ],
    rock: [
      ['dramatic mountain silhouettes at sunset', 'volcanic landscapes with molten lava', 'storm clouds over desert'],
      ['vintage amplifier close-up', 'abstract guitar strings as light rays', 'worn leather texture compositions'],
      ['graffiti-covered urban walls', 'industrial rust and decay', 'street photography noir'],
      ['flames and smoke formations', 'shattered glass effects', 'motion blur energy bursts'],
    ],
    pop: [
      ['candy-colored geometric patterns', 'balloon clusters in gradient sky', 'confetti explosion freeze-frame'],
      ['glossy lips macro detail', 'holographic bubbles floating', 'rainbow light prism effects'],
      ['retro polaroid collage style', 'vaporwave sunset aesthetics', 'neon sign reflections in rain'],
      ['crystal formations in pastel colors', 'kaleidoscope pattern symmetry', 'floating shapes in dreamy space'],
    ],
    hiphop: [
      ['gold chains as abstract art', 'boombox transformed into sculpture', 'crown imagery reimagined'],
      ['street corner night scene', 'basketball court aerial view', 'subway car interiors'],
      ['luxury car reflections', 'jewelry macro photography style', 'diamond textures and facets'],
      ['graffiti wildstyle backgrounds', 'brick wall textures with light', 'urban rooftop sunset scenes'],
    ],
    ambient: [
      ['foggy forest pathways', 'misty mountain valleys', 'aurora borealis over still lake'],
      ['underwater coral dreamscapes', 'cloud formations at golden hour', 'dew drops on spider web'],
      ['zen garden minimalism', 'floating islands in clouds', 'bioluminescent ocean depths'],
      ['snow-covered landscapes at dusk', 'starfield long exposure', 'gentle rain on window glass'],
    ],
    jazz: [
      ['smoky jazz club interiors', 'saxophone silhouette in spotlight', 'vinyl record grooves macro'],
      ['art deco geometric patterns', 'New Orleans wrought iron balconies', 'moonlit riverboat scenes'],
      ['whiskey glass with ice', 'piano keys in dramatic lighting', 'vintage microphone details'],
      ['1920s glamour aesthetic', 'blue note abstract compositions', 'cityscape night reflections'],
    ],
    classical: [
      ['baroque ceiling frescoes', 'marble sculpture details', 'ornate gold frames and flourishes'],
      ['grand concert hall interiors', 'violin scroll close-up', 'sheet music as abstract pattern'],
      ['renaissance garden scenes', 'cathedral stained glass', 'candlelit chamber atmosphere'],
      ['autumn leaves on stone steps', 'misty castle silhouettes', 'vintage botanical illustrations'],
    ],
    default: [
      ['abstract fluid dynamics', 'cosmic nebula formations', 'geometric crystal structures'],
      ['nature macro photography style', 'architectural minimalism', 'light painting effects'],
      ['surrealist floating objects', 'double exposure compositions', 'particle swarm formations'],
      ['gradient mesh backgrounds', 'organic shape compositions', 'textured paper collage style'],
    ],
  };
  
  // Select genre-appropriate styles or default
  let genreStyles = styleOptions.default;
  for (const [key, styles] of Object.entries(styleOptions)) {
    if (genreLower.includes(key) || (key === 'hiphop' && (genreLower.includes('hip-hop') || genreLower.includes('rap')))) {
      genreStyles = styles;
      break;
    }
  }
  
  const styleGroup = genreStyles[hash % genreStyles.length];
  const selectedStyle = styleGroup[hash % styleGroup.length];
  
  // Aesthetic variations
  const aesthetics = [
    'cinematic lighting with deep shadows',
    'dreamlike soft focus atmosphere',
    'high contrast dramatic composition',
    'ethereal glow effects',
    'vintage film grain texture',
    'ultra-modern clean lines',
    'organic flowing forms',
    'sharp geometric precision',
  ];
  
  // Mood expressions
  const moodExpressions = getMoodExpressions(moodLower, hash);
  
  // Unique elements
  const uniqueElements = [
    'Add an unexpected visual twist that creates intrigue',
    'Include subtle symbolic imagery related to the theme',
    'Create depth through layered visual elements',
    'Use negative space strategically for impact',
    'Incorporate reflective or mirrored elements',
    'Add organic textures for tactile quality',
    'Use scale contrast for visual interest',
    'Include motion blur or dynamic movement',
  ];
  
  return {
    style: selectedStyle,
    aesthetic: aesthetics[hash % aesthetics.length],
    moodExpression: moodExpressions,
    uniqueElement: uniqueElements[(hash + 3) % uniqueElements.length],
  };
}

// Get mood-specific expressions
function getMoodExpressions(mood: string, hash: number): string {
  const expressions: Record<string, string[]> = {
    dark: [
      'deep shadows with subtle light sources piercing through',
      'mysterious silhouettes emerging from darkness',
      'moody atmosphere with hidden details in shadows',
      'noir-inspired high contrast with single color accent',
    ],
    energetic: [
      'explosive energy radiating from center',
      'dynamic motion lines suggesting speed and power',
      'vibrant bursts of color in controlled chaos',
      'action freeze-frame with energy particles',
    ],
    romantic: [
      'soft dreamy focus with warm highlights',
      'delicate petal-like textures and curves',
      'intimate close-up perspective with bokeh',
      'sunset golden hour warmth and tenderness',
    ],
    melancholic: [
      'rain-washed surfaces with reflection puddles',
      'autumn leaves in gentle decay',
      'empty spaces suggesting absence and longing',
      'blue hour twilight with distant lights',
    ],
    aggressive: [
      'sharp angular forms with jagged edges',
      'intense red and black color clash',
      'cracked and fractured surfaces',
      'explosive impact moment frozen in time',
    ],
    peaceful: [
      'zen minimalism with breathing room',
      'gentle water ripples and calm surfaces',
      'soft morning light through mist',
      'balanced composition with natural elements',
    ],
    euphoric: [
      'ascending light beams breaking through',
      'celebration of color and movement',
      'uplifting composition reaching skyward',
      'sparkling highlights and joyful energy',
    ],
    mysterious: [
      'fog-shrouded scenes with hidden depths',
      'partially revealed forms creating curiosity',
      'unusual angles and perspective shifts',
      'symbols and patterns with hidden meaning',
    ],
    default: [
      'balanced composition with clear focal point',
      'harmonious color relationships',
      'dynamic yet controlled visual flow',
      'professional polish with artistic edge',
    ],
  };
  
  let selectedExpressions = expressions.default;
  for (const [key, exps] of Object.entries(expressions)) {
    if (mood.includes(key)) {
      selectedExpressions = exps;
      break;
    }
  }
  
  return selectedExpressions[hash % selectedExpressions.length];
}

// Get randomized color palette
function getRandomizedColorPalette(mood: string, genre: string, title: string): {
  colors: string;
  technique: string;
} {
  const hash = simpleHash(title + mood);
  const moodLower = mood.toLowerCase();
  const genreLower = genre.toLowerCase();
  
  // Color palette variations
  const palettes: Record<string, string[]> = {
    dark: [
      'deep midnight blue, charcoal black, and electric purple',
      'blood red, onyx black, and gunmetal gray',
      'forest green so dark it seems black, with silver accents',
      'deep burgundy, espresso brown, and antique gold',
      'ink black, royal purple, and crimson highlights',
    ],
    energetic: [
      'electric orange, hot pink, and acid yellow',
      'neon green, electric blue, and white',
      'coral red, sunshine yellow, and turquoise',
      'magenta, cyan, and lime green',
      'fire orange, cherry red, and golden yellow',
    ],
    romantic: [
      'dusty rose, champagne gold, and soft ivory',
      'blush pink, lavender, and pearl white',
      'coral peach, sunset orange, and cream',
      'mauve, rose gold, and soft gray',
      'terracotta, soft pink, and warm sand',
    ],
    chill: [
      'ocean teal, seafoam green, and sandy beige',
      'powder blue, mint green, and cloud white',
      'sage green, warm gray, and oatmeal',
      'periwinkle, soft lavender, and cream',
      'ice blue, silver, and pale mint',
    ],
    nostalgic: [
      'sepia brown, cream, and vintage gold',
      'faded orange, mustard yellow, and olive',
      'dusty pink, muted teal, and aged paper',
      'burnt sienna, harvest gold, and avocado',
      'rust orange, cream, and chocolate brown',
    ],
    futuristic: [
      'chrome silver, electric blue, and hot pink',
      'iridescent violet, holographic silver, and cyan',
      'neon purple, midnight blue, and laser green',
      'titanium gray, plasma blue, and UV purple',
      'mirror chrome, neon orange, and deep space black',
    ],
    earthy: [
      'terracotta, sage green, and warm sand',
      'forest moss, clay brown, and stone gray',
      'burnt umber, olive green, and ochre',
      'redwood, fern green, and river stone',
      'amber, eucalyptus, and raw linen',
    ],
    ethereal: [
      'opalescent white, soft lilac, and pearl',
      'moonlight silver, mist blue, and aurora green',
      'celestial gold, cosmic purple, and starlight',
      'cloud white, sky blue, and sunset pink',
      'translucent pink, iridescent blue, and diamond white',
    ],
    urban: [
      'concrete gray, graffiti green, and warning yellow',
      'asphalt black, neon sign red, and streetlight amber',
      'subway tile white, rust, and tagger blue',
      'brick red, steel blue, and smog gray',
      'taxi yellow, midnight black, and chrome silver',
    ],
    default: [
      'vibrant purple, electric blue, and sunset orange',
      'deep teal, coral, and golden yellow',
      'indigo, magenta, and mint',
      'sapphire blue, emerald green, and ruby red',
      'violet, turquoise, and amber',
    ],
  };
  
  // Determine palette based on mood/genre
  let selectedPalette = palettes.default;
  
  if (moodLower.includes('dark') || moodLower.includes('moody') || moodLower.includes('mysterious')) {
    selectedPalette = palettes.dark;
  } else if (moodLower.includes('energetic') || moodLower.includes('aggressive') || moodLower.includes('powerful')) {
    selectedPalette = palettes.energetic;
  } else if (moodLower.includes('romantic') || moodLower.includes('love') || moodLower.includes('soft')) {
    selectedPalette = palettes.romantic;
  } else if (moodLower.includes('chill') || moodLower.includes('relax') || moodLower.includes('calm')) {
    selectedPalette = palettes.chill;
  } else if (moodLower.includes('nostalgic') || moodLower.includes('retro') || moodLower.includes('vintage')) {
    selectedPalette = palettes.nostalgic;
  } else if (moodLower.includes('futuristic') || genreLower.includes('electronic') || genreLower.includes('synth')) {
    selectedPalette = palettes.futuristic;
  } else if (moodLower.includes('natural') || moodLower.includes('organic') || genreLower.includes('folk')) {
    selectedPalette = palettes.earthy;
  } else if (moodLower.includes('ethereal') || moodLower.includes('dream') || genreLower.includes('ambient')) {
    selectedPalette = palettes.ethereal;
  } else if (genreLower.includes('hip') || genreLower.includes('rap') || genreLower.includes('urban')) {
    selectedPalette = palettes.urban;
  }
  
  // Color techniques for variety
  const techniques = [
    'smooth gradient transitions',
    'bold color blocking',
    'subtle color overlays',
    'duotone contrast effect',
    'split complementary harmony',
    'analogous color flow',
    'triadic color balance',
    'monochromatic depth variations',
    'vibrant saturation pops on muted base',
    'desaturated tones with single vivid accent',
  ];
  
  return {
    colors: selectedPalette[hash % selectedPalette.length],
    technique: techniques[(hash + 5) % techniques.length],
  };
}

// Get random art style
function getRandomArtStyle(genre: string): string {
  const genreLower = genre.toLowerCase();
  const hash = simpleHash(genre + Date.now().toString().slice(-4));
  
  const artStyles: Record<string, string[]> = {
    electronic: [
      'digital 3D rendering with ray tracing',
      'generative algorithmic art',
      'glitch art with digital artifacts',
      'cyberpunk illustration',
      'vaporwave aesthetic',
      'abstract data visualization',
    ],
    rock: [
      'gritty photorealistic illustration',
      'heavy metal album art style',
      'punk rock collage aesthetic',
      'dark fantasy painting',
      'industrial photography composite',
      'gothic illustration',
    ],
    pop: [
      'vibrant pop art',
      'kawaii cute illustration',
      'glossy magazine photography style',
      'contemporary fashion art',
      'colorful mixed media collage',
      'modern vector illustration',
    ],
    hiphop: [
      'urban street art style',
      'bold graphic design',
      'luxury lifestyle photography',
      'comic book illustration',
      'graffiti wildstyle inspired',
      'high fashion editorial',
    ],
    jazz: [
      'art deco illustration',
      'vintage photography with film grain',
      'watercolor painting',
      'noir photography style',
      'mid-century modern design',
      'expressionist painting',
    ],
    classical: [
      'renaissance oil painting style',
      'baroque dramatic composition',
      'romantic era landscape painting',
      'classical sculpture photography',
      'neoclassical illustration',
      'fine art photography',
    ],
    ambient: [
      'impressionist painting style',
      'ethereal photography',
      'minimalist abstract art',
      'nature macro photography',
      'dreamscape surrealism',
      'soft watercolor wash',
    ],
    default: [
      'modern digital art',
      'contemporary illustration',
      'abstract expressionism',
      'surrealist composition',
      'mixed media artwork',
      'photorealistic rendering',
    ],
  };
  
  let styles = artStyles.default;
  for (const [key, s] of Object.entries(artStyles)) {
    if (genreLower.includes(key) || (key === 'hiphop' && (genreLower.includes('hip-hop') || genreLower.includes('rap')))) {
      styles = s;
      break;
    }
  }
  
  return styles[hash % styles.length];
}

// Get random composition style
function getRandomComposition(): string {
  const compositions = [
    'centered focal point with radial symmetry',
    'rule of thirds with diagonal movement',
    'asymmetric balance with negative space',
    'full bleed edge-to-edge composition',
    'frame within frame layered depth',
    'extreme close-up detail crop',
    'bird\'s eye aerial perspective',
    'worm\'s eye dramatic low angle',
    'spiral golden ratio arrangement',
    'horizontal bands creating rhythm',
    'vertical columns with depth',
    'overlapping elements creating depth',
    'minimalist single subject focus',
    'maximalist detailed composition',
    'split composition with contrast',
  ];
  
  return compositions[Math.floor(Math.random() * compositions.length)];
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

// ============= EXTRACTION HELPERS =============

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
    'trap': 'hard-hitting and modern',
    'house': 'groovy and uplifting',
    'techno': 'hypnotic and driving',
    'indie': 'introspective and authentic',
    'folk': 'warm and organic',
    'country': 'heartfelt and storytelling',
    'reggae': 'laid-back and positive',
    'funk': 'groovy and soulful',
    'blues': 'emotional and raw',
    'punk': 'rebellious and raw',
    'grunge': 'gritty and emotional',
    'soul': 'deep and emotional',
    'gospel': 'uplifting and spiritual',
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
    'stars': 'constellation of stars',
    'небо': 'expansive sky',
    'sky': 'expansive sky',
    'ночь': 'night atmosphere',
    'night': 'night atmosphere',
    'midnight': 'midnight hour',
    'солнц': 'bright sunlight',
    'sun': 'bright sunlight',
    'sunrise': 'dawn breaking',
    'sunset': 'golden sunset',
    'огонь': 'flames and fire',
    'fire': 'flames and fire',
    'flame': 'dancing flames',
    'burn': 'burning embers',
    'вод': 'water elements',
    'water': 'water elements',
    'ocean': 'ocean waves',
    'океан': 'ocean waves',
    'море': 'sea horizon',
    'sea': 'sea horizon',
    'wave': 'rolling waves',
    'город': 'urban cityscape',
    'city': 'urban cityscape',
    'street': 'city streets',
    'дожд': 'rain drops',
    'rain': 'rain drops',
    'storm': 'stormy weather',
    'любов': 'romantic hearts',
    'love': 'romantic hearts',
    'сердц': 'heart shapes',
    'heart': 'heart shapes',
    'свет': 'rays of light',
    'light': 'rays of light',
    'shine': 'shining light',
    'glow': 'ethereal glow',
    'тьма': 'shadows and darkness',
    'dark': 'shadows and darkness',
    'shadow': 'mysterious shadows',
    'космос': 'cosmic space',
    'space': 'cosmic space',
    'galaxy': 'spiral galaxy',
    'universe': 'vast universe',
    'лес': 'forest landscape',
    'forest': 'forest landscape',
    'tree': 'ancient trees',
    'горы': 'mountain peaks',
    'mountain': 'mountain peaks',
    'cloud': 'floating clouds',
    'dream': 'dreamlike atmosphere',
    'fly': 'soaring flight',
    'wings': 'angelic wings',
    'moon': 'moonlit night',
    'луна': 'moonlit night',
    'diamond': 'sparkling diamonds',
    'gold': 'golden elements',
    'silver': 'silver accents',
    'crystal': 'crystal formations',
    'ice': 'icy landscapes',
    'snow': 'snowy scenes',
    'flower': 'blooming flowers',
    'rose': 'red roses',
    'blood': 'crimson blood',
    'tear': 'falling tears',
    'angel': 'angelic figures',
    'devil': 'devilish imagery',
    'demon': 'demonic presence',
    'heaven': 'heavenly clouds',
    'hell': 'infernal flames',
    'ghost': 'ghostly apparitions',
    'mirror': 'reflective surfaces',
    'glass': 'shattered glass',
    'smoke': 'rising smoke',
    'dust': 'floating dust particles',
    'wind': 'wind movement',
    'thunder': 'lightning and thunder',
    'lightning': 'electric lightning',
  };
  
  const lyricsLower = lyrics.toLowerCase();
  const themes: string[] = [];
  
  for (const [keyword, theme] of Object.entries(visualKeywords)) {
    if (lyricsLower.includes(keyword) && !themes.includes(theme)) {
      themes.push(theme);
      if (themes.length >= 4) break;
    }
  }
  
  return themes.join(', ');
}
