/**
 * SmartPresetsPanel - AI-powered preset recommendations
 * Shows personalized suggestions based on user history
 */

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, TrendingUp, Clock, Star, 
  ChevronRight, Lightbulb, Zap 
} from 'lucide-react';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { usePromptDJStore, selectPresets } from '@/hooks/usePromptDJStore';
import { PromptChannel, CHANNEL_TYPES, ChannelType } from '@/hooks/usePromptDJEnhanced';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SmartPresetsPanelProps {
  channels: PromptChannel[];
  onApplyRecommendation: (type: ChannelType, value: string) => void;
  onLoadPreset?: (preset: { channels: PromptChannel[] }) => void;
}

export const SmartPresetsPanel = memo(function SmartPresetsPanel({
  channels,
  onApplyRecommendation,
  onLoadPreset,
}: SmartPresetsPanelProps) {
  const { analytics, getRecommendations, topRated, history } = usePromptHistory();
  const userPresets = usePromptDJStore(selectPresets);
  
  // Get actions via getState to avoid subscription
  const loadPreset = useCallback((id: string) => {
    usePromptDJStore.getState().loadPreset(id);
  }, []);
  
  const deletePreset = useCallback((id: string) => {
    usePromptDJStore.getState().deletePreset(id);
  }, []);

  const recommendations = getRecommendations(channels, 4);

  const handleApplyRecommendation = useCallback((type: string, value: string) => {
    onApplyRecommendation(type as ChannelType, value);
  }, [onApplyRecommendation]);

  const getChannelConfig = (type: string) => {
    return CHANNEL_TYPES.find(c => c.type === type);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs">Smart</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[70vh]">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Умные пресеты
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-4">
            {/* AI Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Рекомендации
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {recommendations.map((rec, i) => {
                    const config = getChannelConfig(rec.type);
                    return (
                      <button
                        key={i}
                        className={cn(
                          'flex flex-col items-start p-2.5 rounded-lg',
                          'bg-muted/30 hover:bg-muted/50 transition-colors',
                          'text-left'
                        )}
                        onClick={() => handleApplyRecommendation(rec.type, rec.value)}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: config?.color }}
                          />
                          <span className="text-xs font-medium">{rec.value}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">
                          {rec.reason}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User Stats */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Ваша статистика
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-muted/20 text-center">
                    <div className="text-lg font-bold">{analytics.avgBPM}</div>
                    <div className="text-[10px] text-muted-foreground">Средний BPM</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 text-center">
                    <div className="text-lg font-bold">{history.length}</div>
                    <div className="text-[10px] text-muted-foreground">Генераций</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 text-center">
                    <div className="text-lg font-bold">
                      {Math.round(analytics.successRate * 100)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Успех</div>
                  </div>
                </div>
                
                {/* Top genres */}
                {analytics.topGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {analytics.topGenres.slice(0, 4).map(({ value, count }) => (
                      <Badge 
                        key={value} 
                        variant="secondary"
                        className="text-[10px] cursor-pointer"
                        onClick={() => handleApplyRecommendation('genre', value)}
                      >
                        {value} ({count})
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top Rated Prompts */}
            {topRated.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Лучшие миксы
                </div>
                <div className="space-y-1.5">
                  {topRated.slice(0, 3).map((entry) => (
                    <button
                      key={entry.id}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg',
                        'bg-muted/20 hover:bg-muted/40 transition-colors',
                        'text-left'
                      )}
                      onClick={() => onLoadPreset?.({ channels: entry.channels })}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs line-clamp-1">{entry.prompt}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: entry.rating || 0 }).map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User Presets */}
            {userPresets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Сохранённые пресеты
                </div>
                <div className="space-y-1.5">
                  {userPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg',
                        'bg-muted/20'
                      )}
                    >
                      <button
                        className="flex-1 text-left text-xs hover:text-primary transition-colors"
                        onClick={() => loadPreset(preset.id)}
                      >
                        {preset.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deletePreset(preset.id)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent History */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Недавние
                </div>
                <div className="space-y-1">
                  {history.slice(0, 5).map((entry) => (
                    <button
                      key={entry.id}
                      className={cn(
                        'w-full p-2 rounded-lg text-left',
                        'bg-muted/10 hover:bg-muted/30 transition-colors'
                      )}
                      onClick={() => onLoadPreset?.({ channels: entry.channels })}
                    >
                      <p className="text-[11px] line-clamp-1 text-muted-foreground">
                        {entry.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});
