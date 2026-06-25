/**
 * UnifiedAnalysisCard - Unified display for audio analysis results
 * Works with both legacy AudioAnalysis and new UnifiedAnalysisResult
 */

import { memo } from "react";
import { motion } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Gauge, Key, Heart, Zap, Activity, Mic2, Guitar, Drum, Piano, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { UnifiedAnalysisResult } from "@/services/unified-analysis/types";

interface UnifiedAnalysisCardProps {
  analysis: UnifiedAnalysisResult | null;
  isLoading?: boolean;
  compact?: boolean;
  className?: string;
}

// Instrument icon mapping
const instrumentIcons: Record<string, React.ReactNode> = {
  vocals: <Mic2 className="w-3 h-3" />,
  voice: <Mic2 className="w-3 h-3" />,
  guitar: <Guitar className="w-3 h-3" />,
  drums: <Drum className="w-3 h-3" />,
  piano: <Piano className="w-3 h-3" />,
  keys: <Piano className="w-3 h-3" />,
  keyboard: <Piano className="w-3 h-3" />,
};

function getInstrumentIcon(instrument: string): React.ReactNode {
  const lower = instrument.toLowerCase();
  for (const [key, icon] of Object.entries(instrumentIcons)) {
    if (lower.includes(key)) return icon;
  }
  return <Music className="w-3 h-3" />;
}

export const UnifiedAnalysisCard = memo(function UnifiedAnalysisCard({
  analysis,
  isLoading,
  compact = false,
  className,
}: UnifiedAnalysisCardProps) {
  if (isLoading) {
    return <AnalysisCardSkeleton compact={compact} className={className} />;
  }

  if (!analysis) {
    return (
      <Card className={cn("bg-card/50 border-dashed", className)}>
        <CardContent className="py-8 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Анализ не выполнен</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card
        className={cn(
          "bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm",
          "border-border/50 overflow-hidden",
          className,
        )}
      >
        <CardHeader className={cn("pb-2", compact && "py-3")}>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Анализ аудио
            {analysis.provider && (
              <Badge variant="outline" className="text-[10px] ml-auto">
                {analysis.provider}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className={cn("space-y-4", compact && "pb-3")}>
          {/* Primary Stats Grid */}
          <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
            {/* BPM */}
            {analysis.bpm && (
              <StatItem
                icon={<Gauge className="w-4 h-4 text-orange-500" />}
                label="BPM"
                value={Math.round(analysis.bpm)}
                compact={compact}
              />
            )}

            {/* Key */}
            {analysis.key && (
              <StatItem
                icon={<Key className="w-4 h-4 text-blue-500" />}
                label="Тональность"
                value={analysis.key}
                subValue={analysis.scale}
                compact={compact}
              />
            )}

            {/* Time Signature */}
            {analysis.timeSignature && (
              <StatItem
                icon={<Music className="w-4 h-4 text-purple-500" />}
                label="Размер"
                value={analysis.timeSignature}
                compact={compact}
              />
            )}
          </div>

          {/* Genre & Mood */}
          {(analysis.genre || analysis.mood) && (
            <div className="flex flex-wrap gap-2">
              {analysis.genre && (
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  {analysis.genre}
                </Badge>
              )}
              {analysis.mood && (
                <Badge variant="secondary" className="bg-pink-500/10 text-pink-400 border-pink-500/20">
                  {analysis.mood}
                </Badge>
              )}
              {analysis.subgenres?.map((subgenre, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {subgenre}
                </Badge>
              ))}
            </div>
          )}

          {/* Energy Metrics */}
          {(analysis.arousal !== undefined || analysis.valence !== undefined) && !compact && (
            <div className="space-y-2">
              {analysis.arousal !== undefined && (
                <EnergyBar
                  icon={<Zap className="w-3.5 h-3.5 text-yellow-500" />}
                  label="Энергия"
                  value={analysis.arousal}
                  color="yellow"
                />
              )}
              {analysis.valence !== undefined && (
                <EnergyBar
                  icon={<Heart className="w-3.5 h-3.5 text-pink-500" />}
                  label="Позитив"
                  value={analysis.valence}
                  color="pink"
                />
              )}
            </div>
          )}

          {/* Instruments */}
          {analysis.instruments && analysis.instruments.length > 0 && !compact && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Инструменты</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.instruments.map((instrument, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1 bg-background/50">
                    {getInstrumentIcon(instrument)}
                    {instrument}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Style Description */}
          {analysis.styleDescription && !compact && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Описание стиля</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{analysis.styleDescription}</p>
            </div>
          )}

          {/* Style Tags */}
          {analysis.styleTags && analysis.styleTags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1">
              {analysis.styleTags.slice(0, 6).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

// Stat Item Component
interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  compact?: boolean;
}

function StatItem({ icon, label, value, subValue, compact }: StatItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg",
        "bg-background/50 border border-border/30",
        compact && "p-1.5",
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className={cn("font-semibold truncate", compact ? "text-xs" : "text-sm")}>{value}</p>
        {!compact && <p className="text-[10px] text-muted-foreground truncate">{subValue || label}</p>}
      </div>
    </div>
  );
}

// Energy Bar Component
interface EnergyBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "yellow" | "pink" | "green" | "blue";
}

function EnergyBar({ icon, label, value, color }: EnergyBarProps) {
  const colorClasses = {
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground w-14">{label}</span>
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right">{Math.round(value)}%</span>
    </div>
  );
}

// Skeleton
function AnalysisCardSkeleton({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <Card className={cn("bg-card/50", className)}>
      <CardHeader className={cn("pb-2", compact && "py-3")}>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        {!compact && (
          <>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default UnifiedAnalysisCard;
