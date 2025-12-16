import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'generation' | 'project' | 'social' | 'achievement' | 'system';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload | NotificationPayload[] = await req.json();
    const notifications = Array.isArray(payload) ? payload : [payload];

    console.log(`Creating ${notifications.length} notification(s)`);

    const results = [];

    for (const notification of notifications) {
      const { userId, title, message, type, actionUrl, metadata } = notification;

      if (!userId || !title || !message || !type) {
        results.push({ error: 'Missing required fields', notification });
        continue;
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
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
