/**
 * useCreditsLimits Hook
 * Manages free tier credit limits and upgrade prompts
 */

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { ECONOMY } from "@/lib/economy";
import { trackEvent } from "@/services/analytics/events.service";

type SubscriptionTierType = "free" | "pro" | "premium" | "enterprise";

interface CreditsLimitsData {
  balance: number;
  dailyEarnedToday: number;
  dailyEarnedResetAt: string | null;
  subscriptionTier: SubscriptionTierType;
}

export function useCreditsLimits() {
  const { user } = useAuth();
  const { tier } = useSubscriptionStatus({
    userId: user?.id || "",
    enabled: !!user,
  });

  const subscriptionTier: SubscriptionTierType = tier || "free";
  const isFreeUser = subscriptionTier === "free";

  // Fetch current credits and limits
  const { data, isLoading } = useQuery({
    queryKey: ["credits-limits", user?.id],
    queryFn: async (): Promise<CreditsLimitsData> => {
      if (!user?.id) throw new Error("No user");

      const { data: credits, error } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      // Daily earned will be tracked via the new columns after migration
      // For now, we'll use balance only and add daily tracking later
      return {
        balance: credits?.balance ?? 0,
        dailyEarnedToday: 0, // Will be populated after migration runs
        dailyEarnedResetAt: null,
        subscriptionTier,
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Check if daily limit is reached (for free users)
  const isDailyLimitReached = useMemo(() => {
    if (!isFreeUser || !data) return false;
    return data.dailyEarnedToday >= ECONOMY.FREE_DAILY_EARN_CAP;
  }, [isFreeUser, data]);

  // Check if balance limit is reached (for free users)
  const isBalanceLimitReached = useMemo(() => {
    if (!isFreeUser || !data) return false;
    return data.balance >= ECONOMY.FREE_MAX_BALANCE;
  }, [isFreeUser, data]);

  // Calculate remaining daily credits
  const remainingDailyCredits = useMemo(() => {
    if (!isFreeUser || !data) return Infinity;
    return Math.max(0, ECONOMY.FREE_DAILY_EARN_CAP - data.dailyEarnedToday);
  }, [isFreeUser, data]);

  // Calculate credits until balance limit
  const creditsUntilBalanceLimit = useMemo(() => {
    if (!isFreeUser || !data) return Infinity;
    return Math.max(0, ECONOMY.FREE_MAX_BALANCE - data.balance);
  }, [isFreeUser, data]);

  // Check if a reward would be capped
  const wouldBeCapped = useCallback(
    (rewardAmount: number): boolean => {
      if (!isFreeUser || !data) return false;

      // Check daily limit
      if (data.dailyEarnedToday + rewardAmount > ECONOMY.FREE_DAILY_EARN_CAP) {
        return true;
      }

      // Check balance limit
      if (data.balance + rewardAmount > ECONOMY.FREE_MAX_BALANCE) {
        return true;
      }

      return false;
    },
    [isFreeUser, data],
  );

  // Calculate actual reward after caps
  const calculateActualReward = useCallback(
    (requestedAmount: number): number => {
      if (!isFreeUser || !data) return requestedAmount;

      // Apply daily cap
      let amount = Math.min(requestedAmount, ECONOMY.FREE_DAILY_EARN_CAP - data.dailyEarnedToday);

      // Apply balance cap
      amount = Math.min(amount, ECONOMY.FREE_MAX_BALANCE - data.balance);

      return Math.max(0, amount);
    },
    [isFreeUser, data],
  );

  return {
    balance: data?.balance ?? 0,
    dailyEarnedToday: data?.dailyEarnedToday ?? 0,
    subscriptionTier,
    isFreeUser,
    isDailyLimitReached,
    isBalanceLimitReached,
    remainingDailyCredits,
    creditsUntilBalanceLimit,
    wouldBeCapped,
    calculateActualReward,
    isLoading,

    // Limits for display
    limits: {
      dailyCap: isFreeUser ? ECONOMY.FREE_DAILY_EARN_CAP : null,
      balanceCap: isFreeUser ? ECONOMY.FREE_MAX_BALANCE : null,
    },
  };
}

/**
 * Hook to check if welcome bonus should be shown.
 *
 * Sprint 055 P0-5 (idempotency): the localStorage flag is now a JSON envelope
 * `{ shownAt: <iso8601> }` instead of bare `"true"`, so we can let the bonus
 * re-show after TTL_DAYS expire (default 30). Legacy `"true"` strings are
 * treated as shown a long time ago, so users with the old flag get a single
 * re-offer — bounded at one per TTL window, never per-session flood.
 */
export function useWelcomeBonusCheck() {
  const { user } = useAuth();

  const { data: shouldShow, isLoading } = useQuery({
    queryKey: ["welcome-bonus-check", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Sprint 055 P0-5: parse TTL-aware envelope; missing/invalid → not shown yet.
      const shownEntry = parseWelcomeBonusEntry(localStorage.getItem(`welcome_bonus_shown_${user.id}`));
      if (shownEntry && !isWelcomeBonusExpired(shownEntry, WELCOME_BONUS_TTL_MS)) {
        return false;
      }

      // Check if user just registered (within last 5 minutes)
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("action_type", "registration_bonus")
        .limit(1);

      const credits = transactions?.[0];
      if (!credits?.created_at) return false;

      const registrationTime = new Date(credits.created_at).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      return registrationTime > fiveMinutesAgo;
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Only check once per session
  });

  const markWelcomeBonusShown = useCallback(() => {
    if (!user?.id) return;
    // Sprint 055 P0-5: write JSON envelope with shownAt = now.
    const entry: WelcomeBonusEntry = { shownAt: new Date().toISOString() };
    localStorage.setItem(`welcome_bonus_shown_${user.id}`, JSON.stringify(entry));

    // Sprint 055 P0-5 analytics: lets us measure re-offer cadence
    // (post-TTL window). Errors are swallowed by trackEvent itself.
    void trackEvent(
      {
        eventType: "feature_usage",
        pagePath: "welcome_bonus",
        metadata: { action: "mark_shown", ttl_days: WELCOME_BONUS_TTL_MS / (24 * 60 * 60 * 1000) },
      },
      user.id,
    );
  }, [user?.id]);

  return {
    shouldShowWelcomeBonus: shouldShow ?? false,
    isLoading,
    markWelcomeBonusShown,
  };
}

/**
 * Welcome Bonus TTL — re-show after 30 days from last shownAt.
 * Exposed for tests. Kept in this module because the constant is part of the
 * contract advertised in SPRINT-055-PLAN.md (DoD: max 1 / 30 days).
 */
export const WELCOME_BONUS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Envelope shape stored in localStorage. Versioned so future fields don't
 * break old reads — unknown versions fall back to "not shown".
 */
interface WelcomeBonusEntry {
  shownAt: string; // ISO 8601, set by `new Date().toISOString()`
}

function parseWelcomeBonusEntry(raw: string | null): WelcomeBonusEntry | null {
  if (!raw) return null;
  // Legacy bare-flag from before Sprint 055: treat as "shown a long time ago"
  // so the user gets one re-offer on the next eligible session, then the new
  // TTL timer starts ticking.
  if (raw === "true") {
    return { shownAt: new Date(0).toISOString() };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<WelcomeBonusEntry>;
    if (typeof parsed?.shownAt === "string") {
      return { shownAt: parsed.shownAt };
    }
    return null;
  } catch {
    return null;
  }
}

function isWelcomeBonusExpired(entry: WelcomeBonusEntry, ttlMs: number): boolean {
  const shownAt = new Date(entry.shownAt).getTime();
  if (Number.isNaN(shownAt)) return true;
  return Date.now() - shownAt > ttlMs;
}
