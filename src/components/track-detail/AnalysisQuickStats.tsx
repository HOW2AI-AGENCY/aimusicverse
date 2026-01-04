import { AudioAnalysis } from '@/hooks/useAudioAnalysis';
import { Card } from '@/components/ui/card';
import { Activity, Music, Key, Gauge, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisQuickStatsProps {
  analysis: AudioAnalysis;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
  color: string;
  subValue?: string;
}

function StatCard({ icon, label, value, color, subValue }: StatCardProps) {
  if (!value) return null;
  
  return (
    <Card className={cn(
      "p-4 border-2 bg-gradient-to-br transition-all hover:scale-[1.02]",
      color
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background/50 backdrop-blur-sm">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-lg font-bold truncate">{value}</p>
          {subValue && (
            <p className="text-xs text-muted-foreground">{subValue}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function AnalysisQuickStats({ analysis }: AnalysisQuickStatsProps) {
  const stats = [
    {
      icon: <Gauge className="w-5 h-5 text-orange-500" />,
      label: 'BPM',
      value: analysis.bpm ? Math.round(analysis.bpm) : analysis.tempo,
      color: 'border-orange-500/30 from-orange-500/5 to-orange-500/10',
      subValue: analysis.bpm && analysis.tempo ? analysis.tempo : undefined,
    },
    {
      icon: <Key className="w-5 h-5 text-blue-500" />,
      label: 'Тональность',
      value: analysis.key_signature,
      color: 'border-blue-500/30 from-blue-500/5 to-blue-500/10',
    },
    {
      icon: <Music className="w-5 h-5 text-purple-500" />,
      label: 'Жанр',
      value: analysis.genre,
      color: 'border-purple-500/30 from-purple-500/5 to-purple-500/10',
    },
    {
      icon: <Heart className="w-5 h-5 text-pink-500" />,
      label: 'Настроение',
      value: analysis.mood,
      color: 'border-pink-500/30 from-pink-500/5 to-pink-500/10',
    },
    {
      icon: <Activity className="w-5 h-5 text-green-500" />,
      label: 'Энергия',
      value: analysis.arousal !== null ? `${Math.round((analysis.arousal || 0) * 100)}%` : null,
      color: 'border-green-500/30 from-green-500/5 to-green-500/10',
      subValue: analysis.engagement || undefined,
    },
    {
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
      label: 'Позитив',
      value: analysis.valence !== null ? `${Math.round((analysis.valence || 0) * 100)}%` : null,
      color: 'border-yellow-500/30 from-yellow-500/5 to-yellow-500/10',
      subValue: analysis.approachability || undefined,
    },
  ].filter(stat => stat.value);

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
