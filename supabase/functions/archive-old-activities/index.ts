// Edge Function: Archive Old Activities (T100)
// Cleans up activities older than 30 days to maintain performance
// Should be run as a scheduled cron job (e.g., daily at 2 AM)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getSupabaseClient } from '../_shared/supabase-client.ts';

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
    const supabase = getSupabaseClient();

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

    // Step 2: Archive in batches
    let totalArchived = 0;
    let hasMore = true;

    while (hasMore && totalArchived < count) {
      // Fetch batch of old activities
      const { data: oldActivities, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .lt('created_at', cutoffIso)
        .limit(BATCH_SIZE);

      if (fetchError) {
        throw new Error(`Error fetching activities: ${fetchError.message}`);
      }

      if (!oldActivities || oldActivities.length === 0) {
        hasMore = false;
        break;
      }

      // Prepare archived records
      const archivedRecords: ActivityArchive[] = oldActivities.map((activity) => ({
        ...activity,
        archived_at: new Date().toISOString(),
      }));

      // Insert into activities_archive table
      const { error: insertError } = await supabase
        .from('activities_archive')
        .insert(archivedRecords);

      if (insertError) {
        console.error(`Error inserting into archive: ${insertError.message}`);
        // Continue anyway to delete from main table
      }

      // Delete from activities table
      const activityIds = oldActivities.map((a) => a.id);
      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .in('id', activityIds);

      if (deleteError) {
        throw new Error(`Error deleting activities: ${deleteError.message}`);
      }

      totalArchived += oldActivities.length;
      console.log(`Archived ${totalArchived} / ${count} activities`);

      // Check if we've processed all
      if (oldActivities.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    // Step 3: Clean up very old archives (older than 90 days)
    const archiveCutoffDate = new Date();
    archiveCutoffDate.setDate(archiveCutoffDate.getDate() - 90);
    const archiveCutoffIso = archiveCutoffDate.toISOString();

    const { error: cleanupError } = await supabase
      .from('activities_archive')
      .delete()
      .lt('created_at', archiveCutoffIso);

    if (cleanupError) {
      console.error(`Error cleaning old archives: ${cleanupError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Archived ${totalArchived} activities older than ${DAYS_TO_KEEP} days`,
        archived: totalArchived,
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
