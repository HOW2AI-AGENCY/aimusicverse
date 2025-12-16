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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { type, prompt, displayName, bio, genres } = await req.json();

    if (!type || !['avatar', 'banner'].includes(type)) {
      throw new Error('Type must be "avatar" or "banner"');
    }

    console.log(`Generating ${type} for user: ${user.id}`);

    // Build context-aware prompt
    let basePrompt = '';
    let aspectRatio = '';
    let dimensions = '';

    if (type === 'avatar') {
      aspectRatio = '1:1 square aspect ratio';
      dimensions = '512x512';
      basePrompt = prompt || `Create a professional, artistic avatar/profile picture for a music producer/artist${displayName ? ` named "${displayName}"` : ''}. ${bio ? `About them: ${bio}. ` : ''}${genres?.length ? `Music genres: ${genres.join(', ')}. ` : ''}Style: modern, creative, suitable for music streaming platform. Abstract or artistic representation, vibrant colors, professional quality. NO text, NO watermarks. ${aspectRatio}.`;
    } else {
      aspectRatio = '3:1 wide banner aspect ratio (1200x400 pixels)';
      dimensions = '1200x400';
      basePrompt = prompt || `Create a stunning, professional banner/header image for a music producer/artist profile${displayName ? ` named "${displayName}"` : ''}. ${bio ? `About them: ${bio}. ` : ''}${genres?.length ? `Music genres: ${genres.join(', ')}. ` : ''}Style: modern, atmospheric, cinematic. Abstract visualization of music and creativity. Deep vibrant colors, futuristic design. Perfect for social media/streaming platform header. NO text, NO watermarks, NO logos. ${aspectRatio}.`;
    }

    const imagePrompt = prompt ? `${prompt}. ${aspectRatio}. NO text, NO watermarks. High quality digital art.` : basePrompt;

    console.log(`Prompt: ${imagePrompt.substring(0, 200)}...`);

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
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response received');

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
      console.error('No image URL found in response');
      throw new Error('No image generated');
    }

    // Upload the base64 image to Supabase Storage
    const base64Data = imageUrl.split(',')[1];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `${type}_${user.id}_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image to storage');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    console.log(`${type} generated and uploaded: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-profile-image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
