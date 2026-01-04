/**
 * Creator Analytics Dashboard - Type Definitions
 * 
 * This file contains TypeScript type definitions for all data schemas
 * used in the Creator Analytics Dashboard feature.
 * 
 * @module types/analytics
 */

/**
 * Analytics Event Schema
 * 
 * Represents an individual user interaction event with a track.
 * Events are immutable and retained for 90 days before archival.
 */
export interface AnalyticsEvent {
  /** Unique event identifier (UUID) */
  id: string;
  
  /** Reference to the track being interacted with */
  track_id: string;
  
  /** Reference to the specific track version */
  version_id: string;
  
  /** User who triggered the event (null for anonymous listeners) */
  user_id: string | null;
  
  /** Type of interaction event */
  event_type: 'play' | 'complete' | 'skip' | 'like' | 'share' | 'comment' | 'playlist_add';
  
  /** Timestamp when event occurred (ISO 8601 format) */
  event_timestamp: string;
  
  /** Duration of listening in seconds (null for non-playback events) */
  listen_duration: number | null;
  
  /** Percentage of track completed 0-100 (null for non-playback events) */
  completion_percentage: number | null;
  
  /** Aggregated age range of user (e.g., '18-24', '25-34') */
  user_age_range: string | null;
  
  /** User's country (ISO 3166-1 alpha-2 code, e.g., 'US', 'GB') */
  user_country: string | null;
  
  /** Session identifier for grouping related events */
  session_id: string;
}

/**
 * Aggregated Track Analytics Schema
 * 
 * Daily rollup of track performance metrics.
 * Permanently retained for historical reporting.
 */
export interface TrackAnalytics {
  /** Track identifier */
  track_id: string;
  
  /** Specific version ID (null means aggregated across all versions) */
  version_id: string | null;
  
  /** Date of aggregation (YYYY-MM-DD format) */
  date: string;
  
  /** Total number of plays */
  play_count: number;
  
  /** Number of unique listeners */
  unique_listeners: number;
  
  /** Number of plays that reached 90%+ of track duration */
  completion_count: number;
  
  /** Completion rate as percentage (0-100) */
  completion_rate: number;
  
  /** Average listening duration in seconds */
  average_listen_duration: number;
  
  /** Number of times track was skipped */
  skip_count: number;
  
  /** Skip rate as percentage (0-100) */
  skip_rate: number;
  
  /** Total like count */
  like_count: number;
  
  /** Total comment count */
  comment_count: number;
  
  /** Total share count */
  share_count: number;
  
  /** Number of times added to playlists */
  playlist_add_count: number;
  
  /** Engagement rate: (likes + comments + shares) / plays * 100 */
  engagement_rate: number;
  
  /** Viral coefficient: shares / plays */
  viral_coefficient: number;
}

/**
 * Demographic Summary Schema
 * 
 * Privacy-safe aggregated demographic data for a track.
 * Only generated when minimum play threshold (100) is met.
 */
export interface DemographicSummary {
  /** Track identifier */
  track_id: string;
  
  /** Start date of summary period (ISO 8601) */
  date_range_start: string;
  
  /** End date of summary period (ISO 8601) */
  date_range_end: string;
  
  /** Age group distribution with percentages */
  age_distribution: Record<string, number>;
  
  /** Geographic distribution - top 10 countries with percentages */
  geographic_distribution: Array<{
    country: string;
    country_code: string; // ISO 3166-1 alpha-2
    percentage: number;
    listener_count: number;
  }>;
  
  /** Hours (0-23) with highest listening activity */
  peak_listening_hours: Array<number>;
  
  /** Average session duration in seconds */
  average_session_duration: number;
  
  /** Total number of unique listeners in period */
  total_unique_listeners: number;
}

/**
 * Revenue Summary Schema
 * 
 * Financial metrics for a track including revenue by source and projections.
 */
export interface RevenueSummary {
  /** Track identifier */
  track_id: string;
  
  /** Start date of summary period (ISO 8601) */
  date_range_start: string;
  
  /** End date of summary period (ISO 8601) */
  date_range_end: string;
  
  /** Total revenue in USD cents */
  total_revenue: number;
  
  /** Revenue breakdown by source in USD cents */
  revenue_by_source: {
    platform_plays: number;
    tips: number;
    premium_subscriptions: number;
  };
  
  /** Revenue per 1000 plays (RPM) in USD cents */
  rpm: number;
  
  /** Projected 30-day revenue based on current trends (USD cents) */
  projected_30_day_revenue: number;
  
  /** Projected 90-day revenue based on current trends (USD cents) */
  projected_90_day_revenue: number;
  
  /** Settled revenue amount (USD cents) */
  settled_revenue: number;
  
  /** Pending revenue amount awaiting settlement (USD cents) */
  pending_revenue: number;
  
  /** Expected settlement date for pending revenue (ISO 8601) */
  pending_settlement_date: string | null;
}

/**
 * Version Comparison Schema
 * 
 * Side-by-side comparison of A/B track versions.
 */
export interface VersionComparison {
  /** Track identifier */
  track_id: string;
  
  /** Date range for comparison data */
  date_range_start: string;
  date_range_end: string;
  
  /** Version A metrics */
  version_a: {
    version_id: string;
    version_label: string;
    play_count: number;
    completion_rate: number;
    engagement_rate: number;
    skip_rate: number;
  };
  
  /** Version B metrics */
  version_b: {
    version_id: string;
    version_label: string;
    play_count: number;
    completion_rate: number;
    engagement_rate: number;
    skip_rate: number;
  };
  
  /** Performance differential */
  differential: {
    play_count_diff: number; // positive means A > B
    completion_rate_diff: number;
    engagement_rate_diff: number;
    skip_rate_diff: number;
  };
  
  /** Statistical confidence indicators */
  confidence: {
    has_sufficient_data: boolean; // true if both versions have 100+ plays
    recommended_version: 'A' | 'B' | null; // null if no clear winner
    confidence_level: number; // 0-100 percentage
  };
}

/**
 * Platform Benchmark Schema
 * 
 * Platform-wide aggregate statistics for comparison.
 */
export interface PlatformBenchmark {
  /** Genre category for benchmark */
  genre: string;
  
  /** Date range for benchmark data */
  date_range_start: string;
  date_range_end: string;
  
  /** Average metrics across platform */
  averages: {
    play_count: number;
    completion_rate: number;
    engagement_rate: number;
    rpm: number;
  };
  
  /** Percentile thresholds */
  percentiles: {
    p10: { play_count: number; completion_rate: number; engagement_rate: number };
    p25: { play_count: number; completion_rate: number; engagement_rate: number };
    p50: { play_count: number; completion_rate: number; engagement_rate: number };
    p75: { play_count: number; completion_rate: number; engagement_rate: number };
    p90: { play_count: number; completion_rate: number; engagement_rate: number };
  };
  
  /** Total tracks in benchmark sample */
  sample_size: number;
}

/**
 * Analytics Export Job Schema
 * 
 * Tracks export request and download availability.
 */
export interface AnalyticsExport {
  /** Export job identifier */
  id: string;
  
  /** Creator who requested export */
  user_id: string;
  
  /** Track IDs included in export (null means all tracks) */
  track_ids: string[] | null;
  
  /** Export format */
  format: 'csv' | 'pdf' | 'json';
  
  /** Date range for export */
  date_range_start: string;
  date_range_end: string;
  
  /** Export job status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Download URL (null until completed) */
  download_url: string | null;
  
  /** File size in bytes (null until completed) */
  file_size: number | null;
  
  /** Expiration timestamp for download link (7 days after completion) */
  expires_at: string | null;
  
  /** Timestamp when export was requested */
  created_at: string;
  
  /** Timestamp when export completed/failed */
  completed_at: string | null;
  
  /** Error message if status is 'failed' */
  error_message: string | null;
}

/**
 * Notification Preference Schema
 * 
 * User settings for analytics notifications.
 */
export interface NotificationPreference {
  /** User identifier */
  user_id: string;
  
  /** Enable milestone notifications (1K, 10K, 100K, 1M plays) */
  milestones_enabled: boolean;
  
  /** Enable trending notifications (5x engagement spike) */
  trending_enabled: boolean;
  
  /** Enable chart/featured notifications */
  charts_enabled: boolean;
  
  /** Last updated timestamp */
  updated_at: string;
}

/**
 * API Response Wrapper
 * 
 * Standard response format for all analytics API endpoints.
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  
  /** Response metadata */
  meta: {
    /** Request timestamp */
    timestamp: string;
    
    /** API version */
    version: string;
    
    /** Request ID for debugging */
    request_id: string;
  };
  
  /** Optional error information */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Paginated Response
 * 
 * Response format for paginated list endpoints.
 */
export interface PaginatedResponse<T> {
  /** List of items */
  items: T[];
  
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-based) */
    page: number;
    
    /** Items per page */
    per_page: number;
    
    /** Total item count */
    total_count: number;
    
    /** Total page count */
    total_pages: number;
    
    /** Has next page */
    has_next: boolean;
    
    /** Has previous page */
    has_previous: boolean;
  };
}

// Additional helper types

/** Date range filter options */
export type DateRange = '7d' | '30d' | '90d' | 'all';

/** Version filter options */
export type VersionFilter = 'all' | 'A' | 'B';

/** Trend data point for charts */
export interface TrendDataPoint {
  date: string;
  play_count: number;
  unique_listeners: number;
  completion_rate: number;
  engagement_rate: number;
}

/** API endpoint responses */
export type TrackAnalyticsResponse = ApiResponse<TrackAnalytics>;
export type TrendDataResponse = ApiResponse<TrendDataPoint[]>;
export type DemographicSummaryResponse = ApiResponse<DemographicSummary>;
export type RevenueSummaryResponse = ApiResponse<RevenueSummary>;
export type VersionComparisonResponse = ApiResponse<VersionComparison>;
export type BenchmarkResponse = ApiResponse<PlatformBenchmark>;
export type ExportJobResponse = ApiResponse<AnalyticsExport>;
export type ExportStatusResponse = ApiResponse<AnalyticsExport>;
