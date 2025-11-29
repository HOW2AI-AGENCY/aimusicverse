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

    const { projectId, prompt, title, genre, mood } = await req.json();

    if (!prompt || !projectId) {
      throw new Error('Prompt and projectId are required');
    }

    console.log(`Generating cover image for user: ${user.id}`);

    // Generate image using Lovable AI (Gemini 2.5 Flash Image)
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Create a professional music album cover image. ${prompt}. Style: ${genre || 'modern'}, mood: ${mood || 'dynamic'}. High quality, artistic, suitable for music streaming platforms.`,
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
    console.log('AI Response:', JSON.stringify(data, null, 2));
    
    // Extract image URL from response
    const content = data.choices?.[0]?.message?.content;
    let imageUrl: string | null = null;

    if (typeof content === 'string') {
      // Check if content contains base64 image
      if (content.includes('data:image')) {
        imageUrl = content.match(/data:image\/[^;]+;base64,[^\s"]+/)?.[0] || null;
      }
    } else if (data.choices?.[0]?.message?.images?.[0]) {
      imageUrl = data.choices[0].message.images[0].image_url?.url || data.choices[0].message.images[0].url;
    }

    if (!imageUrl) {
      console.error('No image URL found in response');
      throw new Error('No image generated');
    }

    // Upload the base64 image to Supabase Storage
    const base64Data = imageUrl.split(',')[1];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `${user.id}/covers/${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // If upload fails, return error (don't use base64 fallback for projects)
      throw new Error('Failed to upload cover image to storage');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);

    // Update project cover_url in database
    const { error: updateError } = await supabase
      .from('music_projects')
      .update({ cover_url: publicUrl })
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project cover:', updateError);
      // Continue anyway, return the URL
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        coverUrl: publicUrl,
        isBase64: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-cover-image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
