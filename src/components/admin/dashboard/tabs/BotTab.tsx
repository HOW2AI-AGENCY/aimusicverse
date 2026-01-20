/**
 * Admin Bot Tab Component
 * 
 * Bot metrics and event statistics.
 * 
 * @module components/admin/dashboard/tabs/BotTab
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface BotTabProps {
  /** Bot metrics data */
  metrics: {
    successful_events?: number;
    failed_events?: number;
    events_by_type?: Record<string, number>;
  } | null | undefined;
  /** Whether to use compact mobile layout */
  isMobile: boolean;
}

/**
 * Bot tab with metrics and event breakdown
 */
export function BotTab({ metrics, isMobile }: BotTabProps) {
  return (
    <div className="space-y-4">
      {/* Success/Failure Cards */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Успешные
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {metrics?.successful_events || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Ошибки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-red-500">
              {metrics?.failed_events || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            События по типу (24ч)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.events_by_type ? (
            <div className="space-y-2">
              {Object.entries(metrics.events_by_type)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, isMobile ? 8 : 15)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-mono truncate flex-1">
                      {type}
                    </span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Нет данных</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
