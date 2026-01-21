/**
 * MonitoringHub - Unified monitoring overview with key metrics from all systems
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlertStats } from '@/hooks/useHealthAlerts';
import { useAnomalyDetection } from '@/hooks/admin/useAnomalyDetection';
import { usePerformanceMetrics } from '@/hooks/admin/usePerformanceMetrics';
import { useActiveUsersStats } from '@/hooks/useEnhancedAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Gauge,
  Server,
  Music,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'good' | 'warning' | 'critical';
}

function QuickStat({ label, value, icon, trend, trendValue, status = 'good' }: QuickStatProps) {
  const statusColors = {
    good: 'border-green-500/30 bg-green-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={cn('p-2 sm:p-3 rounded-lg border', statusColors[status])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg sm:text-2xl font-bold">{value}</span>
        {trend && trendValue && (
          <span className={cn(
            'text-[10px] sm:text-xs flex items-center gap-0.5',
            trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}

interface MonitoringHubProps {
  onNavigateToTab?: (tab: 'alerts') => void;
}

export function MonitoringHub({ onNavigateToTab }: MonitoringHubProps) {
  const { data: alertStats } = useAlertStats();
  const { anomalies, criticalCount, warningCount, hasCritical } = useAnomalyDetection(7);
  const { performanceScore, stats: perfStats } = usePerformanceMetrics(7);
  const { data: activeUsers } = useActiveUsersStats();

  // Get system health status
  const { data: healthStatus, refetch: refetchHealth } = useQuery({
    queryKey: ['monitoring-hub-health'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('health-check');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Get generation stats for today
  const { data: generationStats } = useQuery({
    queryKey: ['monitoring-hub-generations'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('generation_tasks')
        .select('status')
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const completed = data?.filter(t => t.status === 'completed').length || 0;
      const failed = data?.filter(t => t.status === 'failed').length || 0;
      
      return { total, completed, failed, successRate: total > 0 ? (completed / total) * 100 : 100 };
    },
    refetchInterval: 30000,
  });

  const systemStatus = healthStatus?.overall_status || 'unknown';
  const isHealthy = systemStatus === 'healthy';
  const isDegraded = systemStatus === 'degraded';

  const overallStatus = hasCritical ? 'critical' : 
    (isDegraded || warningCount > 0) ? 'warning' : 'good';

  const statusConfig = {
    good: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Всё в норме' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Есть предупреждения' },
    critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Требуется внимание!' },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Overall Status Banner */}
      <Card className={cn('border-2', config.bg, 
        overallStatus === 'critical' && 'border-red-500/50',
        overallStatus === 'warning' && 'border-yellow-500/50'
      )}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 sm:p-3 rounded-full', config.bg)}>
                <StatusIcon className={cn('h-5 w-5 sm:h-6 sm:w-6', config.color)} />
              </div>
              <div>
                <div className={cn('text-base sm:text-lg font-semibold', config.color)}>
                  {config.label}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {criticalCount > 0 && `${criticalCount} критичных • `}
                  {warningCount > 0 && `${warningCount} предупреждений • `}
                  {alertStats?.unresolved || 0} нерешённых алертов
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetchHealth()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <QuickStat
          label="DAU"
          value={activeUsers?.daily_active || 0}
          icon={<Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />}
          status="good"
        />
        <QuickStat
          label="Генераций сегодня"
          value={generationStats?.total || 0}
          icon={<Music className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />}
          status={generationStats?.successRate && generationStats.successRate < 90 ? 'warning' : 'good'}
        />
        <QuickStat
          label="Perf Score"
          value={performanceScore || '-'}
          icon={<Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />}
          status={performanceScore && performanceScore < 50 ? 'critical' : 
                  performanceScore && performanceScore < 80 ? 'warning' : 'good'}
        />
        <QuickStat
          label="Avg LCP"
          value={perfStats.avgLcp ? `${(perfStats.avgLcp / 1000).toFixed(1)}s` : '-'}
          icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />}
          status={perfStats.avgLcp > 4000 ? 'critical' : 
                  perfStats.avgLcp > 2500 ? 'warning' : 'good'}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active Issues */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Активные проблемы
                {anomalies.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {anomalies.length}
                  </Badge>
                )}
              </CardTitle>
              {onNavigateToTab && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => onNavigateToTab('alerts')}
                >
                  Все <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {anomalies.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <div className="text-sm text-green-500 font-medium">Проблем не обнаружено</div>
              </div>
            ) : (
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {anomalies.slice(0, 5).map(anomaly => (
                    <div 
                      key={anomaly.id}
                      className={cn(
                        'p-2 rounded-lg text-xs',
                        anomaly.severity === 'critical' ? 'bg-red-500/10' :
                        anomaly.severity === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                      )}
                    >
                      <div className="font-medium">{anomaly.metricLabel}</div>
                      <div className="text-muted-foreground truncate">{anomaly.description}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* System Services */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Server className="h-4 w-4" />
                Сервисы
              </CardTitle>
              {onNavigateToTab && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => onNavigateToTab('alerts')}
                >
                  Подробнее <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!healthStatus?.checks ? (
              <div className="py-6 text-center text-muted-foreground text-sm">
                Загрузка...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(healthStatus.checks).map(([key, check]: [string, any]) => (
                  <div 
                    key={key}
                    className={cn(
                      'p-2 rounded-lg text-xs flex items-center gap-2',
                      check.status === 'healthy' ? 'bg-green-500/10' :
                      check.status === 'degraded' ? 'bg-yellow-500/10' : 'bg-red-500/10'
                    )}
                  >
                    {check.status === 'healthy' ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : check.status === 'degraded' ? (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="truncate">{check.name || key}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generation Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Здоровье генерации (сегодня)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-500">
                {generationStats?.completed || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Успешно</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-red-500">
                {generationStats?.failed || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Ошибок</div>
            </div>
            <div className="text-center">
              <div className={cn(
                'text-xl sm:text-2xl font-bold',
                (generationStats?.successRate || 100) >= 95 ? 'text-green-500' :
                (generationStats?.successRate || 100) >= 85 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {(generationStats?.successRate || 100).toFixed(1)}%
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>
          <Progress 
            value={generationStats?.successRate || 100} 
            className="h-2"
          />
        </CardContent>
      </Card>
    </div>
  );
}
