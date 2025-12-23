/**
 * Provider selector component for generation form
 * Allows switching between Suno and Stability AI for cover/extend modes
 */

import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Music2, Waves, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GenerationProvider = 'suno' | 'stability';

interface ProviderConfig {
  id: GenerationProvider;
  name: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  maxDuration?: number;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'suno',
    name: 'Suno AI',
    icon: Music2,
    description: 'Лучшее качество, до 8 мин',
    badge: 'Рекомендуется',
  },
  {
    id: 'stability',
    name: 'Stability AI',
    icon: Waves,
    description: 'Быстро, до 45 сек',
    maxDuration: 45,
  },
];

interface ProviderSelectorProps {
  provider: GenerationProvider;
  onProviderChange: (provider: GenerationProvider) => void;
  audioDuration?: number | null;
  stabilityStrength?: number[];
  onStabilityStrengthChange?: (value: number[]) => void;
  showStrengthSlider?: boolean;
  className?: string;
}

export const ProviderSelector = memo(function ProviderSelector({
  provider,
  onProviderChange,
  audioDuration,
  stabilityStrength = [0.7],
  onStabilityStrengthChange,
  showStrengthSlider = true,
  className,
}: ProviderSelectorProps) {
  const isStabilityDisabled = audioDuration && audioDuration > 45;

  const handleProviderChange = (newProvider: GenerationProvider) => {
    if (newProvider === 'stability' && isStabilityDisabled) {
      return; // Don't allow selection if audio too long
    }
    onProviderChange(newProvider);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm text-muted-foreground">Провайдер генерации</Label>
      
      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map((p) => {
          const Icon = p.icon;
          const isDisabled = p.id === 'stability' && isStabilityDisabled;
          const isSelected = provider === p.id;

          return (
            <Button
              key={p.id}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleProviderChange(p.id)}
              disabled={!!isDisabled}
              className={cn(
                'flex flex-col items-start h-auto py-3 px-3 gap-1',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{p.name}</span>
                {p.badge && isSelected && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                    {p.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-xs',
                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
                {p.description}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Stability AI duration warning */}
      {isStabilityDisabled && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">
            Stability AI поддерживает аудио до 45 сек. Ваш файл: {Math.round(audioDuration!)} сек
          </p>
        </div>
      )}

      {/* Stability strength slider */}
      {provider === 'stability' && showStrengthSlider && onStabilityStrengthChange && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm text-muted-foreground">Сила трансформации</Label>
            <span className="text-sm font-medium text-foreground">
              {Math.round(stabilityStrength[0] * 100)}%
            </span>
          </div>
          <Slider
            value={stabilityStrength}
            onValueChange={onStabilityStrengthChange}
            min={0.1}
            max={1}
            step={0.05}
            className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Низкое значение — ближе к оригиналу, высокое — больше изменений
          </p>
        </div>
      )}
    </div>
  );
});

export { PROVIDERS };
