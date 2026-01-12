import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { isSunoSuccessCode } from '../_shared/suno.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    const payload = await req.json();
    console.log('Received cover callback from SunoAPI:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    const { task_id, taskId, data: coverData } = data || {};
    const sunoTaskId = taskId || task_id;

    if (!sunoTaskId) {
      throw new Error('No taskId in callback');
    }

    if (!isSunoSuccessCode(code)) {
      console.error('Cover generation failed:', msg);
      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle various response formats from SunoAPI
    const coverInfo = coverData?.[0] || coverData;
    const imageUrl = coverInfo?.imageUrl || coverInfo?.image_url || coverInfo?.url;
    
    if (!imageUrl) {
      console.error('❌ No cover image URL in callback data:', JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'No image URL in callback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Cover generation completed, URL:', imageUrl);

    // Download cover image
    const coverResponse = await fetch(imageUrl);
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

      // Update ALL versions with the same cover (bulk update using IN clause)
      const trackIds = tracks.map(t => t.id);
      const { error: versionsUpdateError } = await supabase
        .from('track_versions')
        .update({
          cover_url: localCoverUrl,
        })
        .in('track_id', trackIds);

      if (versionsUpdateError) {
        console.error('❌ Versions update error:', versionsUpdateError);
      } else {
        console.log(`✅ All versions for ${tracks.length} track(s) updated with cover`);
      }

      // Create notifications for all users (bulk insert)
      const notifications = tracks.map(track => ({
        user_id: track.user_id,
        type: 'track_generated',
        title: 'Обложка готова 🎨',
        message: 'Новая обложка для вашего трека успешно создана',
        action_url: localCoverUrl,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('❌ Notifications error:', notifError);
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
