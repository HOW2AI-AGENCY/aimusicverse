import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Database,
  Shield,
  HardDrive,
  Zap,
  Music,
  Bot,
  Bell,
  Gauge,
  TrendingUp,
  Clock,
  AlertOctagon
} from 'lucide-react';
import { formatDistanceToNow, ru } from '@/lib/date-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

const statusIcons = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const statusColors = {
  healthy: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

const statusBgColors = {
  healthy: 'bg-green-500/10 border-green-500/20',
  warning: 'bg-yellow-500/10 border-yellow-500/20',
  error: 'bg-red-500/10 border-red-500/20',
};

const checkIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Database': Database,
  'Auth Service': Shield,
  'Storage': HardDrive,
  'Edge Functions': Zap,
  'Generation Queue': Music,
  'Telegram Bot': Bot,
};

export function HealthCheckPanel() {
  const { data: health, isLoading, refetch, isFetching } = useSystemHealth();
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const sendTestAlert = async () => {
    setIsSendingAlert(true);
    try {
      const { error } = await supabase.functions.invoke('health-alert', {
        body: { test: true }
      });
      
      if (error) throw error;
      toast.success('Тестовый алерт отправлен в Telegram');
    } catch (err) {
      toast.error('Ошибка отправки алерта');
    } finally {
      setIsSendingAlert(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return null;
  }

  const OverallIcon = statusIcons[health.overall];

  return (
    <div className="space-y-4">
      {/* Main Health Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={health.overall === 'healthy' ? 'default' : health.overall === 'warning' ? 'secondary' : 'destructive'}
              className="flex items-center gap-1"
            >
              <OverallIcon className="h-3 w-3" />
              {health.overall === 'healthy' ? 'Healthy' : health.overall === 'warning' ? 'Warning' : 'Critical'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Service Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {health.checks.map((check) => {
              const StatusIcon = statusIcons[check.status];
              const CheckIcon = checkIcons[check.name] || Activity;
              
              return (
                <div 
                  key={check.name}
                  className={`flex items-center justify-between p-3 rounded-lg border ${statusBgColors[check.status]}`}
                >
                  <div className="flex items-center gap-3">
                    <CheckIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-sm">{check.name}</span>
                      {check.latency && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {check.latency}ms
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {check.message}
                    </span>
                    <StatusIcon className={`h-4 w-4 ${statusColors[check.status]}`} />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-xs text-muted-foreground text-right pt-2">
            Обновлено {formatDistanceToNow(health.lastChecked, { addSuffix: true, locale: ru })}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Активных генераций"
          value={health.metrics.activeGenerations}
          icon={<Zap className="h-4 w-4" />}
          status={health.metrics.activeGenerations > 50 ? 'warning' : 'healthy'}
        />
        <MetricCard
          title="Зависших задач"
          value={health.metrics.stuckTasks}
          icon={<Clock className="h-4 w-4" />}
          status={health.metrics.stuckTasks > 10 ? 'error' : health.metrics.stuckTasks > 0 ? 'warning' : 'healthy'}
        />
        <MetricCard
          title="Ошибок (24ч)"
          value={health.metrics.failedTracks24h}
          icon={<AlertOctagon className="h-4 w-4" />}
          status={health.metrics.failedTracks24h > 20 ? 'error' : health.metrics.failedTracks24h > 5 ? 'warning' : 'healthy'}
        />
        <MetricCard
          title="Bot Success Rate"
          value={`${health.metrics.botSuccessRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          status={health.metrics.botSuccessRate < 80 ? 'error' : health.metrics.botSuccessRate < 95 ? 'warning' : 'healthy'}
          showProgress
          progressValue={health.metrics.botSuccessRate}
        />
      </div>

      {/* Alert Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Telegram Алерты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Автоматические алерты при падении сервисов
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Активно
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={sendTestAlert}
              disabled={isSendingAlert}
            >
              {isSendingAlert ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Тестовый алерт
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  status,
  showProgress = false,
  progressValue = 0
}: { 
  title: string;
  value: number | string;
  icon: React.ReactNode;
  status: 'healthy' | 'warning' | 'error';
  showProgress?: boolean;
  progressValue?: number;
}) {
  const StatusIcon = statusIcons[status];
  
  return (
    <Card className={statusBgColors[status]}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground">{icon}</span>
          <StatusIcon className={`h-4 w-4 ${statusColors[status]}`} />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
        {showProgress && (
          <Progress 
            value={progressValue} 
            className="h-1 mt-2"
          />
        )}
      </CardContent>
    </Card>
  );
}
