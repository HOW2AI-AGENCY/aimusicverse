import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Music, Key, Gauge, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedAnalysisResult } from '@/services/unified-analysis/types';

// Support both legacy AudioAnalysis and new UnifiedAnalysisResult
interface LegacyAudioAnalysis {
  bpm?: number | null;
  tempo?: string | null;
  key_signature?: string | null;
  genre?: string | null;
  mood?: string | null;
  arousal?: number | null;
  valence?: number | null;
  engagement?: string | null;
  approachability?: string | null;
}

type AnalysisInput = LegacyAudioAnalysis | UnifiedAnalysisResult;

interface AnalysisQuickStatsProps {
  analysis: AnalysisInput;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  color: string;
  subValue?: string;
}

const StatCard = memo(function StatCard({ icon, label, value, color, subValue }: StatCardProps) {
  if (!value) return null;
  
  return (
    <Card className={cn(
      "p-3 sm:p-4 border bg-gradient-to-br transition-all hover:scale-[1.02]",
      color
    )}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 rounded-lg bg-background/50 backdrop-blur-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-base sm:text-lg font-bold truncate">{value}</p>
          {subValue && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </div>
    </Card>
  );
});

// Helper to normalize analysis data
function normalizeAnalysis(analysis: AnalysisInput) {
  // Check if it's a UnifiedAnalysisResult (has 'key' instead of 'key_signature')
  const isUnified = 'key' in analysis && !('key_signature' in analysis);
  
  if (isUnified) {
    const unified = analysis as UnifiedAnalysisResult;
    return {
      bpm: unified.bpm,
      tempo: undefined,
      key_signature: unified.key,
      genre: unified.genre,
      mood: unified.mood,
      arousal: unified.arousal,
      valence: unified.valence,
      engagement: undefined,
      approachability: undefined,
    };
  }
  
  return analysis as LegacyAudioAnalysis;
}

export const AnalysisQuickStats = memo(function AnalysisQuickStats({ analysis }: AnalysisQuickStatsProps) {
  const normalized = normalizeAnalysis(analysis);
  
  const stats = [
    {
      icon: <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />,
      label: 'BPM',
      value: normalized.bpm ? Math.round(normalized.bpm) : normalized.tempo,
      color: 'border-orange-500/30 from-orange-500/5 to-orange-500/10',
      subValue: normalized.bpm && normalized.tempo ? normalized.tempo : undefined,
    },
    {
      icon: <Key className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />,
      label: 'Тональность',
      value: normalized.key_signature,
      color: 'border-blue-500/30 from-blue-500/5 to-blue-500/10',
    },
    {
      icon: <Music className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />,
      label: 'Жанр',
      value: normalized.genre,
      color: 'border-purple-500/30 from-purple-500/5 to-purple-500/10',
    },
    {
      icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />,
      label: 'Настроение',
      value: normalized.mood,
      color: 'border-pink-500/30 from-pink-500/5 to-pink-500/10',
    },
    {
      icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />,
      label: 'Энергия',
      value: normalized.arousal !== null && normalized.arousal !== undefined 
        ? `${Math.round(normalized.arousal)}%` 
        : null,
      color: 'border-green-500/30 from-green-500/5 to-green-500/10',
      subValue: normalized.engagement || undefined,
    },
    {
      icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />,
      label: 'Позитив',
      value: normalized.valence !== null && normalized.valence !== undefined 
        ? `${Math.round(normalized.valence)}%` 
        : null,
      color: 'border-yellow-500/30 from-yellow-500/5 to-yellow-500/10',
      subValue: normalized.approachability || undefined,
    },
  ].filter(stat => stat.value);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
});

export default AnalysisQuickStats;
