/**
 * Error Trends Panel
 * Shows error statistics and trends over time
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorTrends {
  total_errors: number;
  critical_errors: number;
  unique_fingerprints: number;
  errors_by_day: Array<{
    day: string;
    count: number;
    critical: number;
  }>;
  errors_by_type: Record<string, number>;
  errors_by_severity: Record<string, number>;
  top_error_fingerprints: Array<{
    error_fingerprint: string;
    error_type: string;
    error_message: string;
    occurrences: number;
    affected_users: number;
    last_seen: string;
  }>;
}

interface ErrorTrendsPanelProps {
  data: ErrorTrends | null | undefined;
  isLoading: boolean;
}

export function ErrorTrendsPanel({ data, isLoading }: ErrorTrendsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Нет данных об ошибках за выбранный период
        </CardContent>
      </Card>
    );
  }

  // Format errors by day for chart
  const errorsByDayData = (data.errors_by_day || []).map(d => ({
    ...d,
    day: new Date(d.day).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
  }));

  // Format errors by type for bar chart
  const errorsByTypeData = Object.entries(data.errors_by_type || {})
    .map(([name, count]) => ({ name: formatErrorType(name), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Errors Over Time */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Ошибки по дням</CardTitle>
        </CardHeader>
        <CardContent>
          {errorsByDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={errorsByDayData}>
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  name="Всего"
                />
                <Line 
                  type="monotone" 
                  dataKey="critical" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Критических"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Errors by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">По типам</CardTitle>
        </CardHeader>
        <CardContent>
          {errorsByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={errorsByTypeData} layout="vertical">
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет ошибок</p>
          )}
        </CardContent>
      </Card>

      {/* Errors by Severity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">По серьёзности</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.errors_by_severity || {}).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SeverityIcon severity={severity} />
                  <span className="text-sm capitalize">{formatSeverity(severity)}</span>
                </div>
                <Badge variant={getSeverityVariant(severity)}>
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Error Fingerprints */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Частые ошибки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.top_error_fingerprints?.slice(0, 5).map((error, i) => (
              <div 
                key={i} 
                className="p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{error.error_type}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {error.error_message}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="destructive">{error.occurrences}×</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {error.affected_users} пользователей
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Последняя: {new Date(error.last_seen).toLocaleString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'error') {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
  if (s === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
  return <Info className="h-4 w-4 text-blue-500" />;
}

function getSeverityVariant(severity: string): 'destructive' | 'secondary' | 'outline' {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'error') return 'destructive';
  if (s === 'warning') return 'secondary';
  return 'outline';
}

function formatSeverity(s: string): string {
  const map: Record<string, string> = {
    critical: 'Критические',
    error: 'Ошибки',
    warning: 'Предупреждения',
    info: 'Информация',
  };
  return map[s.toLowerCase()] || s;
}

function formatErrorType(type: string): string {
  return type
    .replace(/Error$/i, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .slice(0, 15);
}
