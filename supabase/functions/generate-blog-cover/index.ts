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

    const { title, excerpt, content, blogPostId } = await req.json();

    if (!title) {
      throw new Error('title is required');
    }

    console.log(`🖼️ Generating blog cover for: ${title}`);

    // Extract key themes from content
    const contentPreview = content ? content.substring(0, 500).replace(/[#*_\[\]]/g, '') : '';
    const themeHint = excerpt || contentPreview.substring(0, 200);

    const imagePrompt = `Create a professional blog article cover image.

Article Title: "${title}"
${themeHint ? `Article Theme: ${themeHint}` : ''}

Design requirements:
- Modern, clean professional blog header image
- Wide format (16:9 aspect ratio)
- Abstract or conceptual visualization related to music production, AI, and technology
- Futuristic aesthetic with deep colors (purples, blues, cyans, magentas)
- Subtle gradients and geometric elements
- NO text, NO watermarks, NO logos, NO words
- Professional quality suitable for tech blog
- Clean, uncluttered composition
- Suitable as article header banner

Style: Modern tech blog, professional, abstract digital art`;

    console.log('🎨 Generating cover with Lovable AI...');

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
      console.error('❌ No image in response');
      throw new Error('No image generated');
    }

    console.log('✅ Cover generated, uploading to storage...');

    // Convert base64 to blob
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const coverFileName = `blog-covers/${blogPostId || 'preview'}_${Date.now()}.png`;
    
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
    console.log(`✅ Blog cover uploaded: ${publicUrl}`);

    // Update blog post if ID provided
    if (blogPostId) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ cover_url: publicUrl })
        .eq('id', blogPostId);

      if (updateError) {
        console.error('❌ Blog update error:', updateError);
      } else {
        console.log('✅ Blog post cover updated');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        coverUrl: publicUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error generating blog cover:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Cover generation failed',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
