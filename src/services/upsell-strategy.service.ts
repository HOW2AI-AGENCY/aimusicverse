/**
 * Upsell Strategy Service - Throttles monetization touchpoints
 * Prevents overwhelming users with multiple upsells in short sessions
 */

import { logger } from "@/lib/logger";

type UpsellType = "banner" | "paywall" | "badge";

const STORAGE_KEY = "upsell_impressions";
const PAYWALL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_BANNER_PER_SESSION = 1;

interface UpsellImpressions {
  banner: number;
  paywall: number;
  badge: number;
  lastPaywallAt: number | null;
}

function getImpressions(): UpsellImpressions {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    logger.warn("Failed to parse upsell impressions from sessionStorage");
  }
  return { banner: 0, paywall: 0, badge: 0, lastPaywallAt: null };
}

function saveImpressions(impressions: UpsellImpressions): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(impressions));
  } catch {
    logger.warn("Failed to save upsell impressions to sessionStorage");
  }
}

/**
 * Check if an upsell of the given type can be shown
 */
export function canShowUpsell(type: UpsellType): boolean {
  const impressions = getImpressions();

  switch (type) {
    case "banner":
      return impressions.banner < MAX_BANNER_PER_SESSION;

    case "paywall": {
      if (impressions.lastPaywallAt === null) return true;
      const elapsed = Date.now() - impressions.lastPaywallAt;
      return elapsed >= PAYWALL_COOLDOWN_MS;
    }

    case "badge":
      // Badges are lightweight inline indicators — no throttle
      return true;

    default:
      return true;
  }
}

/**
 * Record that an upsell was shown
 */
export function recordUpsellShown(type: UpsellType): void {
  const impressions = getImpressions();
  impressions[type] += 1;

  if (type === "paywall") {
    impressions.lastPaywallAt = Date.now();
  }

  saveImpressions(impressions);
  logger.info("Upsell impression recorded", { type, total: impressions[type] });
}
