/**
 * Sources Heatmap
 * 
 * Heatmap visualization for deeplink sources by hour/day
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HeatmapData {
  source: string;
  hourlyData: number[]; // 24 hours
}

interface SourcesHeatmapProps {
  data: HeatmapData[];
  isLoading?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = HOURS.map(h => `${h.toString().padStart(2, '0')}:00`);

// Get intensity class based on value relative to max
function getIntensityClass(value: number, maxValue: number): string {
  if (value === 0) return 'bg-muted/30';
  
  const intensity = value / maxValue;
  
  if (intensity > 0.8) return 'bg-primary';
  if (intensity > 0.6) return 'bg-primary/80';
  if (intensity > 0.4) return 'bg-primary/60';
  if (intensity > 0.2) return 'bg-primary/40';
  return 'bg-primary/20';
}

export function SourcesHeatmap({ data, isLoading }: SourcesHeatmapProps) {
  // Calculate max value for intensity scaling
  const maxValue = useMemo(() => {
    return Math.max(
      1,
      ...data.flatMap(source => source.hourlyData)
    );
  }, [data]);

  // Calculate total per source for sorting
  const sortedData = useMemo(() => {
    return [...data]
      .map(source => ({
        ...source,
        total: source.hourlyData.reduce((sum, v) => sum + v, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Активность по источникам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Загрузка...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Активность по источникам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Нет данных
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Активность по источникам</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex gap-0.5 mb-2 ml-24">
              {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                <div 
                  key={hour} 
                  className="text-[10px] text-muted-foreground w-[calc((100%-0px)/8)]"
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            <TooltipProvider delayDuration={100}>
              <div className="space-y-1">
                {sortedData.map(source => (
                  <div key={source.source} className="flex items-center gap-2">
                    <div className="w-20 text-xs text-muted-foreground truncate text-right">
                      {source.source}
                    </div>
                    <div className="flex gap-0.5 flex-1">
                      {source.hourlyData.map((value, hour) => (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'flex-1 h-6 rounded-sm cursor-pointer transition-opacity hover:opacity-80',
                                getIntensityClass(value, maxValue)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-medium">{source.source}</div>
                              <div>{HOUR_LABELS[hour]}: {value} переходов</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <div className="w-12 text-xs text-right text-muted-foreground">
                      {source.total}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Меньше</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-primary/20" />
                <div className="w-4 h-4 rounded-sm bg-primary/40" />
                <div className="w-4 h-4 rounded-sm bg-primary/60" />
                <div className="w-4 h-4 rounded-sm bg-primary/80" />
                <div className="w-4 h-4 rounded-sm bg-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Больше</span>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
