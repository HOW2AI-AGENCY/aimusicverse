import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Play, Heart, Sparkles } from "@/lib/icons";

interface StatItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}

const statItems: StatItem[] = [
  { icon: Music, label: "Треков", value: 0, color: "text-info" },
  { icon: Play, label: "Прослушиваний", value: 0, color: "text-success" },
  { icon: Heart, label: "Лайков", value: 0, color: "text-error" },
  { icon: Sparkles, label: "Генераций", value: 0, color: "text-accent" },
];

interface ProfileStatsProps {
  totalTracks?: number;
  totalPlays?: number;
  totalLikes?: number;
  generationsThisMonth?: number;
  isLoading?: boolean;
}

export function ProfileStats({ totalTracks, totalPlays, totalLikes, generationsThisMonth, isLoading }: ProfileStatsProps) {
  const values = [totalTracks ?? 0, totalPlays ?? 0, totalLikes ?? 0, generationsThisMonth ?? 0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4"
      data-safe-skeleton={isLoading ? "" : undefined}
    >
      {statItems.map((stat, i) => (
        <Card
          key={stat.label}
          className="p-4 lg:p-5 glass-card border-border/50 transition-all hover:shadow-md hover:scale-[1.02]"
        >
          {isLoading ? (
            <Skeleton className="h-12 lg:h-16 w-full" />
          ) : (
            <div className="text-center">
              <stat.icon className={`w-5 h-5 lg:w-6 lg:h-6 mx-auto mb-1 lg:mb-2 ${stat.color}`} />
              <p className="text-2xl lg:text-3xl font-bold">{values[i].toLocaleString()}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
            </div>
          )}
        </Card>
      ))}
    </motion.div>
  );
}
