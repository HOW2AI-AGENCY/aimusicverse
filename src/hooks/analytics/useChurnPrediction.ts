/**
 * Churn Prediction Hook
 *
 * Calculates churn risk for users based on activity metrics.
 * Uses weighted scoring model based on:
 * - Days since last activity
 * - Generation frequency
 * - Session depth
 * - Engagement metrics (likes, shares, comments)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

export interface ChurnRiskUser {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  telegram_id: number | null;

  // Activity metrics
  days_since_last_activity: number;
  total_generations: number;
  generations_last_7d: number;
  generations_last_30d: number;
  total_sessions: number;
  avg_session_depth: number;

  // Engagement metrics
  total_likes_given: number;
  total_likes_received: number;
  total_comments: number;
  total_shares: number;

  // Balance
  current_balance: number;

  // Calculated scores
  churn_score: number; // 0-100, higher = more likely to churn
  risk_level: "low" | "medium" | "high" | "critical";
  risk_factors: string[];
}

interface ChurnPredictionOptions {
  enabled?: boolean;
  limit?: number;
  minRiskLevel?: "low" | "medium" | "high" | "critical";
}

// Risk thresholds
const RISK_THRESHOLDS = {
  critical: 80,
  high: 60,
  medium: 40,
  low: 0,
};

// Weight factors for churn calculation
const WEIGHTS = {
  inactivity: 0.35, // Days since last activity
  generation_trend: 0.25, // Decrease in generation frequency
  engagement: 0.2, // Likes, comments, shares
  balance: 0.1, // Low balance = higher risk
  session_depth: 0.1, // Shallow sessions = higher risk
};

function calculateChurnScore(metrics: {
  days_since_last_activity: number;
  generations_last_7d: number;
  generations_last_30d: number;
  avg_session_depth: number;
  total_likes_given: number;
  total_comments: number;
  current_balance: number;
}): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  // 1. Inactivity score (0-100)
  const inactivityScore = Math.min(100, metrics.days_since_last_activity * 5);
  score += inactivityScore * WEIGHTS.inactivity;

  if (metrics.days_since_last_activity > 14) {
    factors.push(`Неактивен ${metrics.days_since_last_activity} дней`);
  }

  // 2. Generation trend (comparing 7d vs 30d rate)
  const weeklyRate = metrics.generations_last_7d;
  const monthlyRate = metrics.generations_last_30d / 4; // Normalize to weekly
  const trendScore =
    monthlyRate > 0 ? Math.max(0, (1 - weeklyRate / monthlyRate) * 100) : metrics.generations_last_7d === 0 ? 80 : 0;
  score += trendScore * WEIGHTS.generation_trend;

  if (metrics.generations_last_7d === 0 && metrics.generations_last_30d > 0) {
    factors.push("Не генерирует последнюю неделю");
  }

  // 3. Engagement score (inverted - low engagement = high risk)
  const engagementTotal = metrics.total_likes_given + metrics.total_comments;
  const engagementScore = Math.max(0, 100 - engagementTotal * 5);
  score += engagementScore * WEIGHTS.engagement;

  if (engagementTotal === 0) {
    factors.push("Нулевое вовлечение");
  }

  // 4. Balance risk
  const balanceScore =
    metrics.current_balance <= 0 ? 100 : metrics.current_balance <= 5 ? 70 : metrics.current_balance <= 10 ? 40 : 0;
  score += balanceScore * WEIGHTS.balance;

  if (metrics.current_balance <= 0) {
    factors.push("Нулевой баланс");
  } else if (metrics.current_balance <= 5) {
    factors.push("Низкий баланс");
  }

  // 5. Session depth (shallow sessions = higher risk)
  const depthScore = Math.max(0, 100 - metrics.avg_session_depth * 20);
  score += depthScore * WEIGHTS.session_depth;

  if (metrics.avg_session_depth < 2) {
    factors.push("Мелкие сессии");
  }

  return { score: Math.min(100, Math.round(score)), factors };
}

function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= RISK_THRESHOLDS.critical) return "critical";
  if (score >= RISK_THRESHOLDS.high) return "high";
  if (score >= RISK_THRESHOLDS.medium) return "medium";
  return "low";
}

export function useChurnPrediction({
  enabled = true,
  limit = 50,
  minRiskLevel = "medium",
}: ChurnPredictionOptions = {}) {
  // Fetch user activity data
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["churn-prediction", limit],
    queryFn: async () => {
      // Get users with their activity metrics
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          username,
          photo_url,
          telegram_id,
          updated_at
        `,
        )
        .order("updated_at", { ascending: false })
        .limit(500);

      if (profilesError) throw profilesError;

      // Get user credits
      const { data: credits, error: creditsError } = await supabase.from("user_credits").select("user_id, balance");

      if (creditsError) throw creditsError;

      // Get generation counts per user (last 7d and 30d)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: generations7d, error: gen7dError } = await supabase
        .from("generation_tasks")
        .select("user_id")
        .gte("created_at", sevenDaysAgo)
        .eq("status", "completed");

      if (gen7dError) throw gen7dError;

      const { data: generations30d, error: gen30dError } = await supabase
        .from("generation_tasks")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo)
        .eq("status", "completed");

      if (gen30dError) throw gen30dError;

      // Get likes given by users
      const { data: likesGiven, error: likesError } = await supabase.from("track_likes").select("user_id");

      if (likesError) throw likesError;

      // Get comments by users
      const { data: comments, error: commentsError } = await supabase.from("comments").select("user_id");

      if (commentsError) throw commentsError;

      // Get session data from analytics
      const { data: sessions, error: sessionsError } = await supabase
        .from("user_analytics_events")
        .select("user_id, session_id")
        .not("user_id", "is", null)
        .gte("created_at", thirtyDaysAgo);

      if (sessionsError) throw sessionsError;

      // Aggregate data
      const creditsMap = new Map(credits?.map((c) => [c.user_id, c.balance]) || []);

      const gen7dCounts = new Map<string, number>();
      generations7d?.forEach((g) => {
        gen7dCounts.set(g.user_id, (gen7dCounts.get(g.user_id) || 0) + 1);
      });

      const gen30dCounts = new Map<string, number>();
      generations30d?.forEach((g) => {
        gen30dCounts.set(g.user_id, (gen30dCounts.get(g.user_id) || 0) + 1);
      });

      const likesMap = new Map<string, number>();
      likesGiven?.forEach((l) => {
        likesMap.set(l.user_id, (likesMap.get(l.user_id) || 0) + 1);
      });

      const commentsMap = new Map<string, number>();
      comments?.forEach((c) => {
        commentsMap.set(c.user_id, (commentsMap.get(c.user_id) || 0) + 1);
      });

      // Session depth calculation
      const sessionsByUser = new Map<string, Set<string>>();
      sessions?.forEach((s) => {
        if (!s.user_id) return;
        if (!sessionsByUser.has(s.user_id)) {
          sessionsByUser.set(s.user_id, new Set());
        }
        if (s.session_id) {
          sessionsByUser.get(s.user_id)!.add(s.session_id);
        }
      });

      return (
        profiles?.map((p) => {
          const daysSinceLastActivity = Math.floor(
            (now.getTime() - new Date(p.updated_at || now).getTime()) / (1000 * 60 * 60 * 24),
          );

          return {
            user_id: p.user_id,
            username: p.username,
            avatar_url: p.photo_url,
            telegram_id: p.telegram_id,
            days_since_last_activity: daysSinceLastActivity,
            generations_last_7d: gen7dCounts.get(p.user_id) || 0,
            generations_last_30d: gen30dCounts.get(p.user_id) || 0,
            total_likes_given: likesMap.get(p.user_id) || 0,
            total_comments: commentsMap.get(p.user_id) || 0,
            current_balance: creditsMap.get(p.user_id) || 0,
            total_sessions: sessionsByUser.get(p.user_id)?.size || 0,
            avg_session_depth: sessionsByUser.get(p.user_id)?.size
              ? (sessions?.filter((s) => s.user_id === p.user_id).length || 0) / sessionsByUser.get(p.user_id)!.size
              : 0,
          };
        }) || []
      );
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate churn scores
  const churnRiskUsers = useMemo(() => {
    if (!rawData) return [];

    const minScore = RISK_THRESHOLDS[minRiskLevel];

    return rawData
      .map((user) => {
        const { score, factors } = calculateChurnScore({
          days_since_last_activity: user.days_since_last_activity,
          generations_last_7d: user.generations_last_7d,
          generations_last_30d: user.generations_last_30d,
          avg_session_depth: user.avg_session_depth,
          total_likes_given: user.total_likes_given,
          total_comments: user.total_comments,
          current_balance: user.current_balance,
        });

        return {
          ...user,
          total_generations: user.generations_last_30d,
          total_likes_received: 0, // Would need separate query
          total_shares: 0, // Would need separate query
          churn_score: score,
          risk_level: getRiskLevel(score),
          risk_factors: factors,
        } as ChurnRiskUser;
      })
      .filter((user) => user.churn_score >= minScore)
      .sort((a, b) => b.churn_score - a.churn_score)
      .slice(0, limit);
  }, [rawData, limit, minRiskLevel]);

  // Summary statistics
  const summary = useMemo(() => {
    if (!churnRiskUsers.length) return null;

    const byRisk = {
      critical: churnRiskUsers.filter((u) => u.risk_level === "critical").length,
      high: churnRiskUsers.filter((u) => u.risk_level === "high").length,
      medium: churnRiskUsers.filter((u) => u.risk_level === "medium").length,
      low: churnRiskUsers.filter((u) => u.risk_level === "low").length,
    };

    const avgScore = churnRiskUsers.reduce((sum, u) => sum + u.churn_score, 0) / churnRiskUsers.length;

    return {
      total: churnRiskUsers.length,
      byRisk,
      avgScore: Math.round(avgScore),
    };
  }, [churnRiskUsers]);

  return {
    users: churnRiskUsers,
    summary,
    isLoading,
    error,
    refetch,
  };
}

export type { ChurnPredictionOptions };
