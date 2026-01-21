/**
 * SystemStatusCard - Real-time system health status card with test alert functionality
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  TestTube,
  Bell,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms?: number;
  message?: string;
}

interface HealthStatus {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, HealthCheckResult>;
  metrics: {
    active_generations: number;
    stuck_tasks: number;
    failed_tracks_24h: number;
    bot_success_rate: number;
  };
  timestamp: string;
}

const statusConfig = {
  healthy: { 
    icon: CheckCircle2, 
    color: 'text-green-500', 
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    label: 'Система работает нормально'
  },
  degraded: { 
    icon: AlertTriangle, 
    color: 'text-yellow-500', 
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    label: 'Снижена производительность'
  },
  unhealthy: { 
    icon: XCircle, 
    color: 'text-red-500', 
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Требуется внимание!'
  },
};

export function SystemStatusCard() {
  const [isSendingTest, setIsSendingTest] = useState(false);
  
  const { data: healthStatus, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['system-health'],
    queryFn: async (): Promise<HealthStatus> => {
      const { data, error } = await supabase.functions.invoke('health-check');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('health-alert', {
        body: { test: true }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Тестовый алерт отправлен ${data.recipients} получателям`);
      } else {
        toast.error(data.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast.error('Не удалось отправить тестовый алерт');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleForceAlert = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('health-alert', {
        body: { force: true }
      });
      
      if (error) throw error;
      
      if (data.alert_sent) {
        toast.success(`Алерт отправлен ${data.recipients} получателям`);
      } else {
        toast.info(`Система здорова (${data.status}), алерт не требуется`);
      }
    } catch (error) {
      toast.error('Ошибка проверки системы');
    }
  };

  const config = healthStatus 
    ? statusConfig[healthStatus.overall_status] 
    : statusConfig.healthy;
  
  const StatusIcon = config.icon;

  return (
    <Card className={cn('transition-all', config.border, config.bg)}>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            Статус системы
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-8 px-2 sm:px-3"
            >
              <RefreshCw className={cn('h-3 w-3 sm:h-4 sm:w-4', isLoading && 'animate-spin')} />
              <span className="hidden sm:inline ml-1">Обновить</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendTestAlert}
              disabled={isSendingTest}
              className="h-8 px-2 sm:px-3"
            >
              <TestTube className={cn('h-3 w-3 sm:h-4 sm:w-4', isSendingTest && 'animate-pulse')} />
              <span className="hidden sm:inline ml-1">Тест</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Overall Status */}
        <div className="flex items-center gap-3">
          <div className={cn('p-2 sm:p-3 rounded-full', config.bg)}>
            <StatusIcon className={cn('h-5 w-5 sm:h-6 sm:w-6', config.color)} />
          </div>
          <div>
            <div className={cn('text-base sm:text-lg font-semibold', config.color)}>
              {healthStatus?.overall_status === 'healthy' ? 'Healthy' : 
               healthStatus?.overall_status === 'degraded' ? 'Degraded' : 'Unhealthy'}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {config.label}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        {healthStatus?.metrics && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-background/50">
              <div className="text-lg sm:text-xl font-bold">
                {healthStatus.metrics.active_generations}
              </div>
              <div className="text-xs text-muted-foreground">Активных генераций</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-background/50">
              <div className={cn(
                'text-lg sm:text-xl font-bold',
                healthStatus.metrics.stuck_tasks > 0 && 'text-yellow-500'
              )}>
                {healthStatus.metrics.stuck_tasks}
              </div>
              <div className="text-xs text-muted-foreground">Зависших задач</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-background/50">
              <div className={cn(
                'text-lg sm:text-xl font-bold',
                healthStatus.metrics.failed_tracks_24h > 5 && 'text-red-500'
              )}>
                {healthStatus.metrics.failed_tracks_24h}
              </div>
              <div className="text-xs text-muted-foreground">Ошибок за 24ч</div>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-background/50">
              <div className={cn(
                'text-lg sm:text-xl font-bold',
                healthStatus.metrics.bot_success_rate < 95 ? 'text-yellow-500' : 'text-green-500'
              )}>
                {healthStatus.metrics.bot_success_rate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Bot Success Rate</div>
            </div>
          </div>
        )}

        {/* Service Status */}
        {healthStatus?.checks && (
          <div className="space-y-2">
            <div className="text-xs sm:text-sm font-medium text-muted-foreground">Сервисы:</div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {Object.entries(healthStatus.checks).map(([key, check]) => {
                const checkConfig = statusConfig[check.status];
                const CheckIcon = checkConfig.icon;
                return (
                  <Badge 
                    key={key} 
                    variant="outline" 
                    className={cn('text-xs gap-1', checkConfig.color)}
                  >
                    <CheckIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{check.name}</span>
                    <span className="sm:hidden">{key}</span>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleForceAlert}
            className="flex-1 h-8 text-xs sm:text-sm"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Принудительная проверка
          </Button>
        </div>

        {/* Last Updated */}
        {dataUpdatedAt && (
          <div className="text-xs text-muted-foreground text-right">
            Обновлено: {new Date(dataUpdatedAt).toLocaleTimeString('ru-RU')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
