import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('health-alert');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  message?: string;
}

interface AlertPayload {
  test?: boolean;
  force?: boolean;
}

// Alert cooldown to prevent spam (15 minutes)
const ALERT_COOLDOWN_MS = 15 * 60 * 1000;
let lastAlertTime = 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AlertPayload = await req.json().catch(() => ({}));
    const { test = false, force = false } = payload;

    logger.info('Health alert triggered', { test, force });

    const supabase = getSupabaseClient();

    // Get admin users to send alerts to
    const { data: adminUsers, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      logger.error('Failed to fetch admin users', { error: adminError.message });
      throw new Error('Failed to fetch admin users');
    }

    if (!adminUsers || adminUsers.length === 0) {
      logger.warn('No admin users found for alerts');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No admin users configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get chat IDs for admin users
    const adminUserIds = adminUsers.map(u => u.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, telegram_chat_id, telegram_id, first_name')
      .in('user_id', adminUserIds);

    const adminChatIds = profiles
      ?.filter(p => p.telegram_chat_id || p.telegram_id)
      .map(p => ({
        chatId: p.telegram_chat_id || p.telegram_id,
        name: p.first_name
      })) || [];

    if (adminChatIds.length === 0) {
      logger.warn('No admin chat IDs found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No admin Telegram chat IDs configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If test mode, send test alert and log
    if (test) {
      const testMessage = `🧪 *Тестовый алерт*\n\nСистема мониторинга работает корректно\\.\n\n_${new Date().toISOString()}_`;
      
      await sendAlertToAdmins(adminChatIds, testMessage);
      
      // Log test alert to database
      await supabase.from('health_alerts').insert({
        overall_status: 'healthy',
        alert_type: 'test',
        is_test: true,
        recipients_count: adminChatIds.length,
        metrics: {},
      });
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: 'test',
        recipients: adminChatIds.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cooldown (unless forced)
    const now = Date.now();
    if (!force && (now - lastAlertTime) < ALERT_COOLDOWN_MS) {
      logger.info('Alert skipped due to cooldown', { 
        lastAlert: new Date(lastAlertTime).toISOString(),
        cooldownRemaining: Math.round((ALERT_COOLDOWN_MS - (now - lastAlertTime)) / 1000)
      });
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        reason: 'cooldown' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Perform health check
    const healthResponse = await supabase.functions.invoke('health-check');
    
    if (healthResponse.error) {
      logger.error('Health check failed', { error: healthResponse.error.message });
      throw new Error('Health check failed');
    }

    const healthData = healthResponse.data;
    
    // Only alert if unhealthy
    if (healthData.overall_status !== 'unhealthy') {
      logger.info('System healthy, no alert needed', { status: healthData.overall_status });
      return new Response(JSON.stringify({ 
        success: true, 
        status: healthData.overall_status,
        alert_sent: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build alert message
    const unhealthyChecks = Object.entries(healthData.checks)
      .filter(([_, check]: [string, any]) => check.status === 'unhealthy')
      .map(([key, check]: [string, any]) => ({
        name: check.name,
        message: check.message
      }));

    const degradedChecks = Object.entries(healthData.checks)
      .filter(([_, check]: [string, any]) => check.status === 'degraded')
      .map(([key, check]: [string, any]) => ({
        name: check.name,
        message: check.message
      }));

    const alertMessage = buildAlertMessage(healthData, unhealthyChecks, degradedChecks);
    
    // Send alerts
    await sendAlertToAdmins(adminChatIds, alertMessage);
    lastAlertTime = now;

    // Log alert to database
    const { error: insertError } = await supabase.from('health_alerts').insert({
      overall_status: healthData.overall_status,
      alert_type: force ? 'forced' : 'automatic',
      unhealthy_services: unhealthyChecks.map(c => c.name),
      degraded_services: degradedChecks.map(c => c.name),
      metrics: healthData.metrics,
      recipients_count: adminChatIds.length,
      is_test: false,
    });

    if (insertError) {
      logger.warn('Failed to log alert to database', { error: insertError.message });
    }

    logger.success('Health alert sent', { 
      recipients: adminChatIds.length,
      unhealthyServices: unhealthyChecks.length
    });

    return new Response(JSON.stringify({ 
      success: true,
      alert_sent: true,
      recipients: adminChatIds.length,
      unhealthy_services: unhealthyChecks.map(c => c.name)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health alert error', { error: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

function buildAlertMessage(
  healthData: any, 
  unhealthyChecks: Array<{ name: string; message: string }>,
  degradedChecks: Array<{ name: string; message: string }>
): string {
  const escapeMarkdown = (text: string) => {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  };

  let message = `🚨 *CRITICAL: Система требует внимания\\!*\n\n`;
  
  if (unhealthyChecks.length > 0) {
    message += `❌ *Критические проблемы:*\n`;
    for (const check of unhealthyChecks) {
      message += `  • ${escapeMarkdown(check.name)}: ${escapeMarkdown(check.message)}\n`;
    }
    message += `\n`;
  }

  if (degradedChecks.length > 0) {
    message += `⚠️ *Предупреждения:*\n`;
    for (const check of degradedChecks) {
      message += `  • ${escapeMarkdown(check.name)}: ${escapeMarkdown(check.message)}\n`;
    }
    message += `\n`;
  }

  // Add metrics
  message += `📊 *Метрики:*\n`;
  message += `  • Активных генераций: ${healthData.metrics.active_generations}\n`;
  message += `  • Зависших задач: ${healthData.metrics.stuck_tasks}\n`;
  message += `  • Ошибок \\(24ч\\): ${healthData.metrics.failed_tracks_24h}\n`;
  message += `  • Bot Success Rate: ${healthData.metrics.bot_success_rate.toFixed(1)}%\n`;
  
  message += `\n_${escapeMarkdown(new Date().toISOString())}_`;

  return message;
}

async function sendAlertToAdmins(
  admins: Array<{ chatId: number; name: string }>,
  message: string
): Promise<void> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  for (const admin of admins) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: admin.chatId,
          text: message,
          parse_mode: 'MarkdownV2',
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        logger.warn('Failed to send alert to admin', { 
          chatId: admin.chatId, 
          error: result.description 
        });
      } else {
        logger.info('Alert sent to admin', { chatId: admin.chatId, name: admin.name });
      }
    } catch (err) {
      logger.error('Error sending alert', { 
        chatId: admin.chatId, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  }
}
