/**
 * Analytics API Layer
 * Raw Supabase operations for analytics tracking
 */

import { supabase } from '@/integrations/supabase/client';

// ==========================================
// Types
// ==========================================

export type EventType = 
  | 'page_view'
  | 'generation_started'
  | 'generation_completed'
  | 'track_played'
  | 'track_liked'
  | 'track_shared'
  | 'feature_used'
  | 'button_clicked'
  | 'session_started'
  | 'session_ended';

export interface AnalyticsEvent {
  eventType: EventType;
  eventName?: string;
  pagePath?: string;
  metadata?: Record<string, unknown>;
  sessionId: string;
  userId?: string;
}

export interface UserBehaviorStats {
  total_events: number;
  unique_sessions: number;
  unique_users: number;
  events_by_type: Record<string, number>;
  top_pages: Array<{ page_path: string; views: number }>;
  hourly_distribution: Record<string, number>;
}

export interface DeeplinkStats {
  total_clicks: number;
  unique_users: number;
  conversions: number;
  conversion_rate: number;
  top_sources: Array<{ source: string; count: number }>;
  top_types: Array<{ deeplink_type: string; count: number }>;
}

export interface DeeplinkEvent {
  id: string;
  user_id: string | null;
  session_id: string | null;
  deeplink_type: string;
  deeplink_value: string | null;
  source: string | null;
  campaign: string | null;
  referrer: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  converted: boolean;
  conversion_type: string | null;
}

export interface FunnelDropoffData {
  step_name: string;
  step_index: number;
  users_reached: number;
  users_dropped: number;
  conversion_rate: number;
  avg_duration_ms: number;
}

// ==========================================
// Analytics Events
// ==========================================

/**
 * Track an analytics event
 */
export async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const { error } = await supabase.from('user_analytics_events').insert([{
    user_id: event.userId || null,
    session_id: event.sessionId,
    event_type: event.eventType,
    event_name: event.eventName || null,
    page_path: event.pagePath || null,
    metadata: (event.metadata || {}) as Record<string, string | number | boolean | null>,
  }]);

  if (error) throw new Error(error.message);
}

/**
 * Get user behavior statistics
 */
export async function fetchUserBehaviorStats(
  timePeriod: string = '7 days'
): Promise<UserBehaviorStats | null> {
  const { data, error } = await supabase.rpc('get_user_behavior_stats', {
    _time_period: timePeriod,
  });
  if (error) throw new Error(error.message);
  return data?.[0] as UserBehaviorStats | null;
}

// ==========================================
// Deeplink Analytics
// ==========================================

/**
 * Track a deeplink visit
 */
export async function trackDeeplinkVisit(params: {
  deeplinkType: string;
  deeplinkValue?: string;
  source?: string;
  campaign?: string;
  referrer?: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from('deeplink_analytics').insert([{
    user_id: params.userId || null,
    session_id: params.sessionId,
    deeplink_type: params.deeplinkType,
    deeplink_value: params.deeplinkValue || null,
    source: params.source || null,
    campaign: params.campaign || null,
    referrer: params.referrer || null,
    metadata: (params.metadata || {}) as Record<string, string | number | boolean | null>,
  }]);

  if (error) throw new Error(error.message);
}

/**
 * Mark a deeplink conversion
 */
export async function markDeeplinkConversion(
  sessionId: string,
  conversionType: string
): Promise<void> {
  const { error } = await supabase
    .from('deeplink_analytics')
    .update({
      converted: true,
      conversion_type: conversionType,
    })
    .eq('session_id', sessionId);

  if (error) throw new Error(error.message);
}

/**
 * Get deeplink statistics
 */
export async function fetchDeeplinkStats(
  timePeriod: string = '7 days'
): Promise<DeeplinkStats | null> {
  const { data, error } = await supabase.rpc('get_deeplink_stats', {
    _time_period: timePeriod,
  });
  if (error) throw new Error(error.message);
  return data?.[0] as DeeplinkStats | null;
}

/**
 * Get deeplink events
 */
export async function fetchDeeplinkEvents(options: {
  timeRange?: string;
  limit?: number;
}): Promise<DeeplinkEvent[]> {
  const { timeRange = '7d', limit = 100 } = options;
  
  const getTimeFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const { data, error } = await supabase
    .from('deeplink_analytics')
    .select('*')
    .gte('created_at', getTimeFilter())
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw new Error(error.message);
  return data as DeeplinkEvent[];
}

// ==========================================
// Journey / Funnel Analytics
// ==========================================

/**
 * Track a journey step
 */
export async function trackJourneyStep(params: {
  userId: string;
  sessionId: string;
  funnelName: string;
  stepName: string;
  stepIndex: number;
  completed: boolean;
  durationFromPrevMs?: number;
  droppedOff?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await (supabase.from('user_journey_events') as any).insert({
    user_id: params.userId,
    session_id: params.sessionId,
    funnel_name: params.funnelName,
    step_name: params.stepName,
    step_index: params.stepIndex,
    completed: params.completed,
    duration_from_prev_ms: params.durationFromPrevMs || null,
    dropped_off: params.droppedOff || false,
    metadata: params.metadata || {},
  });

  if (error) throw new Error(error.message);
}

/**
 * Get funnel dropoff statistics
 */
export async function fetchFunnelDropoffStats(
  funnelName: string,
  daysBack: number = 7
): Promise<FunnelDropoffData[]> {
  const { data, error } = await supabase.rpc('get_funnel_dropoff_stats', {
    _funnel_name: funnelName,
    _days_back: daysBack,
  });

  if (error) throw new Error(error.message);
  
  return (data || []).map((row: any) => ({
    step_name: row.step_name,
    step_index: row.step_index,
    users_reached: Number(row.users_reached),
    users_dropped: Number(row.users_dropped),
    conversion_rate: Number(row.conversion_rate),
    avg_duration_ms: Number(row.avg_duration_ms),
  }));
}
