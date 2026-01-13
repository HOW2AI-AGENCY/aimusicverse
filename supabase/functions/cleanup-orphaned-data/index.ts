import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';

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
    const supabase = getSupabaseClient();

    console.log('🧹 Starting cleanup of orphaned data...');
    
    const results = {
      failedTasks: 0,
      failedTracks: 0,
      staleTasks: 0,
      orphanedVersions: 0,
      staleRateLimits: 0,
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

    // 3. Use database function to cleanup stuck tasks with proper timeouts
    // This handles: pending/processing > 1 hour, streaming_ready > 30 minutes
    const { data: stuckCleanup, error: stuckError } = await supabase
      .rpc('cleanup_stuck_generation_tasks');
    
    if (stuckError) {
      console.error('❌ Error cleaning stuck tasks:', stuckError);
      // Fallback to original logic if RPC fails
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data: staleTasks } = await supabase
        .from('generation_tasks')
        .update({ 
          status: 'failed', 
          error_message: 'Task timed out (fallback cleanup)',
          completed_at: new Date().toISOString()
        })
        .in('status', ['pending', 'processing', 'streaming_ready'])
        .lt('created_at', oneHourAgo.toISOString())
        .select('id, track_id');
      
      results.staleTasks = staleTasks?.length || 0;
      
      // Update corresponding tracks
      if (staleTasks && staleTasks.length > 0) {
        const trackIds = staleTasks.map(t => t.track_id).filter(Boolean);
        if (trackIds.length > 0) {
          await supabase
            .from('tracks')
            .update({ status: 'failed', error_message: 'Generation timed out' })
            .in('id', trackIds)
            .not('status', 'eq', 'completed');
        }
      }
    } else if (stuckCleanup && stuckCleanup.length > 0) {
      results.staleTasks = stuckCleanup[0].tasks_failed || 0;
      console.log(`✅ Cleaned up ${results.staleTasks} stuck tasks, ${stuckCleanup[0].tracks_failed || 0} tracks`);
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

    // 6. Cleanup stale rate limits
    const { data: rateLimitCleanup, error: rateLimitError } = await supabase
      .rpc('cleanup_telegram_rate_limits');
    
    if (rateLimitError) {
      console.error('❌ Error cleaning rate limits:', rateLimitError);
    } else {
      results.staleRateLimits = rateLimitCleanup || 0;
      if (results.staleRateLimits > 0) {
        console.log(`✅ Cleaned up ${results.staleRateLimits} stale rate limit entries`);
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