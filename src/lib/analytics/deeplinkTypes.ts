/**
 * Deeplink tracker types and constants
 * Extracted from deeplink-tracker.ts — Sprint 051 T056
 */

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface DeeplinkContext {
  type: string;
  value?: string;
  source: DeeplinkSource;
  utmParams?: UTMParams;
  referrer?: string;
  landingPath?: string;
  experimentId?: string;
  variantId?: string;
  referralCode?: string;
  isFirstVisit: boolean;
  deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
  platform: string;
  userAgent: string;
  language: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  isTouchDevice: boolean;
}

export type DeeplinkSource =
  | "telegram_miniapp"
  | "telegram_bot"
  | "telegram_channel"
  | "web_share"
  | "qr_code"
  | "email"
  | "push_notification"
  | "social_media"
  | "referral"
  | "organic"
  | "unknown";

export interface ConversionEvent {
  sessionId: string;
  stage: ConversionStage;
  metadata?: Record<string, unknown>;
}

export type ConversionStage =
  "visit" | "engaged" | "registered" | "first_action" | "generation" | "completed" | "payment" | "retained";

export interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  assignedAt: string;
}

export interface DeeplinkAnalyticsSummary {
  totalVisits: number;
  uniqueUsers: number;
  conversionsByStage: Record<ConversionStage, number>;
  topSources: Array<{ source: string; count: number; conversion_rate: number }>;
  topCampaigns: Array<{ campaign: string; count: number; conversion_rate: number }>;
  hourlyDistribution: Record<number, number>;
  dailyTrend: Array<{ date: string; visits: number; conversions: number }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
}

export interface InitializeOptions {
  botUsername?: string;
  trackPageViews?: boolean;
  autoAssignExperiments?: boolean;
  startParam?: string;
  referrer?: string;
  isTelegram?: boolean;
  telegramId?: number | string;
  pathname?: string;
  search?: string;
}

export interface DeeplinkBuildOptions {
  startapp?: string;
  startappArgument?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmParams?: UTMParams;
  referralCode?: string;
  experimentId?: string;
  variantId?: string;
}

export const STORAGE_KEYS = {
  SESSION_ID: "deeplink_session_id",
  PERSISTENT_SESSION_ID: "deeplink_persistent_session_id",
  FIRST_VISIT: "deeplink_first_visit",
  LAST_DEEPLINK: "deeplink_last_type",
  CONVERSION_STAGES: "deeplink_conversion_stages",
  PERSISTENT_CONVERSION_STAGES: "deeplink_persistent_stages",
  REFERRAL_CHAIN: "deeplink_referral_chain",
  EXPERIMENT_ASSIGNMENTS: "deeplink_experiments",
} as const;
