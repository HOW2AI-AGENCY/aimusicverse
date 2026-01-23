import { Card } from '@/components/ui/card';
import { AudioAnalysis } from '@/hooks/useAudioAnalysis';
import { Activity, TrendingUp } from 'lucide-react';
import { emotionalColors } from '@/lib/design-colors';

interface EmotionalMapProps {
  analysis: AudioAnalysis;
}

export function EmotionalMap({ analysis }: EmotionalMapProps) {
  const arousal = analysis.arousal !== null ? analysis.arousal : 0.5;
  const valence = analysis.valence !== null ? analysis.valence : 0.5;

  // Convert to percentages
  const arousalPercent = Math.round(arousal * 100);
  const valencePercent = Math.round(valence * 100);

  // Calculate position on 2D map
  const xPos = valencePercent;
  const yPos = 100 - arousalPercent; // Invert Y axis so high arousal is at top

  // Determine quadrant and color using design tokens
  const getQuadrantInfo = () => {
    if (arousal >= 0.5 && valence >= 0.5) {
      return { label: 'Радостный', color: emotionalColors.happy.bg, textColor: emotionalColors.happy.text };
    }
    if (arousal >= 0.5 && valence < 0.5) {
      return { label: 'Напряжённый', color: emotionalColors.tense.bg, textColor: emotionalColors.tense.text };
    }
    if (arousal < 0.5 && valence >= 0.5) {
      return { label: 'Спокойный', color: emotionalColors.calm.bg, textColor: emotionalColors.calm.text };
    }
    return { label: 'Грустный', color: emotionalColors.sad.bg, textColor: emotionalColors.sad.text };
  };

  const quadrant = getQuadrantInfo();

  return (
    <Card className="p-6 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h4 className="text-sm font-semibold">Эмоциональная карта</h4>
        </div>

        {/* 2D Emotional Space */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border overflow-hidden">
          {/* Quadrant labels */}
          <div className="absolute top-2 left-2 text-xs text-muted-foreground opacity-50">
            Напряжённый
          </div>
          <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-50">
            Радостный
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-muted-foreground opacity-50">
            Грустный
          </div>
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground opacity-50">
            Спокойный
          </div>

          {/* Axis lines */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-full h-px bg-border/50" />
            <div className="absolute h-full w-px bg-border/50" />
          </div>

          {/* Axis labels */}
          <div className="absolute left-1/2 top-1 -translate-x-1/2 text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Энергия</span>
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
            Спокойствие
          </div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground -rotate-90">
            Негатив
          </div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground -rotate-90">
            Позитив
          </div>

          {/* Emotion point with glow effect */}
          <div
            className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full transition-all duration-300 shadow-lg"
            style={{
              left: `${xPos}%`,
              top: `${yPos}%`,
            }}
          >
            <div className={`absolute inset-0 ${quadrant.color} rounded-full animate-pulse opacity-60`} />
            <div className={`absolute inset-1 ${quadrant.color} rounded-full`} />
            <div className="absolute inset-2 bg-white rounded-full" />
          </div>

          {/* Gradient overlays for quadrants */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-red-500/5 to-transparent" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-green-500/5 to-transparent" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-purple-500/5 to-transparent" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-blue-500/5 to-transparent" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Энергия</div>
            <div className="text-2xl font-bold">{arousalPercent}%</div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${arousalPercent}%` }}
              />
            </div>
          </div>
          <div className="space-y-1 p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Позитивность</div>
            <div className="text-2xl font-bold">{valencePercent}%</div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${valencePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Emotion label */}
        <div className={`p-3 rounded-lg bg-muted/50 border-l-4 ${quadrant.color}`}>
          <div className="text-xs text-muted-foreground mb-1">Эмоциональное состояние</div>
          <div className={`text-lg font-semibold ${quadrant.textColor}`}>
            {quadrant.label}
          </div>
        </div>
      </div>
    </Card>
  );
}
