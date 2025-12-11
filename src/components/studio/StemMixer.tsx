import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useTrackStems } from '@/hooks/useTrackStems';

/**
 * StemMixer - Simple stem mixing controls
 */

interface StemMixerProps {
  trackId: string;
  className?: string;
}

const stemColors: Record<string, string> = {
  vocals: 'bg-pink-500',
  instrumental: 'bg-blue-500',
  bass: 'bg-purple-500',
  drums: 'bg-orange-500',
  guitar: 'bg-green-500',
  piano: 'bg-cyan-500',
  other: 'bg-gray-500',
};

const stemLabels: Record<string, string> = {
  vocals: 'Вокал',
  instrumental: 'Инструментал',
  bass: 'Бас',
  drums: 'Ударные',
  guitar: 'Гитара',
  piano: 'Фортепиано',
  other: 'Другое',
};

export function StemMixer({ trackId, className }: StemMixerProps) {
  const { data: stems } = useTrackStems(trackId);
  const [stemStates, setStemStates] = useState<Record<string, { volume: number; muted: boolean; solo: boolean }>>({});

  const getStemState = (stemType: string) => {
    return stemStates[stemType] || { volume: 0.8, muted: false, solo: false };
  };

  const updateStemState = (stemType: string, updates: Partial<{ volume: number; muted: boolean; solo: boolean }>) => {
    setStemStates(prev => ({
      ...prev,
      [stemType]: { ...getStemState(stemType), ...updates }
    }));
  };

  if (!stems || stems.length === 0) {
    return null;
  }

  return (
    <div className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Микшер стемов</h3>
        <span className="text-xs text-muted-foreground">{stems.length} дорожек</span>
      </div>

      <div className="space-y-3">
        {stems.map((stem, index) => {
          const state = getStemState(stem.stem_type);
          const color = stemColors[stem.stem_type] || stemColors.other;
          const label = stemLabels[stem.stem_type] || stem.stem_type;

          return (
            <motion.div
              key={stem.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl",
                "bg-card border border-border/50",
                state.muted && "opacity-50"
              )}
            >
              {/* Color indicator */}
              <div className={cn("w-1 h-10 rounded-full", color)} />

              {/* Stem name */}
              <div className="w-24 shrink-0">
                <p className="text-sm font-medium truncate">{label}</p>
              </div>

              {/* Volume slider */}
              <div className="flex-1">
                <Slider
                  value={[state.muted ? 0 : state.volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={(v) => updateStemState(stem.stem_type, { volume: v[0] })}
                  disabled={state.muted}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant={state.muted ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => updateStemState(stem.stem_type, { muted: !state.muted })}
                >
                  {state.muted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  variant={state.solo ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full",
                    state.solo && "bg-amber-500 hover:bg-amber-600"
                  )}
                  onClick={() => updateStemState(stem.stem_type, { solo: !state.solo })}
                >
                  <Headphones className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
