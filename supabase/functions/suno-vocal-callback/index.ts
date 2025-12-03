import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map stem types from API to our database format
const STEM_TYPE_MAP: Record<string, string> = {
  vocal_url: 'vocal',
  instrumental_url: 'instrumental',
  vocals_url: 'vocal',
  backing_vocals_url: 'backing_vocals',
  drums_url: 'drums',
  bass_url: 'bass',
  guitar_url: 'guitar',
  keyboard_url: 'keyboard',
  strings_url: 'strings',
  brass_url: 'brass',
  woodwinds_url: 'woodwinds',
  percussion_url: 'percussion',
  synth_url: 'synth',
  fx_url: 'fx',
  other_url: 'other',
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
    console.log('🎛️ Received vocal separation callback:', JSON.stringify(payload, null, 2));

    const { code, msg, data } = payload;
    
    // Get taskId from callback - this is the SEPARATION task ID, not the original track task
    const separationTaskId = data?.taskId || data?.task_id;
    
    if (!separationTaskId) {
      console.error('❌ Missing separationTaskId in callback:', data);
      throw new Error('Missing taskId in callback');
    }

    console.log('🔍 Looking up separation task:', separationTaskId);

    // Find track via stem_separation_tasks table
    const { data: separationTask, error: taskError } = await supabase
      .from('stem_separation_tasks')
      .select('*, tracks(*)')
      .eq('separation_task_id', separationTaskId)
      .single();

    if (taskError || !separationTask) {
      console.error('❌ Separation task not found:', taskError);
      throw new Error(`Separation task not found: ${separationTaskId}`);
    }

    const track = separationTask.tracks;
    if (!track) {
      throw new Error('Associated track not found');
    }

    console.log('✅ Found track:', track.id, 'for separation task:', separationTaskId);

    // Handle failure
    if (code !== 200) {
      console.error('❌ Vocal separation failed:', msg);
      
      await supabase
        .from('stem_separation_tasks')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', separationTask.id);

      await supabase.from('track_change_log').insert({
        track_id: track.id,
        user_id: track.user_id,
        change_type: 'vocal_separation_failed',
        changed_by: 'suno_api',
        metadata: { error: msg, separation_task_id: separationTaskId },
      });

      return new Response(
        JSON.stringify({ success: true, status: 'failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FIXED: Parse vocal_removal_info correctly from Suno API response
    // The structure is: data.vocal_removal_info.{vocal_url, instrumental_url, ...}
    const vocalRemovalInfo = data?.vocal_removal_info || data;
    
    console.log('📦 Parsing vocal_removal_info:', JSON.stringify(vocalRemovalInfo, null, 2));

    const stemsToInsert: Array<{
      track_id: string;
      stem_type: string;
      audio_url: string;
      separation_mode: string;
    }> = [];

    // Process all stem URLs from the response
    for (const [key, stemType] of Object.entries(STEM_TYPE_MAP)) {
      const url = vocalRemovalInfo?.[key];
      if (url && typeof url === 'string') {
        console.log(`🎵 Found stem: ${stemType} -> ${url.substring(0, 50)}...`);
        
        // Download and save to storage
        let localUrl = url;
        try {
          const response = await fetch(url);
          if (response.ok) {
            const blob = await response.blob();
            const fileName = `${track.id}_${stemType}_${Date.now()}.mp3`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('project-assets')
              .upload(`stems/${fileName}`, blob, {
                contentType: 'audio/mpeg',
                upsert: true,
              });

            if (!uploadError && uploadData) {
              const { data: publicData } = supabase.storage
                .from('project-assets')
                .getPublicUrl(`stems/${fileName}`);
              localUrl = publicData.publicUrl;
              console.log(`✅ Uploaded ${stemType} to storage:`, localUrl.substring(0, 50));
            }
          }
        } catch (downloadError) {
          console.error(`⚠️ Error downloading ${stemType}:`, downloadError);
          // Use original URL as fallback
        }

        stemsToInsert.push({
          track_id: track.id,
          stem_type: stemType,
          audio_url: localUrl,
          separation_mode: separationTask.mode,
        });
      }
    }

    console.log(`📝 Inserting ${stemsToInsert.length} stems to database`);

    if (stemsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('track_stems')
        .insert(stemsToInsert);

      if (insertError) {
        console.error('❌ Error inserting stems:', insertError);
      } else {
        console.log('✅ Stems inserted successfully');
      }

      // Update track has_stems flag
      await supabase
        .from('tracks')
        .update({ has_stems: true })
        .eq('id', track.id);
    }

    // Update separation task status
    await supabase
      .from('stem_separation_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', separationTask.id);

    // Log completion
    await supabase.from('track_change_log').insert({
      track_id: track.id,
      user_id: track.user_id,
      change_type: 'vocal_separation_completed',
      changed_by: 'suno_api',
      metadata: { 
        stems_created: stemsToInsert.length,
        stem_types: stemsToInsert.map(s => s.stem_type),
        separation_task_id: separationTaskId,
      },
    });

    // Create notification
    await supabase.from('notifications').insert({
      user_id: track.user_id,
      type: 'stems_ready',
      title: 'Стемы готовы! 🎛️',
      message: `Разделение трека "${track.title || 'Без названия'}" завершено. Создано ${stemsToInsert.length} стемов.`,
      action_url: `/studio/${track.id}`,
    });

    return new Response(
      JSON.stringify({ success: true, stems_created: stemsToInsert.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error in suno-vocal-callback:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
