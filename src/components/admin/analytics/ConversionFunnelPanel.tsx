/**
 * Conversion Funnel Panel
 * Feature: 032-professional-ui (P3)
 *
 * Visualizes user conversion through key funnel stages:
 * Visit → Register → First Generation → Active User → Paid User
 *
 * @module ConversionFunnelPanel
 */

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchProfileCount } from "@/api/profiles.api";
import { fetchFunnelMetricsRaw } from "@/api/analytics.api";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, Music, Star, CreditCard } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface FunnelStage {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
}

interface ConversionFunnelPanelProps {
  timePeriod?: string;
  className?: string;
}

/**
 * Fetch funnel metrics from various tables
 */
async function fetchFunnelData() {
  // Get total users
  const totalUsers = await fetchProfileCount();

  // Get raw metrics via API layer
  const raw = await fetchFunnelMetricsRaw();

  // Count users with 3+ tracks
  const userTrackCounts: Record<string, number> = {};
  raw.perUserTrackCounts.forEach((t) => {
    userTrackCounts[t.user_id] = (userTrackCounts[t.user_id] || 0) + 1;
  });
  const activeUsers = Object.values(userTrackCounts).filter((c) => c >= 3).length;

  return {
    visits: raw.totalSessions,
    registered: totalUsers || 0,
    firstGeneration: raw.generatingUsers,
    activeUsers,
    paidUsers: raw.payingUsers,
  };
}

export const ConversionFunnelPanel = memo(function ConversionFunnelPanel({
  timePeriod,
  className,
}: ConversionFunnelPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["conversion-funnel", timePeriod],
    queryFn: fetchFunnelData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const stages: FunnelStage[] = useMemo(() => {
    if (!data) return [];

    return [
      {
        id: "visits",
        label: "Визиты",
        icon: Users,
        count: data.visits,
        color: "bg-blue-500",
      },
      {
        id: "registered",
        label: "Регистрации",
        icon: Users,
        count: data.registered,
        color: "bg-cyan-500",
      },
      {
        id: "first-gen",
        label: "Первая генерация",
        icon: Music,
        count: data.firstGeneration,
        color: "bg-green-500",
      },
      {
        id: "active",
        label: "Активные (3+ треков)",
        icon: Star,
        count: data.activeUsers,
        color: "bg-yellow-500",
      },
      {
        id: "paid",
        label: "Платящие",
        icon: CreditCard,
        count: data.paidUsers,
        color: "bg-purple-500",
      },
    ];
  }, [data]);

  // Calculate conversion rates
  const conversionRates = useMemo(() => {
    if (stages.length < 2) return [];

    return stages.slice(1).map((stage, index) => {
      const prevStage = stages[index];
      if (prevStage.count === 0) return 0;
      return (stage.count / prevStage.count) * 100;
    });
  }, [stages]);

  // Calculate max count for bar sizing
  const maxCount = useMemo(() => {
    return Math.max(...stages.map((s) => s.count), 1);
  }, [stages]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Воронка конверсии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Воронка конверсии
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const barWidth = (stage.count / maxCount) * 100;
          const conversionRate = index > 0 ? conversionRates[index - 1] : null;

          return (
            <div key={stage.id} className="space-y-1">
              {/* Conversion rate arrow */}
              {conversionRate !== null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-4">
                  <TrendingDown className="h-3 w-3" />
                  <span>{conversionRate.toFixed(1)}% конверсия</span>
                </div>
              )}

              {/* Stage bar */}
              <div className="relative">
                <div
                  className={cn("h-10 rounded-lg flex items-center gap-2 px-3 transition-all", stage.color)}
                  style={{ width: `${Math.max(barWidth, 20)}%` }}
                >
                  <Icon className="h-4 w-4 text-white flex-shrink-0" />
                  <span className="text-white font-medium text-sm truncate">{stage.label}</span>
                </div>

                {/* Count badge */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-background border rounded-md px-2 py-1">
                  <span className="font-bold text-sm">{stage.count.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Overall conversion */}
        {stages.length > 0 && stages[0].count > 0 && (
          <div className="pt-3 border-t mt-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Общая конверсия (визиты → оплата)</span>
              <span className="font-bold text-primary">
                {((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default ConversionFunnelPanel;
