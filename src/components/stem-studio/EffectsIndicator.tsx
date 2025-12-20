/**
 * Effects Indicator Component
 * 
 * Visual indicator showing which effects are active on a stem
 * with real-time feedback
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StemEffects } from '@/hooks/studio/stemEffectsConfig';
import { cn } from '@/lib/utils';

interface EffectsIndicatorProps {
  effects: StemEffects;
  compact?: boolean;
  showDetails?: boolean;
}

export function EffectsIndicator({ 
  effects, 
  compact = false,
  showDetails = true 
}: EffectsIndicatorProps) {
  const activeEffects: Array<{
    name: string;
    label: string;
    color: string;
    details: string;
  }> = [];

  // Check EQ
  const eqActive = effects.eq.lowGain !== 0 || effects.eq.midGain !== 0 || effects.eq.highGain !== 0;
  if (eqActive) {
    const eqDetails = [
      effects.eq.lowGain !== 0 && `Low: ${effects.eq.lowGain > 0 ? '+' : ''}${effects.eq.lowGain}dB`,
      effects.eq.midGain !== 0 && `Mid: ${effects.eq.midGain > 0 ? '+' : ''}${effects.eq.midGain}dB`,
      effects.eq.highGain !== 0 && `High: ${effects.eq.highGain > 0 ? '+' : ''}${effects.eq.highGain}dB`,
    ].filter(Boolean).join(', ');

    activeEffects.push({
      name: 'eq',
      label: 'EQ',
      color: 'blue',
      details: eqDetails,
    });
  }

  // Check Compressor
  if (effects.compressor.enabled) {
    const ratio = effects.compressor.ratio.toFixed(1);
    activeEffects.push({
      name: 'compressor',
      label: 'COMP',
      color: 'orange',
      details: `Ratio: ${ratio}:1, Threshold: ${effects.compressor.threshold}dB`,
    });
  }

  // Check Reverb
  if (effects.reverb.enabled) {
    const wetDryPercent = Math.round(effects.reverb.wetDry * 100);
    activeEffects.push({
      name: 'reverb',
      label: 'REV',
      color: 'purple',
      details: `Mix: ${wetDryPercent}%, Decay: ${effects.reverb.decay}s`,
    });
  }

  if (activeEffects.length === 0) {
    if (compact) return null;
    
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs h-5 px-1.5 text-muted-foreground">
          No FX
        </Badge>
      </div>
    );
  }

  if (compact) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5">
              {activeEffects.map((effect) => (
                <div
                  key={effect.name}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    effect.color === 'blue' && "bg-blue-500",
                    effect.color === 'orange' && "bg-orange-500",
                    effect.color === 'purple' && "bg-purple-500"
                  )}
                />
              ))}
            </div>
          </TooltipTrigger>
          {showDetails && (
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                {activeEffects.map((effect) => (
                  <div key={effect.name} className="text-xs">
                    <span className="font-semibold">{effect.label}:</span>{' '}
                    <span className="text-muted-foreground">{effect.details}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {activeEffects.map((effect) => (
        <TooltipProvider key={effect.name} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] h-5 px-1.5 font-medium cursor-help",
                  effect.color === 'blue' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                  effect.color === 'orange' && "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                  effect.color === 'purple' && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                )}
              >
                {effect.label}
              </Badge>
            </TooltipTrigger>
            {showDetails && (
              <TooltipContent side="top">
                <p className="text-xs">{effect.details}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

/**
 * Simple pulse indicator for active effects
 */
export function EffectsPulse({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
    </div>
  );
}
