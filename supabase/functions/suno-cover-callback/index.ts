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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Received cover callback from SunoAPI:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    const { task_id, taskId, data: coverData } = data || {};
    const sunoTaskId = taskId || task_id;

    if (!sunoTaskId) {
      throw new Error('No taskId in callback');
    }

    if (code !== 200) {
      console.error('Cover generation failed:', msg);
      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const coverInfo = coverData?.[0];
    if (!coverInfo?.imageUrl) {
      throw new Error('No cover image URL in callback data');
    }

    console.log('Cover generation completed, URL:', coverInfo.imageUrl);

    // Download cover image
    const coverResponse = await fetch(coverInfo.imageUrl);
    const coverBlob = await coverResponse.blob();
    const fileName = `covers/${sunoTaskId}_${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(fileName, coverBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from('project-assets')
      .getPublicUrl(fileName);

    const localCoverUrl = publicData.publicUrl;

    console.log('✅ Cover image saved:', localCoverUrl);

    // Find and update tracks with this task ID
    const { data: tracks, error: findError } = await supabase
      .from('tracks')
      .select('id, user_id')
      .eq('suno_task_id', sunoTaskId);

    if (findError) {
      console.error('❌ Error finding tracks:', findError);
    }

    if (tracks && tracks.length > 0) {
      console.log(`📦 Found ${tracks.length} track(s) with task ID ${sunoTaskId}`);
      
      // Update tracks with cover
      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          cover_url: localCoverUrl,
          local_cover_url: localCoverUrl,
        })
        .eq('suno_task_id', sunoTaskId);

      if (updateError) {
        console.error('❌ Error updating tracks:', updateError);
      } else {
        console.log('✅ Track cover(s) updated successfully');
      }

      // Update ALL versions with the same cover
      for (const track of tracks) {
        const { error: versionsUpdateError } = await supabase
          .from('track_versions')
          .update({
            cover_url: localCoverUrl,
          })
          .eq('track_id', track.id);

        if (versionsUpdateError) {
          console.error('❌ Versions update error:', versionsUpdateError);
        } else {
          console.log(`✅ All versions for track ${track.id} updated with cover`);
        }

        // Create notification for each user
        await supabase
          .from('notifications')
          .insert({
            user_id: track.user_id,
            type: 'track_generated',
            title: 'Обложка готова 🎨',
            message: 'Новая обложка для вашего трека успешно создана',
            action_url: localCoverUrl,
          });
      }
    } else {
      console.warn('⚠️ No tracks found with task ID:', sunoTaskId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        coverUrl: localCoverUrl,
        tracksUpdated: tracks?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in suno-cover-callback:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
