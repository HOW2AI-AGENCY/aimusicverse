/**
 * Telemetry Overview Panel
 * Shows event distribution and platform stats
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TelemetryData {
  total_events: number;
  unique_sessions: number;
  unique_users: number;
  events_by_type: Record<string, number>;
  top_events: Array<{
    event_name: string;
    count: number;
    avg_duration_ms: number | null;
  }>;
  platform_distribution: Record<string, number>;
  avg_session_duration_sec: number | null;
}

interface TelemetryOverviewProps {
  data: TelemetryData | null | undefined;
  isLoading: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444'];

export function TelemetryOverview({ data, isLoading }: TelemetryOverviewProps) {
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
          Нет данных за выбранный период
        </CardContent>
      </Card>
    );
  }

  // Transform events by type for chart
  const eventsByTypeData = Object.entries(data.events_by_type || {})
    .map(([name, count]) => ({ name: formatEventName(name), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Transform platform distribution for pie chart
  const platformData = Object.entries(data.platform_distribution || {})
    .map(([name, value]) => ({ name: formatPlatformName(name), value }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Events by Type */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">События по типам</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eventsByTypeData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value.toLocaleString(), 'Событий']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Platform Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Платформы</CardTitle>
        </CardHeader>
        <CardContent>
          {platformData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${String(name || '')} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {platformData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Top Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Топ событий</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.top_events?.slice(0, 6).map((event, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm truncate max-w-[150px]">
                  {formatEventName(event.event_name)}
                </span>
                <div className="text-right">
                  <span className="text-sm font-medium">{event.count.toLocaleString()}</span>
                  {event.avg_duration_ms && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {event.avg_duration_ms.toFixed(0)}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Статистика сессий</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{data.unique_users.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Уникальных пользователей</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data.unique_sessions.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Сессий</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {data.avg_session_duration_sec 
                  ? formatDuration(data.avg_session_duration_sec)
                  : '—'}
              </p>
              <p className="text-sm text-muted-foreground">Ср. длительность</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatEventName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .slice(0, 20);
}

function formatPlatformName(name: string): string {
  const map: Record<string, string> = {
    'telegram': 'Telegram',
    'web': 'Web',
    'ios': 'iOS',
    'android': 'Android',
  };
  return map[name.toLowerCase()] || name;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}с`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}м`;
  return `${(seconds / 3600).toFixed(1)}ч`;
}
