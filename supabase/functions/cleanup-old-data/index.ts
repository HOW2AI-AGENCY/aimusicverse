import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Cleanup Old Data Edge Function
 * 
 * Periodically cleans up old data from various tables to prevent database bloat:
 * - error_logs: 30 days retention
 * - user_analytics_events: 90 days retention
 * - api_usage_logs: 60 days retention
 * - error_logs_archive: 90 days retention
 * - api_usage_logs_archive: 90 days retention
 * 
 * This function can be triggered manually or via pg_cron schedule.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse optional parameters from request body
    let dryRun = false;
    let retention = {
      error_logs: 30,
      user_analytics_events: 90,
      api_usage_logs: 60,
      error_logs_archive: 90,
      api_usage_logs_archive: 90,
    };

    try {
      const body = await req.json();
      dryRun = body.dryRun === true;
      if (body.retention) {
        retention = { ...retention, ...body.retention };
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    console.log(`[cleanup-old-data] Starting cleanup. Dry run: ${dryRun}`);
    console.log(`[cleanup-old-data] Retention settings:`, retention);

    const results: Record<string, { deleted: number; error?: string }> = {};

    // Helper function to delete old records
    const cleanupTable = async (
      tableName: string, 
      timestampColumn: string, 
      retentionDays: number
    ): Promise<number> => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffISO = cutoffDate.toISOString();

      console.log(`[cleanup-old-data] Cleaning ${tableName} older than ${cutoffISO}`);

      if (dryRun) {
        // Count only, don't delete
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .lt(timestampColumn, cutoffISO);

        if (error) {
          throw new Error(`Failed to count ${tableName}: ${error.message}`);
        }

        console.log(`[cleanup-old-data] [DRY RUN] Would delete ${count || 0} records from ${tableName}`);
        return count || 0;
      }

      // Delete in batches to avoid timeout
      let totalDeleted = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        // First get IDs to delete
        const { data: toDelete, error: selectError } = await supabase
          .from(tableName)
          .select('id')
          .lt(timestampColumn, cutoffISO)
          .limit(batchSize);

        if (selectError) {
          throw new Error(`Failed to select from ${tableName}: ${selectError.message}`);
        }

        if (!toDelete || toDelete.length === 0) {
          hasMore = false;
          break;
        }

        const ids = toDelete.map(r => r.id);

        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .in('id', ids);

        if (deleteError) {
          throw new Error(`Failed to delete from ${tableName}: ${deleteError.message}`);
        }

        totalDeleted += ids.length;
        console.log(`[cleanup-old-data] Deleted batch of ${ids.length} from ${tableName}. Total: ${totalDeleted}`);

        // If we got less than batch size, we're done
        if (toDelete.length < batchSize) {
          hasMore = false;
        }
      }

      return totalDeleted;
    };

    // Cleanup each table
    const tables: Array<{ name: string; column: string; days: number }> = [
      { name: 'error_logs', column: 'created_at', days: retention.error_logs },
      { name: 'user_analytics_events', column: 'created_at', days: retention.user_analytics_events },
      { name: 'api_usage_logs', column: 'created_at', days: retention.api_usage_logs },
      { name: 'error_logs_archive', column: 'created_at', days: retention.error_logs_archive },
      { name: 'api_usage_logs_archive', column: 'created_at', days: retention.api_usage_logs_archive },
    ];

    for (const table of tables) {
      try {
        const deleted = await cleanupTable(table.name, table.column, table.days);
        results[table.name] = { deleted };
      } catch (error) {
        console.error(`[cleanup-old-data] Error cleaning ${table.name}:`, error);
        results[table.name] = { deleted: 0, error: String(error) };
      }
    }

    const duration = Date.now() - startTime;
    const totalDeleted = Object.values(results).reduce((sum, r) => sum + r.deleted, 0);
    const hasErrors = Object.values(results).some(r => r.error);

    console.log(`[cleanup-old-data] Completed in ${duration}ms. Total deleted: ${totalDeleted}`);

    // Log cleanup to analytics_aggregates for monitoring
    if (!dryRun && totalDeleted > 0) {
      try {
        const now = new Date();
        const periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);

        await supabase.from('analytics_aggregates').insert({
          metric_name: 'cleanup_old_data',
          metric_value: totalDeleted,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          dimension: 'automated',
          dimension_value: dryRun ? 'dry_run' : 'executed',
          sample_count: Object.keys(results).length,
        });
      } catch (logError) {
        console.warn('[cleanup-old-data] Failed to log to analytics:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        dryRun,
        results,
        totalDeleted,
        durationMs: duration,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: hasErrors ? 207 : 200,
      }
    );
  } catch (error) {
    console.error('[cleanup-old-data] Fatal error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        durationMs: Date.now() - startTime,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
