/**
 * User Activity Heatmap
 * Displays user activity patterns by hour and day of week
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Calendar } from 'lucide-react';

interface UserActivityHeatmapProps {
  timePeriod: string;
}

interface HeatmapData {
  hourlyActivity: number[][];  // 7 days x 24 hours
  peakHour: number;
  peakDay: number;
  totalEvents: number;
  avgEventsPerHour: number;
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function UserActivityHeatmap({ timePeriod }: UserActivityHeatmapProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-activity-heatmap', timePeriod],
    queryFn: async (): Promise<HeatmapData> => {
      const periodDays = timePeriod === '24 hours' ? 1 : 
                         timePeriod === '7 days' ? 7 : 
                         timePeriod === '30 days' ? 30 : 90;
      
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
      
      // Fetch analytics events
      const { data: events } = await supabase
        .from('user_analytics_events')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Initialize 7x24 matrix
      const hourlyActivity: number[][] = Array.from({ length: 7 }, () => 
        Array.from({ length: 24 }, () => 0)
      );

      let peakValue = 0;
      let peakHour = 0;
      let peakDay = 0;

      (events || []).forEach(event => {
        const date = new Date(event.created_at || Date.now());
        // getDay returns 0 for Sunday, we want Monday = 0
        const dayOfWeek = (date.getDay() + 6) % 7;
        const hour = date.getHours();
        
        hourlyActivity[dayOfWeek][hour]++;
        
        if (hourlyActivity[dayOfWeek][hour] > peakValue) {
          peakValue = hourlyActivity[dayOfWeek][hour];
          peakHour = hour;
          peakDay = dayOfWeek;
        }
      });

      const totalEvents = (events || []).length;
      const avgEventsPerHour = totalEvents / (7 * 24);

      return {
        hourlyActivity,
        peakHour,
        peakDay,
        totalEvents,
        avgEventsPerHour,
      };
    },
    staleTime: 60000,
    refetchInterval: 120000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.totalEvents === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Нет данных об активности
        </CardContent>
      </Card>
    );
  }

  // Find max value for color scaling
  const maxValue = Math.max(...data.hourlyActivity.flat());
  
  const getIntensity = (value: number): string => {
    if (value === 0) return 'bg-muted/30';
    const intensity = value / maxValue;
    if (intensity < 0.2) return 'bg-primary/20';
    if (intensity < 0.4) return 'bg-primary/40';
    if (intensity < 0.6) return 'bg-primary/60';
    if (intensity < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Пиковое время</p>
                <p className="text-lg font-bold">{data.peakHour}:00</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Пиковый день</p>
                <p className="text-lg font-bold">{DAYS[data.peakDay]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Всего событий</p>
              <p className="text-lg font-bold">{data.totalEvents.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Среднее/час</p>
              <p className="text-lg font-bold">{data.avgEventsPerHour.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Активность по времени
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hours header */}
              <div className="flex mb-1">
                <div className="w-10" /> {/* Spacer for day labels */}
                {HOURS.filter((_, i) => i % 2 === 0).map(hour => (
                  <div 
                    key={hour} 
                    className="flex-1 text-center text-xs text-muted-foreground"
                    style={{ minWidth: '20px' }}
                  >
                    {hour}
                  </div>
                ))}
              </div>

              {/* Heatmap rows */}
              {data.hourlyActivity.map((row, dayIndex) => (
                <div key={dayIndex} className="flex items-center mb-1">
                  <div className="w-10 text-xs text-muted-foreground font-medium">
                    {DAYS[dayIndex]}
                  </div>
                  <div className="flex-1 flex gap-[2px]">
                    {row.map((value, hourIndex) => (
                      <div
                        key={hourIndex}
                        className={`flex-1 h-6 rounded-sm transition-colors ${getIntensity(value)}`}
                        title={`${DAYS[dayIndex]} ${hourIndex}:00 - ${value} событий`}
                        style={{ minWidth: '10px' }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <span className="text-xs text-muted-foreground">Меньше</span>
                <div className="flex gap-1">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
