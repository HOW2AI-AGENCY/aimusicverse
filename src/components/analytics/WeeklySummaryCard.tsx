/**
 * Weekly Summary Card
 * Compact weekly stats card for homepage
 * Uses unified glassmorphism and design tokens
 */

import { memo } from "react";
import { Music, Heart, Play, TrendingUp, TrendingDown, Minus } from "@/lib/icons";
import { motion } from "@/lib/motion";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ChangeIndicator = memo(function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center text-caption text-emerald-400">
        <TrendingUp className="w-3 h-3 mr-0.5" />+{value}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center text-caption text-destructive">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {value}
      </span>
    );
  }
  return (
    <span className="flex items-center text-caption text-muted-foreground">
      <Minus className="w-3 h-3 mr-0.5" />0
    </span>
  );
});

export const WeeklySummaryCard = memo(function WeeklySummaryCard() {
  const { data, isLoading } = useAnalyticsData();
  const summary = data?.weeklySummary;

  if (isLoading) {
    return (
      <Card variant="glass">
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      icon: Music,
      label: "Треков",
      value: summary.tracks,
      change: summary.tracksChange,
      color: "text-primary",
      bg: "bg-primary/15",
    },
    {
      icon: Heart,
      label: "Лайков",
      value: summary.likes,
      change: summary.likesChange,
      color: "text-rose-400",
      bg: "bg-rose-500/15",
    },
    {
      icon: Play,
      label: "Прослушиваний",
      value: summary.plays,
      change: summary.playsChange,
      color: "text-emerald-400",
      bg: "bg-emerald-500/15",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card variant="glass" hoverLift>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-body-sm font-semibold text-foreground">За эту неделю</h3>
          <span className="text-caption text-muted-foreground">vs прошлая неделя</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={cn("w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              <p className="text-caption text-muted-foreground mb-1">{stat.label}</p>
              <ChangeIndicator value={stat.change} />
            </div>
          ))}
        </div>

        {data?.topTrack && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-caption text-muted-foreground mb-1">Топ трек</p>
            <p className="text-body-sm font-medium truncate">{data.topTrack.title}</p>
            <p className="text-caption text-muted-foreground tabular-nums">
              {data.topTrack.plays} прослушиваний • {data.topTrack.likes} лайков
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
});
