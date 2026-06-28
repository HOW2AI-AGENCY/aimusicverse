import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { createLogger } from "../_shared/logger.ts";
import { authorize } from "../_shared/auth.ts";

const logger = createLogger("generation-failure-alert");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FAILURE_RATE_THRESHOLD = 10;
const ALERT_COOLDOWN_MS = 30 * 60 * 1000;
const LOOKBACK_MINUTES = 60;
const MIN_TASKS_FOR_ALERT = 5;

let lastAlertTime = 0;

interface AlertPayload {
  test?: boolean;
  force?: boolean;
  threshold?: number;
  lookback_minutes?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const providedCron = req.headers.get("x-cron-secret");
    const isCron = !!cronSecret && providedCron === cronSecret;
    if (!isCron) {
      const auth = await authorize(req, { requireAdmin: true });
      if (!auth.ok) {
        return new Response(JSON.stringify({ error: auth.error }), {
          status: auth.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload: AlertPayload = await req.json().catch(() => ({}));
    const {
      test = false,
      force = false,
      threshold = FAILURE_RATE_THRESHOLD,
      lookback_minutes = LOOKBACK_MINUTES,
    } = payload;

    logger.info("Generation failure alert check", { test, force, threshold, lookback_minutes });

    const supabase = getSupabaseClient();

    const now = Date.now();
    if (!force && !test && now - lastAlertTime < ALERT_COOLDOWN_MS) {
      const cooldownRemaining = Math.round((ALERT_COOLDOWN_MS - (now - lastAlertTime)) / 1000);
      logger.info("Alert skipped due to cooldown", { cooldownRemaining });
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "cooldown", cooldownRemaining }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since = new Date(Date.now() - lookback_minutes * 60 * 1000).toISOString();

    const { data: totalData, error: totalError } = await supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    if (totalError) {
      logger.error("Failed to fetch total tasks", { error: totalError.message });
      throw new Error("Failed to query generation_tasks");
    }

    const totalTasks = totalData?.length ?? 0;

    const { count: totalCount } = await supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    const { count: failedCount } = await supabase
      .from("generation_tasks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since)
      .eq("status", "failed");

    const total = totalCount ?? 0;
    const failed = failedCount ?? 0;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;

    logger.info("Failure rate calculated", { total, failed, failureRate: failureRate.toFixed(1) });

    if (test) {
      const testMessage = buildTestMessage(failureRate, total, failed, lookback_minutes);
      await sendAlertToAdmins(supabase, testMessage);
      return new Response(
        JSON.stringify({
          success: true,
          type: "test",
          failureRate: failureRate.toFixed(1),
          total,
          failed,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (total < MIN_TASKS_FOR_ALERT) {
      logger.info("Not enough tasks for alert", { total, minimum: MIN_TASKS_FOR_ALERT });
      return new Response(
        JSON.stringify({
          success: true,
          alert_sent: false,
          reason: "insufficient_data",
          total,
          failureRate: failureRate.toFixed(1),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (failureRate <= threshold) {
      logger.info("Failure rate within threshold", { failureRate: failureRate.toFixed(1), threshold });
      return new Response(
        JSON.stringify({
          success: true,
          alert_sent: false,
          failureRate: failureRate.toFixed(1),
          threshold,
          total,
          failed,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: failureBreakdown } = await supabase
      .from("generation_tasks")
      .select("failure_category")
      .gte("created_at", since)
      .eq("status", "failed")
      .not("failure_category", "is", null);

    const categories: Record<string, number> = {};
    if (failureBreakdown) {
      for (const row of failureBreakdown) {
        const cat = row.failure_category || "unknown";
        categories[cat] = (categories[cat] || 0) + 1;
      }
    }

    const alertMessage = buildAlertMessage(failureRate, total, failed, lookback_minutes, categories, threshold);
    await sendAlertToAdmins(supabase, alertMessage);
    lastAlertTime = Date.now();

    try {
      await supabase.from("health_alerts").insert({
        overall_status: failureRate > 20 ? "unhealthy" : "degraded",
        alert_type: force ? "forced" : "automatic",
        is_test: false,
        metrics: {
          type: "generation_failure_rate",
          failure_rate: parseFloat(failureRate.toFixed(1)),
          total_tasks: total,
          failed_tasks: failed,
          lookback_minutes,
          threshold,
          categories,
        },
      });
    } catch (logErr) {
      logger.warn("Failed to log alert to health_alerts", { error: logErr });
    }

    logger.success("Failure rate alert sent", { failureRate: failureRate.toFixed(1), total, failed });

    return new Response(
      JSON.stringify({
        success: true,
        alert_sent: true,
        failureRate: failureRate.toFixed(1),
        total,
        failed,
        categories,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Generation failure alert error", { error: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

function buildTestMessage(failureRate: number, total: number, failed: number, lookbackMinutes: number): string {
  return [
    `🧪 *Тестовый алерт: Failure Rate*`,
    ``,
    `📊 Текущие метрики \\(${lookbackMinutes} мин\\):`,
    `  • Всего задач: ${total}`,
    `  • Провалено: ${failed}`,
    `  • Failure rate: ${escapeMarkdown(failureRate.toFixed(1))}%`,
    ``,
    `_${escapeMarkdown(new Date().toISOString())}_`,
  ].join("\n");
}

function buildAlertMessage(
  failureRate: number,
  total: number,
  failed: number,
  lookbackMinutes: number,
  categories: Record<string, number>,
  threshold: number,
): string {
  const severity = failureRate > 20 ? "🔴 CRITICAL" : "🟡 WARNING";
  const categoryLabels: Record<string, string> = {
    api_error: "API ошибки",
    rate_limit: "Rate limit",
    content_policy: "Политика контента",
    timeout: "Таймауты",
    network: "Сеть",
    validation: "Валидация",
    unknown: "Неизвестно",
  };

  const lines = [
    `🚨 *${severity}: Failure Rate генерации >${threshold}%*`,
    ``,
    `📊 *Метрики \\(${lookbackMinutes} мин\\):*`,
    `  • Всего задач: ${total}`,
    `  • Провалено: ${failed}`,
    `  • Failure rate: *${escapeMarkdown(failureRate.toFixed(1))}%*`,
  ];

  const sortedCategories = Object.entries(categories).sort(([, a], [, b]) => b - a);
  if (sortedCategories.length > 0) {
    lines.push(``);
    lines.push(`🔍 *Breakdown по категориям:*`);
    for (const [cat, count] of sortedCategories) {
      const label = categoryLabels[cat] || escapeMarkdown(cat);
      const pct = ((count / failed) * 100).toFixed(0);
      lines.push(`  • ${label}: ${count} \\(${pct}%\\)`);
    }
  }

  lines.push(``);
  lines.push(`💡 *Действия:*`);
  if (categories.rate_limit > 0) {
    lines.push(`  • Проверить лимиты Suno API`);
  }
  if (categories.api_error > 0) {
    lines.push(`  • Проверить статус Suno API`);
  }
  if (categories.timeout > 0) {
    lines.push(`  • Проверить время ответа бэкенда`);
  }
  lines.push(`  • Dashboard: /admin/generation\\-metrics`);

  lines.push(``);
  lines.push(`_${escapeMarkdown(new Date().toISOString())}_`);

  return lines.join("\n");
}

async function sendAlertToAdmins(supabase: any, message: string): Promise<void> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured");
  }

  const { data: adminUsers } = await supabase.from("user_roles").select("user_id").eq("role", "admin");

  if (!adminUsers || adminUsers.length === 0) {
    logger.warn("No admin users found for alerts");
    return;
  }

  const adminUserIds = adminUsers.map((u: { user_id: string }) => u.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, telegram_chat_id, telegram_id, first_name")
    .in("user_id", adminUserIds);

  const adminChatIds =
    profiles
      ?.filter((p: any) => p.telegram_chat_id || p.telegram_id)
      .map((p: any) => ({
        chatId: p.telegram_chat_id || p.telegram_id,
        name: p.first_name,
      })) || [];

  if (adminChatIds.length === 0) {
    logger.warn("No admin chat IDs found");
    return;
  }

  for (const admin of adminChatIds) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: admin.chatId,
          text: message,
          parse_mode: "MarkdownV2",
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        logger.warn("Failed to send alert to admin", { chatId: admin.chatId, error: result.description });
      } else {
        logger.info("Alert sent to admin", { chatId: admin.chatId, name: admin.name });
      }
    } catch (err) {
      logger.error("Error sending alert", {
        chatId: admin.chatId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
}
