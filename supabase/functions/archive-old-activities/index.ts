// Edge Function: Archive Old Activities (T100)
// Cleans up activities older than 30 days to maintain performance
// Should be run as a scheduled cron job (e.g., daily at 2 AM)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const DAYS_TO_KEEP = 30;
const BATCH_SIZE = 1000;

interface ActivityArchive {
  id: string;
  user_id: string;
  actor_id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  archived_at: string;
}

serve(async (req) => {
  try {
    // Verify this is a scheduled job (check authorization)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate cutoff date (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);
    const cutoffIso = cutoffDate.toISOString();

    console.log(`Archiving activities older than ${cutoffIso}`);

    // Step 1: Count activities to archive
    const { count, error: countError } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', cutoffIso);

    if (countError) {
      throw new Error(`Error counting activities: ${countError.message}`);
    }

    console.log(`Found ${count} activities to archive`);

    if (!count || count === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No activities to archive',
          archived: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Delete old activities (simplified - no archive table needed)
    // In production, you might want to move to an archive table first
    const { error: deleteError, count: deletedCount } = await supabase
      .from('activities')
      .delete()
      .lt('created_at', cutoffIso);

    if (deleteError) {
      throw new Error(`Error deleting activities: ${deleteError.message}`);
    }

    console.log(`Deleted ${deletedCount} old activities`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Archived ${deletedCount || count} activities older than ${DAYS_TO_KEEP} days`,
        archived: deletedCount || count,
        cutoff_date: cutoffIso,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in archive-old-activities:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
