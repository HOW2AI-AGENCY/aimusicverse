import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const callbackData = await req.json();
    
    console.log('Lyrics callback received:', callbackData);

    const { taskId, status, data: lyricsData } = callbackData;

    if (status === 'complete' && lyricsData) {
      // Find the generation task
      const { data: tasks } = await supabase
        .from('generation_tasks')
        .select('*')
        .eq('prompt', lyricsData.prompt)
        .eq('source', 'lyrics_generation')
        .order('created_at', { ascending: false })
        .limit(1);

      if (tasks && tasks.length > 0) {
        const task = tasks[0];

        // Update track with generated lyrics
        if (task.track_id) {
          await supabase
            .from('tracks')
            .update({ 
              lyrics: lyricsData.text,
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.track_id);
        }

        // Update generation task status
        await supabase
          .from('generation_tasks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: task.user_id,
            type: 'lyrics_generated',
            title: 'Лирика сгенерирована',
            message: 'Текст песни успешно создан',
            action_url: task.track_id ? `/library?track=${task.track_id}` : undefined,
          });
      }
    } else if (status === 'failed') {
      // Update task as failed
      const { data: tasks } = await supabase
        .from('generation_tasks')
        .select('*')
        .eq('source', 'lyrics_generation')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (tasks && tasks.length > 0) {
        await supabase
          .from('generation_tasks')
          .update({
            status: 'failed',
            error_message: 'Lyrics generation failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', tasks[0].id);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in lyrics-callback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
