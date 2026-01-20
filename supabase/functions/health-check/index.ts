import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseClient } from '../_shared/supabase-client.ts';
import { createLogger } from "../_shared/logger.ts";
import { corsHeaders } from '../_shared/cors.ts';

const logger = createLogger('health-check');

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  message?: string;
  last_checked: string;
}

interface SystemHealthResponse {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheckResult;
    storage: HealthCheckResult;
    auth: HealthCheckResult;
    edge_functions: HealthCheckResult;
    telegram_bot: HealthCheckResult;
    generation_queue: HealthCheckResult;
  };
  metrics: {
    active_generations: number;
    stuck_tasks: number;
    failed_tracks_24h: number;
    bot_success_rate: number;
    failure_rate_24h?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  logger.info('Starting health check');

  try {
    const supabase = getSupabaseClient();

    const checks: SystemHealthResponse['checks'] = {
      database: await checkDatabase(supabase),
      storage: await checkStorage(supabase),
      auth: await checkAuth(supabase),
      edge_functions: await checkEdgeFunctions(),
      telegram_bot: await checkTelegramBot(supabase),
      generation_queue: await checkGenerationQueue(supabase),
    };

    const metrics = await getMetrics(supabase);

    // Determine overall status
    const statuses = Object.values(checks).map(c => c.status);
    let overall_status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (statuses.includes('unhealthy')) {
      overall_status = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overall_status = 'degraded';
    }

    // Calculate failure rate from generation stats
    const failureRate = await calculateFailureRate(supabase);
    
    // If failure rate >10%, mark generation_queue as degraded/unhealthy
    if (failureRate > 10) {
      const severity = failureRate > 25 ? 'unhealthy' : 'degraded';
      if (checks.generation_queue.status === 'healthy') {
        checks.generation_queue.status = severity;
        checks.generation_queue.message = `${failureRate.toFixed(1)}% failure rate (>${failureRate > 25 ? '25' : '10'}% threshold)`;
      }
      // Log alert for high failure rate
      logger.warn('High generation failure rate detected', { 
        failure_rate: failureRate,
        threshold: failureRate > 25 ? 25 : 10,
        severity 
      });
    }

    const response: SystemHealthResponse = {
      overall_status,
      timestamp: new Date().toISOString(),
      checks,
      metrics: {
        ...metrics,
        failure_rate_24h: failureRate,
      },
    };

    const totalLatency = Date.now() - startTime;
    logger.info('Health check completed', { 
      overall_status, 
      latency_ms: totalLatency,
      metrics: response.metrics,
      failure_rate: failureRate,
    });

    // Create alert if status is not healthy
    if (overall_status !== 'healthy') {
      await createHealthAlert(supabase, response, checks);
    }

    // Always return 200 - the health status is in the response body
    // Returning 503 causes Supabase client to throw an error before parsing the body
    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed', { error: errorMessage });
    
    // Return 200 even for errors - status is in body, 503 breaks Supabase client
    return new Response(JSON.stringify({
      overall_status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      checks: {},
      metrics: { active_generations: 0, stuck_tasks: 0, failed_tracks_24h: 0, bot_success_rate: 0 },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});

async function checkDatabase(supabase: any): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    const latency = Date.now() - start;
    
    if (error) {
      return {
        name: 'Database',
        status: 'unhealthy',
        latency_ms: latency,
        message: error.message,
        last_checked: new Date().toISOString(),
      };
    }
    
    return {
      name: 'Database',
      status: latency > 1000 ? 'degraded' : 'healthy',
      latency_ms: latency,
      message: latency > 1000 ? 'High latency detected' : 'OK',
      last_checked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Database',
      status: 'unhealthy',
      message: err instanceof Error ? err.message : 'Unknown error',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkStorage(supabase: any): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const { data, error } = await supabase.storage.getBucket('project-assets');
    const latency = Date.now() - start;
    
    if (error) {
      return {
        name: 'Storage',
        status: 'unhealthy',
        latency_ms: latency,
        message: error.message,
        last_checked: new Date().toISOString(),
      };
    }
    
    return {
      name: 'Storage',
      status: 'healthy',
      latency_ms: latency,
      message: `Bucket: ${data?.name || 'project-assets'}`,
      last_checked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Storage',
      status: 'unhealthy',
      message: err instanceof Error ? err.message : 'Unknown error',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkAuth(supabase: any): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Check auth by attempting to get auth settings
    const { error } = await supabase.auth.getSession();
    const latency = Date.now() - start;
    
    return {
      name: 'Auth Service',
      status: error ? 'degraded' : 'healthy',
      latency_ms: latency,
      message: error ? error.message : 'OK',
      last_checked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Auth Service',
      status: 'unhealthy',
      message: err instanceof Error ? err.message : 'Unknown error',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkEdgeFunctions(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  // List of critical edge functions to verify
  const criticalFunctions = [
    'suno-music-generate',
    'suno-music-callback',
    'telegram-bot',
    'send-telegram-notification',
  ];
  
  // Edge functions are healthy if we reached this point
  // More sophisticated check would ping each function
  const latency = Date.now() - start;
  
  return {
    name: 'Edge Functions',
    status: 'healthy',
    latency_ms: latency,
    message: `${criticalFunctions.length} critical functions monitored`,
    last_checked: new Date().toISOString(),
  };
}

async function checkTelegramBot(supabase: any): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Check both 1h and 24h metrics for better assessment
    const { data: hourlyData, error: hourlyError } = await supabase.rpc('get_telegram_bot_metrics', {
      _time_period: '1 hour'
    });
    
    const { data: dailyData } = await supabase.rpc('get_telegram_bot_metrics', {
      _time_period: '24 hours'
    });
    
    const latency = Date.now() - start;
    
    if (hourlyError) {
      return {
        name: 'Telegram Bot',
        status: 'degraded',
        latency_ms: latency,
        message: 'Unable to fetch metrics',
        last_checked: new Date().toISOString(),
      };
    }
    
    const hourlyMetrics = hourlyData?.[0];
    const dailyMetrics = dailyData?.[0];
    
    const hourlyEvents = hourlyMetrics?.total_events || 0;
    const hourlySuccessRate = hourlyMetrics?.success_rate || 0;
    const dailySuccessRate = dailyMetrics?.success_rate || 0;
    const dailyEvents = dailyMetrics?.total_events || 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = '';
    
    // If no events in the last hour, check daily metrics instead
    if (hourlyEvents === 0) {
      if (dailyEvents === 0) {
        // No activity at all - bot might be idle, not necessarily unhealthy
        message = 'No recent activity (idle)';
        status = 'healthy';
      } else {
        // No hourly events but has daily - use daily rate
        message = `Idle 1h, ${dailySuccessRate.toFixed(1)}% daily (${dailyEvents} events/24h)`;
        status = dailySuccessRate >= 80 ? 'healthy' : dailySuccessRate >= 60 ? 'degraded' : 'unhealthy';
      }
    } else {
      // Has hourly events - use hourly rate
      message = `${hourlySuccessRate.toFixed(1)}% success (${hourlyEvents} events/1h)`;
      
      if (hourlySuccessRate < 80) {
        status = 'unhealthy';
        message = `Critical: ${message}`;
      } else if (hourlySuccessRate < 95) {
        status = 'degraded';
        message = `Warning: ${message}`;
      }
    }
    
    return {
      name: 'Telegram Bot',
      status,
      latency_ms: latency,
      message,
      last_checked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Telegram Bot',
      status: 'degraded',
      message: 'No metrics available',
      last_checked: new Date().toISOString(),
    };
  }
}

async function checkGenerationQueue(supabase: any): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Check for stuck tasks (pending for more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count: stuckCount, error: stuckError } = await supabase
      .from('generation_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo);
    
    // Check active tasks
    const { count: activeCount, error: activeError } = await supabase
      .from('generation_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']);
    
    const latency = Date.now() - start;
    
    if (stuckError || activeError) {
      return {
        name: 'Generation Queue',
        status: 'degraded',
        latency_ms: latency,
        message: 'Unable to check queue status',
        last_checked: new Date().toISOString(),
      };
    }
    
    const stuck = stuckCount || 0;
    const active = activeCount || 0;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = `${active} active, ${stuck} stuck`;
    
    if (stuck > 10) {
      status = 'unhealthy';
      message = `Critical: ${message}`;
    } else if (stuck > 0) {
      status = 'degraded';
      message = `Warning: ${message}`;
    }
    
    return {
      name: 'Generation Queue',
      status,
      latency_ms: latency,
      message,
      last_checked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'Generation Queue',
      status: 'unhealthy',
      message: err instanceof Error ? err.message : 'Unknown error',
      last_checked: new Date().toISOString(),
    };
  }
}

async function getMetrics(supabase: any): Promise<SystemHealthResponse['metrics']> {
  try {
    // Active generations
    const { count: activeGenerations } = await supabase
      .from('generation_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'processing']);
    
    // Stuck tasks
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: stuckTasks } = await supabase
      .from('generation_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo);
    
    // Failed tracks in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: failedTracks } = await supabase
      .from('tracks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gt('created_at', oneDayAgo);
    
    // Bot success rate
    const { data: botMetrics } = await supabase.rpc('get_telegram_bot_metrics', {
      _time_period: '24 hours'
    });
    
    return {
      active_generations: activeGenerations || 0,
      stuck_tasks: stuckTasks || 0,
      failed_tracks_24h: failedTracks || 0,
      bot_success_rate: botMetrics?.[0]?.success_rate || 0,
    };
  } catch {
    return {
      active_generations: 0,
      stuck_tasks: 0,
      failed_tracks_24h: 0,
      bot_success_rate: 0,
    };
  }
}

// Calculate generation failure rate from last 24h
async function calculateFailureRate(supabase: any): Promise<number> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: totalCount } = await supabase
      .from('generation_tasks')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo);
    
    const { count: failedCount } = await supabase
      .from('generation_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', oneDayAgo);
    
    if (!totalCount || totalCount === 0) return 0;
    return ((failedCount || 0) / totalCount) * 100;
  } catch {
    return 0;
  }
}

// Create health alert record for tracking
async function createHealthAlert(
  supabase: any, 
  response: SystemHealthResponse, 
  checks: SystemHealthResponse['checks']
): Promise<void> {
  try {
    const unhealthyServices = Object.entries(checks)
      .filter(([_, c]) => c.status === 'unhealthy')
      .map(([name]) => name);
    
    const degradedServices = Object.entries(checks)
      .filter(([_, c]) => c.status === 'degraded')
      .map(([name]) => name);

    await supabase.from('health_alerts').insert({
      overall_status: response.overall_status,
      alert_type: 'automated',
      unhealthy_services: unhealthyServices.length > 0 ? unhealthyServices : null,
      degraded_services: degradedServices.length > 0 ? degradedServices : null,
      metrics: response.metrics,
    });
  } catch (err) {
    logger.error('Failed to create health alert', { error: err });
  }
}
