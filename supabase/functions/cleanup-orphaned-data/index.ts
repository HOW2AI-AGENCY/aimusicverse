import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Cleanup orphaned data:
 * - Failed generation tasks older than 7 days
 * - Failed tracks without audio older than 7 days  
 * - Orphaned track versions without parent track
 * - Stale pending tasks older than 24 hours
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting cleanup of orphaned data...');
    
    const results = {
      failedTasks: 0,
      failedTracks: 0,
      staleTasks: 0,
      orphanedVersions: 0,
    };

    // 1. Delete failed generation tasks older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: deletedTasks, error: tasksError } = await supabase
      .from('generation_tasks')
      .delete()
      .eq('status', 'failed')
      .lt('created_at', sevenDaysAgo.toISOString())
      .select('id');
    
    if (tasksError) {
      console.error('❌ Error deleting failed tasks:', tasksError);
    } else {
      results.failedTasks = deletedTasks?.length || 0;
      console.log(`✅ Deleted ${results.failedTasks} failed generation tasks`);
    }

    // 2. Delete failed tracks without audio older than 7 days
    const { data: deletedTracks, error: tracksError } = await supabase
      .from('tracks')
      .delete()
      .eq('status', 'failed')
      .is('audio_url', null)
      .lt('created_at', sevenDaysAgo.toISOString())
      .select('id');
    
    if (tracksError) {
      console.error('❌ Error deleting failed tracks:', tracksError);
    } else {
      results.failedTracks = deletedTracks?.length || 0;
      console.log(`✅ Deleted ${results.failedTracks} failed tracks without audio`);
    }

    // 3. Mark stale pending tasks as failed (older than 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const { data: staleTasks, error: staleError } = await supabase
      .from('generation_tasks')
      .update({ 
        status: 'failed', 
        error_message: 'Task timed out after 24 hours' 
      })
      .eq('status', 'pending')
      .lt('created_at', twentyFourHoursAgo.toISOString())
      .select('id');
    
    if (staleError) {
      console.error('❌ Error updating stale tasks:', staleError);
    } else {
      results.staleTasks = staleTasks?.length || 0;
      console.log(`✅ Marked ${results.staleTasks} stale pending tasks as failed`);
    }

    // 4. Also update corresponding tracks to failed status
    if (staleTasks && staleTasks.length > 0) {
      const staleTaskIds = staleTasks.map(t => t.id);
      
      const { error: staleTracksError } = await supabase
        .from('tracks')
        .update({ 
          status: 'failed', 
          error_message: 'Generation timed out' 
        })
        .in('id', staleTaskIds);
      
      if (staleTracksError) {
        console.error('❌ Error updating stale tracks:', staleTracksError);
      }
    }

    // 5. Delete orphaned track versions (where track no longer exists)
    const { data: allVersions } = await supabase
      .from('track_versions')
      .select('id, track_id');
    
    if (allVersions && allVersions.length > 0) {
      const trackIds = [...new Set(allVersions.map(v => v.track_id))];
      
      const { data: existingTracks } = await supabase
        .from('tracks')
        .select('id')
        .in('id', trackIds);
      
      const existingTrackIds = new Set(existingTracks?.map(t => t.id) || []);
      const orphanedVersionIds = allVersions
        .filter(v => !existingTrackIds.has(v.track_id))
        .map(v => v.id);
      
      if (orphanedVersionIds.length > 0) {
        const { error: orphanError } = await supabase
          .from('track_versions')
          .delete()
          .in('id', orphanedVersionIds);
        
        if (orphanError) {
          console.error('❌ Error deleting orphaned versions:', orphanError);
        } else {
          results.orphanedVersions = orphanedVersionIds.length;
          console.log(`✅ Deleted ${results.orphanedVersions} orphaned track versions`);
        }
      }
    }

    const totalCleaned = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`🧹 Cleanup complete. Total items processed: ${totalCleaned}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        totalCleaned,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cleanup error:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});