/**
 * AnomalyDetectionPanel - Displays detected anomalies in metrics
 */
import { useAnomalyDetection, Anomaly, AnomalySeverity } from '@/hooks/admin/useAnomalyDetection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const severityConfig: Record<AnomalySeverity, { 
  icon: typeof AlertTriangle; 
  color: string; 
  bg: string;
  label: string;
}> = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/30',
    label: 'Критично',
  },
  warning: {
    icon: Activity,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    label: 'Внимание',
  },
  info: {
    icon: Activity,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/30',
    label: 'Инфо',
  },
};

const typeIcons = {
  spike: ArrowUpRight,
  drop: ArrowDownRight,
  trend: TrendingUp,
  threshold: Target,
};

interface AnomalyCardProps {
  anomaly: Anomaly;
}

function AnomalyCard({ anomaly }: AnomalyCardProps) {
  const config = severityConfig[anomaly.severity];
  const TypeIcon = typeIcons[anomaly.type];
  
  return (
    <div className={cn('p-2 sm:p-3 rounded-lg border', config.bg)}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={cn('p-1.5 sm:p-2 rounded-full', config.bg)}>
          <TypeIcon className={cn('h-3 w-3 sm:h-4 sm:w-4', config.color)} />
        </div>
        
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <span className="font-medium text-sm sm:text-base truncate">
              {anomaly.metricLabel}
            </span>
            <Badge 
              variant="outline" 
              className={cn('text-[10px] sm:text-xs px-1 sm:px-2', config.color)}
            >
              {config.label}
            </Badge>
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-2">
              {anomaly.type === 'spike' && 'Всплеск'}
              {anomaly.type === 'drop' && 'Падение'}
              {anomaly.type === 'trend' && 'Тренд'}
              {anomaly.type === 'threshold' && 'Порог'}
            </Badge>
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground">
            {anomaly.description}
          </p>
          
          <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Отклонение: {anomaly.deviation.toFixed(0)}%
            </span>
            <span>
              {new Date(anomaly.timestamp).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnomalyDetectionPanel() {
  const [days, setDays] = useState(14);
  const { anomalies, criticalCount, warningCount, hasAnomalies, hasCritical } = useAnomalyDetection(days);
  
  return (
    <Card className={cn(hasCritical && 'border-red-500/50')}>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <AlertTriangle className={cn(
              'h-4 w-4 sm:h-5 sm:w-5',
              hasCritical ? 'text-red-500' : 'text-muted-foreground'
            )} />
            Детектор аномалий
            {hasAnomalies && (
              <Badge 
                variant={hasCritical ? 'destructive' : 'secondary'} 
                className="ml-2 text-xs"
              >
                {anomalies.length}
              </Badge>
            )}
          </CardTitle>
          
          <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
            <SelectTrigger className="w-[100px] sm:w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="14">14 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-red-500/10 text-center">
            <div className="text-lg sm:text-2xl font-bold text-red-500">{criticalCount}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Критичных</div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/10 text-center">
            <div className="text-lg sm:text-2xl font-bold text-yellow-500">{warningCount}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">Предупр.</div>
          </div>
          <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 text-center">
            <div className={cn(
              'text-lg sm:text-2xl font-bold',
              !hasAnomalies ? 'text-green-500' : 'text-muted-foreground'
            )}>
              {!hasAnomalies ? '✓' : anomalies.length}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {!hasAnomalies ? 'Норма' : 'Всего'}
            </div>
          </div>
        </div>
        
        {/* Anomaly List */}
        {!hasAnomalies ? (
          <div className="py-6 sm:py-8 text-center">
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-green-500 mb-2" />
            <div className="text-sm sm:text-base font-medium text-green-500">
              Аномалий не обнаружено
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Все метрики в пределах нормы
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[250px] sm:h-[300px]">
            <div className="space-y-2">
              {anomalies.map(anomaly => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} />
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Info */}
        <div className="text-[10px] sm:text-xs text-muted-foreground text-center pt-2 border-t">
          Анализ: Z-score (&gt;2σ), пороговые значения, тренды (3+ дня)
        </div>
      </CardContent>
    </Card>
  );
}
