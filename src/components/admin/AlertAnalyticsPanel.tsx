import { useMemo } from 'react';
import { useHealthAlerts } from '@/hooks/useHealthAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieChartIcon, 
  BarChart3, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format, startOfDay, subDays, differenceInMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';

const COLORS = {
  unhealthy: 'hsl(var(--destructive))',
  degraded: 'hsl(45, 93%, 47%)',
  healthy: 'hsl(142, 76%, 36%)',
};

const SERVICE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(45, 93%, 47%)',
  'hsl(142, 76%, 36%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
];

export function AlertAnalyticsPanel() {
  const { data: alerts = [], isLoading } = useHealthAlerts(500);

  // Aggregate data by day for last 30 days
  const dailyTrends = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      return {
        date: format(date, 'dd.MM', { locale: ru }),
        fullDate: date,
        unhealthy: 0,
        degraded: 0,
        total: 0,
      };
    });

    alerts.filter(a => !a.is_test).forEach((alert) => {
      const alertDate = startOfDay(new Date(alert.created_at));
      const dayData = last30Days.find(
        (d) => d.fullDate.getTime() === alertDate.getTime()
      );
      if (dayData) {
        dayData.total++;
        if (alert.overall_status === 'unhealthy') {
          dayData.unhealthy++;
        } else if (alert.overall_status === 'degraded') {
          dayData.degraded++;
        }
      }
    });

    return last30Days.map(({ fullDate, ...rest }) => rest);
  }, [alerts]);

  // Service breakdown
  const serviceBreakdown = useMemo(() => {
    const services: Record<string, number> = {};
    
    alerts.filter(a => !a.is_test).forEach((alert) => {
      [...(alert.unhealthy_services || []), ...(alert.degraded_services || [])].forEach((service) => {
        services[service] = (services[service] || 0) + 1;
      });
    });

    return Object.entries(services)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [alerts]);

  // Hourly distribution
  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count: 0,
    }));

    alerts.filter(a => !a.is_test).forEach((alert) => {
      const hour = new Date(alert.created_at).getHours();
      hours[hour].count++;
    });

    return hours;
  }, [alerts]);

  // Resolution time analysis
  const resolutionStats = useMemo(() => {
    const resolved = alerts.filter((a) => a.resolved_at && !a.is_test);
    if (resolved.length === 0) {
      return { avg: 0, min: 0, max: 0, data: [] };
    }

    const times = resolved.map((a) => 
      differenceInMinutes(new Date(a.resolved_at!), new Date(a.created_at))
    );

    // Group resolution times
    const buckets = [
      { label: '<5 мин', max: 5, count: 0 },
      { label: '5-15 мин', max: 15, count: 0 },
      { label: '15-30 мин', max: 30, count: 0 },
      { label: '30-60 мин', max: 60, count: 0 },
      { label: '>1 час', max: Infinity, count: 0 },
    ];

    times.forEach((t) => {
      const bucket = buckets.find((b) => t <= b.max);
      if (bucket) bucket.count++;
    });

    return {
      avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      min: Math.min(...times),
      max: Math.max(...times),
      data: buckets,
    };
  }, [alerts]);

  // Weekly pattern
  const weeklyPattern = useMemo(() => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((name) => ({
      name,
      count: 0,
    }));

    alerts.filter(a => !a.is_test).forEach((alert) => {
      let dayIndex = new Date(alert.created_at).getDay() - 1;
      if (dayIndex < 0) dayIndex = 6; // Sunday
      days[dayIndex].count++;
    });

    return days;
  }, [alerts]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-[250px]" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trends Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Тренд инцидентов (30 дней)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="unhealthy"
                name="Critical"
                stackId="1"
                stroke={COLORS.unhealthy}
                fill={COLORS.unhealthy}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="degraded"
                name="Warning"
                stackId="1"
                stroke={COLORS.degraded}
                fill={COLORS.degraded}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Service Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Проблемные сервисы
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceBreakdown.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Нет данных
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {serviceBreakdown.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={SERVICE_COLORS[index % SERVICE_COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Распределение по часам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Алертов"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Pattern */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Паттерн по дням недели
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyPattern}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  name="Инцидентов"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resolution Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Время решения
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolutionStats.data.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Нет решённых инцидентов
              </div>
            ) : (
              <>
                <div className="flex justify-around mb-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{resolutionStats.avg}</div>
                    <div className="text-xs text-muted-foreground">Среднее (мин)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">{resolutionStats.min}</div>
                    <div className="text-xs text-muted-foreground">Мин (мин)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">{resolutionStats.max}</div>
                    <div className="text-xs text-muted-foreground">Макс (мин)</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={resolutionStats.data} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="label" 
                      tick={{ fontSize: 11 }} 
                      width={70}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Инцидентов"
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
