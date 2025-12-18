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

    const { artistName, styleDescription, artistId } = await req.json();

    if (!artistName) {
      throw new Error('artistName is required');
    }

    console.log(`Generating portrait for artist: ${artistName}, user: ${user.id}`);

    const imagePrompt = `Professional studio portrait photograph of a music artist named "${artistName}". ${styleDescription ? `Style: ${styleDescription}.` : ''} High-end fashion photography, dramatic cinematic lighting, sharp focus on face, professional headshot, 8k quality, artistic composition, music industry aesthetic.`;

    // Use the correct Gemini image generation model
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
    console.log('AI Response structure:', Object.keys(data));
    
    // Extract image from response
    let imageUrl: string | null = null;

    // Check various response formats
    if (data.choices?.[0]?.message?.images?.[0]) {
      const img = data.choices[0].message.images[0];
      imageUrl = img.image_url?.url || img.url || img.b64_json;
      if (img.b64_json && !imageUrl?.startsWith('data:')) {
        imageUrl = `data:image/png;base64,${img.b64_json}`;
      }
    } else if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      if (typeof content === 'string' && content.includes('data:image')) {
        imageUrl = content.match(/data:image\/[^;]+;base64,[^\s"]+/)?.[0] || null;
      }
    }

    if (!imageUrl) {
      console.error('No image found in response:', JSON.stringify(data, null, 2));
      throw new Error('No image generated');
    }

    // Upload to storage if base64
    let publicUrl = imageUrl;
    
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const fileName = `${user.id}/portraits/${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload portrait to storage');
      }

      const { data: urlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);
      
      publicUrl = urlData.publicUrl;
    }

    // Update artist if artistId provided
    if (artistId) {
      const { error: updateError } = await supabase
        .from('artists')
        .update({ avatar_url: publicUrl })
        .eq('id', artistId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating artist:', updateError);
      }

      // Log to content_audit_log for deposition
      await supabase.from('content_audit_log').insert({
        entity_type: 'artist',
        entity_id: artistId,
        user_id: user.id,
        actor_type: 'ai',
        ai_model_used: 'google/gemini-3-pro-image-preview',
        action_type: 'portrait_generated',
        action_category: 'generation',
        prompt_used: imagePrompt,
        input_metadata: {
          artist_name: artistName,
          style_description: styleDescription,
        },
        output_metadata: {
          avatar_url: publicUrl,
        },
      });

      console.log(`[generate-artist-portrait] Audit logged for portrait generation`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        avatarUrl: publicUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-artist-portrait:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
