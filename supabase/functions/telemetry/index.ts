import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelemetryPayload {
  sessionId: string;
  sessionDuration: number;
  metrics: Array<{
    name: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
    timestamp: number;
  }>;
  errors: Record<string, {
    code: string;
    message: string;
    count: number;
    lastOccurred: number;
  }>;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let payload: TelemetryPayload;
    
    // Handle both JSON and FormData (for sendBeacon)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const text = await req.text();
      payload = JSON.parse(text);
    }

    const { sessionId, sessionDuration, metrics, errors, timestamp } = payload;

    // Aggregate metrics by name for storage
    const aggregatedMetrics: Record<string, { sum: number; count: number; min: number; max: number }> = {};
    
    for (const metric of metrics) {
      const key = metric.name;
      if (!aggregatedMetrics[key]) {
        aggregatedMetrics[key] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
      }
      aggregatedMetrics[key].sum += metric.value;
      aggregatedMetrics[key].count++;
      aggregatedMetrics[key].min = Math.min(aggregatedMetrics[key].min, metric.value);
      aggregatedMetrics[key].max = Math.max(aggregatedMetrics[key].max, metric.value);
    }

    // Store aggregated telemetry data
    const telemetryRecord = {
      session_id: sessionId,
      session_duration_sec: sessionDuration,
      metrics_summary: Object.fromEntries(
        Object.entries(aggregatedMetrics).map(([name, stats]) => [
          name,
          {
            avg: stats.sum / stats.count,
            min: stats.min === Infinity ? 0 : stats.min,
            max: stats.max === -Infinity ? 0 : stats.max,
            count: stats.count,
          },
        ])
      ),
      error_summary: Object.fromEntries(
        Object.entries(errors).map(([code, data]) => [
          code,
          { count: data.count, lastMessage: data.message },
        ])
      ),
      raw_metrics_count: metrics.length,
      recorded_at: timestamp,
    };

    // Insert into telemetry_events table
    const telemetryEvents = metrics.map((m) => ({
      session_id: sessionId,
      event_type: m.name.split(':')[0] || 'metric',
      event_name: m.name,
      event_data: { value: m.value, unit: m.unit, ...m.tags },
      duration_ms: m.unit === 'ms' ? Math.round(m.value) : null,
      timestamp: new Date(m.timestamp).toISOString(),
      platform: m.tags?.platform || 'web',
    }));

    if (telemetryEvents.length > 0) {
      const { error: insertError } = await supabase
        .from('telemetry_events')
        .insert(telemetryEvents);
      
      if (insertError) {
        console.warn('Failed to insert telemetry events:', insertError.message);
      }
    }

    // Insert errors into error_logs table
    const errorLogs = Object.entries(errors).map(([code, data]) => ({
      session_id: sessionId,
      error_type: code.split(':')[0] || 'unknown',
      error_message: data.message,
      error_fingerprint: code,
      severity: data.count >= 5 ? 'critical' : data.count >= 3 ? 'error' : 'warning',
      context: { count: data.count },
    }));

    if (errorLogs.length > 0) {
      const { error: errorInsertError } = await supabase
        .from('error_logs')
        .insert(errorLogs);
      
      if (errorInsertError) {
        console.warn('Failed to insert error logs:', errorInsertError.message);
      }
    }

    console.log("Telemetry received:", JSON.stringify({
      sessionId,
      sessionDurationSec: sessionDuration,
      metricsCount: metrics.length,
      errorsCount: Object.keys(errors).length,
    }));

    // Track high-severity errors
    const highSeverityErrors = Object.values(errors).filter(e => e.count >= 3);
    if (highSeverityErrors.length > 0) {
      console.warn("High frequency errors detected:", highSeverityErrors);
    }

    return new Response(
      JSON.stringify({ success: true, processed: metrics.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Telemetry error:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to process telemetry" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
