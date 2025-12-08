import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Bot
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

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

const checkIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Database': Database,
  'Auth Service': Shield,
  'Storage': HardDrive,
  'Generation Tasks': Zap,
  'Failed Tracks (24h)': Music,
  'Telegram Bot': Bot,
};

export function HealthCheckPanel() {
  const { data: health, isLoading, refetch, isFetching } = useSystemHealth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Check
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
            {health.overall === 'healthy' ? 'Healthy' : health.overall === 'warning' ? 'Warning' : 'Issues'}
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
        {health.checks.map((check) => {
          const StatusIcon = statusIcons[check.status];
          const CheckIcon = checkIcons[check.name] || Activity;
          
          return (
            <div 
              key={check.name}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <CheckIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{check.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{check.message}</span>
                <StatusIcon className={`h-4 w-4 ${statusColors[check.status]}`} />
              </div>
            </div>
          );
        })}
        
        <div className="text-xs text-muted-foreground text-right pt-2">
          Обновлено {formatDistanceToNow(health.lastChecked, { addSuffix: true, locale: ru })}
        </div>
      </CardContent>
    </Card>
  );
}
