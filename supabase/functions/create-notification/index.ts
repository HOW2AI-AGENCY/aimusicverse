import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'generation' | 'project' | 'social' | 'achievement' | 'system' | 'video_ready' | 'video_failed' | 'stems_ready' | 'track_generated' | 'section_replaced';
  actionUrl?: string;
  metadata?: Record<string, any>;
  groupKey?: string;
  expiresInMinutes?: number;
  priority?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient();

    const payload: NotificationPayload | NotificationPayload[] = await req.json();
    const notifications = Array.isArray(payload) ? payload : [payload];

    console.log(`Creating ${notifications.length} notification(s)`);

    const results = [];

    for (const notification of notifications) {
      const { userId, title, message, type, actionUrl, metadata, groupKey, expiresInMinutes, priority } = notification;

      if (!userId || !title || !message || !type) {
        results.push({ error: 'Missing required fields', notification });
        continue;
      }

      // Calculate expires_at if expiresInMinutes provided
      const expiresAt = expiresInMinutes 
        ? new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()
        : null;

      // If groupKey is provided, use upsert logic (replace existing notification with same group_key)
      if (groupKey) {
        // Try to use the upsert_notification RPC if available
        const { data, error } = await supabase.rpc('upsert_notification', {
          p_user_id: userId,
          p_title: title,
          p_message: message,
          p_type: type,
          p_action_url: actionUrl || null,
          p_group_key: groupKey,
          p_metadata: metadata || {},
          p_expires_at: expiresAt,
          p_priority: priority || 0,
        });

        if (error) {
          console.error('Error upserting notification:', error);
          // Fallback to regular insert
          const { data: insertData, error: insertError } = await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              title,
              message,
              type,
              action_url: actionUrl,
              group_key: groupKey,
              metadata: metadata || {},
              expires_at: expiresAt,
              priority: priority || 0,
              read: false,
            })
            .select()
            .single();

          if (insertError) {
            results.push({ error: insertError.message, notification });
          } else {
            results.push({ success: true, id: insertData.id, method: 'insert' });
          }
        } else {
          console.log(`Notification upserted for user ${userId}: ${title}`);
          results.push({ success: true, id: data, method: 'upsert' });
        }
      } else {
        // Regular insert without groupKey
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title,
            message,
            type,
            action_url: actionUrl,
            metadata: metadata || {},
            expires_at: expiresAt,
            priority: priority || 0,
            read: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating notification:', error);
          results.push({ error: error.message, notification });
        } else {
          console.log(`Notification created for user ${userId}: ${title}`);
          results.push({ success: true, id: data.id });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created: results.filter(r => r.success).length,
        failed: results.filter(r => r.error).length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in create-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
