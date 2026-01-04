/**
 * Unified Image Generation Function
 * 
 * Consolidates all image generation:
 * - Project covers (generate-cover-image)
 * - Profile avatars/banners (generate-profile-image)
 * - Artist portraits (generate-artist-portrait)
 * - Blog covers (generate-blog-cover)
 * - Playlist covers (generate-playlist-cover)
 * - Track covers (generate-track-cover)
 * 
 * Uses Lovable AI (Gemini 3 Pro Image) for generation.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ImageType = 
  | 'project_cover'
  | 'track_cover' 
  | 'profile_avatar'
  | 'profile_banner'
  | 'artist_portrait'
  | 'blog_cover'
  | 'playlist_cover';

interface ImageConfig {
  storageBucket: string;
  aspectRatio: string;
  dimensions: string;
  basePrompt: (context: any) => string;
  updateTable?: string;
  updateColumn?: string;
  updateIdColumn?: string;
}

const IMAGE_CONFIGS: Record<ImageType, ImageConfig> = {
  project_cover: {
    storageBucket: 'project-assets',
    aspectRatio: '1:1 square',
    dimensions: '1024x1024',
    basePrompt: (ctx) => `Create a professional music album cover. ${ctx.prompt || ''}. Style: ${ctx.genre || 'modern'}, mood: ${ctx.mood || 'dynamic'}. High quality, artistic, suitable for streaming platforms.`,
    updateTable: 'music_projects',
    updateColumn: 'cover_url',
    updateIdColumn: 'id',
  },
  track_cover: {
    storageBucket: 'track-assets',
    aspectRatio: '1:1 square',
    dimensions: '1024x1024',
    basePrompt: (ctx) => `Create a stunning single/track cover art. ${ctx.prompt || ''}. Title: "${ctx.title || 'Untitled'}". Style: ${ctx.style || 'modern electronic'}. Vibrant, eye-catching, professional quality.`,
    updateTable: 'tracks',
    updateColumn: 'cover_url',
    updateIdColumn: 'id',
  },
  profile_avatar: {
    storageBucket: 'avatars',
    aspectRatio: '1:1 square',
    dimensions: '512x512',
    basePrompt: (ctx) => `Create an artistic avatar for a music producer${ctx.displayName ? ` named "${ctx.displayName}"` : ''}. ${ctx.bio ? `About: ${ctx.bio}. ` : ''}${ctx.genres?.length ? `Genres: ${ctx.genres.join(', ')}. ` : ''}Modern, creative, vibrant colors. NO text, NO watermarks.`,
  },
  profile_banner: {
    storageBucket: 'avatars',
    aspectRatio: '3:1 wide',
    dimensions: '1200x400',
    basePrompt: (ctx) => `Create a stunning profile banner for a music artist${ctx.displayName ? ` named "${ctx.displayName}"` : ''}. ${ctx.bio ? `About: ${ctx.bio}. ` : ''}Atmospheric, cinematic, futuristic. NO text, NO watermarks.`,
  },
  artist_portrait: {
    storageBucket: 'avatars',
    aspectRatio: '1:1 square',
    dimensions: '512x512',
    basePrompt: (ctx) => `Create an artistic portrait/avatar for AI music artist "${ctx.name || 'Artist'}". ${ctx.style_description ? `Style: ${ctx.style_description}. ` : ''}${ctx.genre_tags?.length ? `Genres: ${ctx.genre_tags.join(', ')}. ` : ''}Creative, unique, memorable. NO text.`,
    updateTable: 'artists',
    updateColumn: 'avatar_url',
    updateIdColumn: 'id',
  },
  blog_cover: {
    storageBucket: 'blog-assets',
    aspectRatio: '16:9 wide',
    dimensions: '1920x1080',
    basePrompt: (ctx) => `Create a professional blog post cover image. Topic: "${ctx.title || 'Music'}". ${ctx.prompt || ''}. Modern, clean, editorial style. NO text overlay.`,
    updateTable: 'blog_posts',
    updateColumn: 'cover_url',
    updateIdColumn: 'id',
  },
  playlist_cover: {
    storageBucket: 'playlist-assets',
    aspectRatio: '1:1 square',
    dimensions: '640x640',
    basePrompt: (ctx) => `Create a visually striking playlist cover. Playlist: "${ctx.title || 'My Playlist'}". ${ctx.description ? `Theme: ${ctx.description}. ` : ''}${ctx.genres?.length ? `Genres: ${ctx.genres.join(', ')}. ` : ''}Colorful, modern, music-themed.`,
    updateTable: 'playlists',
    updateColumn: 'cover_url',
    updateIdColumn: 'id',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
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

    const body = await req.json();
    const { 
      type,
      entityId, // ID of entity to update (project, track, artist, etc.)
      prompt,
      // Context fields for prompt building
      title,
      name,
      displayName,
      bio,
      description,
      genre,
      genres,
      genre_tags,
      mood,
      style,
      style_description,
    } = body;

    // Validate type
    if (!type || !IMAGE_CONFIGS[type as ImageType]) {
      throw new Error(`Invalid image type: ${type}. Valid types: ${Object.keys(IMAGE_CONFIGS).join(', ')}`);
    }

    const config = IMAGE_CONFIGS[type as ImageType];
    
    console.log(`[generate-image] Type: ${type}, User: ${user.id}, Entity: ${entityId || 'none'}`);

    // Build the prompt
    const context = { prompt, title, name, displayName, bio, description, genre, genres, genre_tags, mood, style, style_description };
    const finalPrompt = prompt 
      ? `${prompt}. ${config.aspectRatio} aspect ratio. NO text, NO watermarks. High quality digital art.`
      : config.basePrompt(context) + ` ${config.aspectRatio} aspect ratio.`;

    console.log(`[generate-image] Prompt: ${finalPrompt.substring(0, 150)}...`);

    // Generate image using Lovable AI
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
            content: finalPrompt,
          },
        ],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-image] Lovable AI error:', errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[generate-image] AI response received');

    // Extract image URL from response
    let imageUrl: string | null = null;

    if (data.choices?.[0]?.message?.images?.[0]) {
      imageUrl = data.choices[0].message.images[0].image_url?.url || data.choices[0].message.images[0].url;
    } else {
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.includes('data:image')) {
        imageUrl = content.match(/data:image\/[^;]+;base64,[^\s"]+/)?.[0] || null;
      }
    }

    if (!imageUrl) {
      console.error('[generate-image] No image URL in response');
      throw new Error('No image generated');
    }

    // Upload to Supabase Storage
    const base64Data = imageUrl.split(',')[1];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileExt = 'png';
    const fileName = entityId 
      ? `${user.id}/${type}/${entityId}_${Date.now()}.${fileExt}`
      : `${user.id}/${type}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(config.storageBucket)
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[generate-image] Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(config.storageBucket)
      .getPublicUrl(fileName);

    console.log(`[generate-image] Uploaded: ${publicUrl}`);

    // Update entity if configured
    if (config.updateTable && config.updateColumn && entityId) {
      const { error: updateError } = await supabase
        .from(config.updateTable)
        .update({ [config.updateColumn]: publicUrl })
        .eq(config.updateIdColumn || 'id', entityId);

      if (updateError) {
        console.error(`[generate-image] Update ${config.updateTable} error:`, updateError);
        // Don't throw - we still have the URL
      } else {
        console.log(`[generate-image] Updated ${config.updateTable}.${config.updateColumn}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        type,
        entityId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[generate-image] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
