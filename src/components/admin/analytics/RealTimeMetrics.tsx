/**
 * Real-time Metrics Widget
 * Displays live counters and real-time activity indicators
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, Users, Music, Zap, Radio, 
  TrendingUp, Circle, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RealTimeStats {
  activeUsers: number;
  generationsInProgress: number;
  recentEvents: number;
  lastEventTime: Date | null;
  eventsPerMinute: number;
  newTracksToday: number;
  newUsersToday: number;
}

export function RealTimeMetrics() {
  const [pulse, setPulse] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: async (): Promise<RealTimeStats> => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const todayStart = new Date(now.setHours(0, 0, 0, 0));

      const [
        recentEventsResult,
        generationsResult,
        activeSessionsResult,
        newTracksResult,
        newUsersResult,
      ] = await Promise.all([
        // Events in last minute
        supabase
          .from('user_analytics_events')
          .select('created_at')
          .gte('created_at', oneMinuteAgo.toISOString())
          .order('created_at', { ascending: false }),
        
        // Active generations
        supabase
          .from('generation_tasks')
          .select('id')
          .in('status', ['pending', 'processing']),
        
        // Active sessions (events in last 15 min)
        supabase
          .from('user_analytics_events')
          .select('session_id')
          .gte('created_at', fifteenMinutesAgo.toISOString()),
        
        // New tracks today
        supabase
          .from('tracks')
          .select('id')
          .gte('created_at', todayStart.toISOString())
          .eq('status', 'completed'),
        
        // New users today
        supabase
          .from('profiles')
          .select('user_id')
          .gte('created_at', todayStart.toISOString()),
      ]);

      const recentEvents = recentEventsResult.data || [];
      const uniqueSessions = new Set((activeSessionsResult.data || []).map(e => e.session_id).filter(Boolean));

      return {
        activeUsers: uniqueSessions.size,
        generationsInProgress: generationsResult.data?.length || 0,
        recentEvents: recentEvents.length,
        lastEventTime: recentEvents[0]?.created_at ? new Date(recentEvents[0].created_at) : null,
        eventsPerMinute: recentEvents.length,
        newTracksToday: newTracksResult.data?.length || 0,
        newUsersToday: newUsersResult.data?.length || 0,
      };
    },
    staleTime: 5000,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Pulse animation on data change
  useEffect(() => {
    if (data) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [data?.recentEvents]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('realtime-metrics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_analytics_events' },
        () => {
          refetch();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'generation_tasks' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const formatTimeSince = (date: Date | null): string => {
    if (!date) return 'нет данных';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return 'только что';
    if (seconds < 60) return `${seconds} сек назад`;
    return `${Math.floor(seconds / 60)} мин назад`;
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.div
          animate={{ scale: pulse ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Circle className={`h-2 w-2 fill-green-500 ${pulse ? 'animate-pulse' : ''}`} />
        </motion.div>
        <span className="text-xs text-green-500 font-medium">LIVE</span>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          Метрики в реальном времени
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Active Users */}
          <RealTimeMetricCard
            icon={Users}
            label="Активных"
            value={data?.activeUsers || 0}
            subtext="за 15 мин"
            iconColor="text-blue-500"
            isLoading={isLoading}
          />

          {/* Events per minute */}
          <RealTimeMetricCard
            icon={Zap}
            label="Событий/мин"
            value={data?.eventsPerMinute || 0}
            subtext={formatTimeSince(data?.lastEventTime ?? null)}
            iconColor="text-yellow-500"
            isLoading={isLoading}
            pulse={pulse}
          />

          {/* Generations in progress */}
          <RealTimeMetricCard
            icon={Activity}
            label="Генераций"
            value={data?.generationsInProgress || 0}
            subtext="в процессе"
            iconColor="text-purple-500"
            isLoading={isLoading}
          />

          {/* Today's stats */}
          <RealTimeMetricCard
            icon={TrendingUp}
            label="Сегодня"
            value={data?.newTracksToday || 0}
            subtext={`треков • ${data?.newUsersToday || 0} юзеров`}
            iconColor="text-green-500"
            isLoading={isLoading}
          />
        </div>

        {/* Activity indicator bar */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Активность за последнюю минуту</span>
            <span>{data?.eventsPerMinute || 0} событий</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min((data?.eventsPerMinute || 0) * 5, 100)}%` 
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Recent activity feed preview */}
        {data && data.recentEvents > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={data.recentEvents}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">
                    {data.recentEvents} событий за последнюю минуту
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RealTimeMetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subtext: string;
  iconColor: string;
  isLoading: boolean;
  pulse?: boolean;
}

function RealTimeMetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext, 
  iconColor, 
  isLoading,
  pulse 
}: RealTimeMetricCardProps) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <motion.div
        animate={{ scale: pulse ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-xl font-bold">
          {isLoading ? '...' : value.toLocaleString()}
        </p>
      </motion.div>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}
