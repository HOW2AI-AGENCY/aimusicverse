/**
 * Effects Tab Content for Studio
 * Contains master volume and effects toggle
 */

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Sliders, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface EffectsTabContentProps {
  masterVolume: number;
  masterMuted: boolean;
  effectsEnabled: boolean;
  engineReady: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onEnableEffects: () => void;
}

export function EffectsTabContent({
  masterVolume,
  masterMuted,
  effectsEnabled,
  engineReady,
  onVolumeChange,
  onMuteToggle,
  onEnableEffects,
}: EffectsTabContentProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Master Volume Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Мастер-громкость
        </h3>
        
        <div className="bg-card/50 border border-border/30 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMuteToggle}
              className={cn(
                "h-10 w-10 rounded-full shrink-0",
                masterMuted && "text-destructive"
              )}
            >
              {masterMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Громкость</span>
                <span className="text-sm text-muted-foreground font-mono">
                  {Math.round(masterVolume * 100)}%
                </span>
              </div>
              <Slider
                value={[masterVolume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => onVolumeChange(v[0])}
                className="w-full"
                disabled={masterMuted}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Effects Engine Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Аудио-эффекты
        </h3>
        
        <div className="bg-card/50 border border-border/30 rounded-lg p-4 space-y-4">
          {!effectsEnabled ? (
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">
                  Режим эффектов
                </p>
                <p className="text-xs text-muted-foreground">
                  Активируйте для применения EQ, компрессора и ревербера к каждому стему
                </p>
              </div>
              <Button
                onClick={onEnableEffects}
                className="w-full mt-2"
                size="sm"
              >
                <Sliders className="w-4 h-4 mr-2" />
                Активировать эффекты
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Статус движка</span>
                <Badge variant={engineReady ? "default" : "secondary"} className="text-xs">
                  {engineReady ? "✓ Готов" : "⏳ Инициализация..."}
                </Badge>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-green-700 dark:text-green-400">
                      Режим эффектов активен
                    </p>
                    <p className="text-muted-foreground">
                      Используйте панель эффектов на каждом стеме для настройки звучания
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• EQ: Трёхполосный эквалайзер (Low, Mid, High)</p>
                <p>• Компрессор: Динамическая обработка</p>
                <p>• Ревербер: Пространственные эффекты</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
