/**
 * Retention Analytics Panel
 * Visualizes user retention metrics and cohort analysis
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, UserCheck, UserMinus, TrendingUp, Calendar, Repeat } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface RetentionData {
  day: string;
  d1: number;
  d7: number;
  d14: number;
  d30: number;
}

interface CohortData {
  cohort: string;
  users: number;
  d1: number;
  d7: number;
  d14: number;
  d30: number;
}

interface RetentionPanelProps {
  timePeriod?: string;
  isLoading?: boolean;
}

// Mock data - in production, fetch from analytics backend
const MOCK_RETENTION_TREND: RetentionData[] = [
  { day: "01 янв", d1: 45, d7: 28, d14: 22, d30: 18 },
  { day: "08 янв", d1: 48, d7: 30, d14: 24, d30: 19 },
  { day: "15 янв", d1: 52, d7: 33, d14: 26, d30: 21 },
  { day: "22 янв", d1: 50, d7: 32, d14: 25, d30: 20 },
  { day: "29 янв", d1: 55, d7: 35, d14: 28, d30: 22 },
];

const MOCK_COHORTS: CohortData[] = [
  { cohort: "Янв W1", users: 1250, d1: 45.2, d7: 28.4, d14: 22.1, d30: 18.5 },
  { cohort: "Янв W2", users: 1380, d1: 48.1, d7: 30.2, d14: 24.3, d30: 19.8 },
  { cohort: "Янв W3", users: 1520, d1: 52.3, d7: 33.1, d14: 26.0, d30: 21.2 },
  { cohort: "Янв W4", users: 1450, d1: 50.8, d7: 32.5, d14: 25.4, d30: 0 },
  { cohort: "Фев W1", users: 1680, d1: 55.2, d7: 35.8, d14: 0, d30: 0 },
];

export function RetentionPanel({ timePeriod, isLoading }: RetentionPanelProps) {
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const latestCohort = MOCK_COHORTS[MOCK_COHORTS.length - 2]; // Skip incomplete
    const avgD1 = MOCK_COHORTS.slice(0, -1).reduce((sum, c) => sum + c.d1, 0) / (MOCK_COHORTS.length - 1);
    const avgD7 = MOCK_COHORTS.slice(0, -2).reduce((sum, c) => sum + c.d7, 0) / (MOCK_COHORTS.length - 2);

    return {
      currentD1: latestCohort.d1,
      currentD7: latestCohort.d7,
      avgD1: avgD1.toFixed(1),
      avgD7: avgD7.toFixed(1),
      totalNewUsers: MOCK_COHORTS.reduce((sum, c) => sum + c.users, 0),
      trend: (((latestCohort.d1 - avgD1) / avgD1) * 100).toFixed(1),
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <StatCard
          icon={Users}
          label="Новых пользователей"
          value={summaryStats.totalNewUsers.toLocaleString()}
          iconColor="text-blue-500"
        />
        <StatCard
          icon={UserCheck}
          label="D1 Retention"
          value={`${summaryStats.currentD1}%`}
          subtext={`Среднее: ${summaryStats.avgD1}%`}
          iconColor="text-green-500"
        />
        <StatCard
          icon={Repeat}
          label="D7 Retention"
          value={`${summaryStats.currentD7}%`}
          subtext={`Среднее: ${summaryStats.avgD7}%`}
          iconColor="text-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Тренд"
          value={`${Number(summaryStats.trend) >= 0 ? "+" : ""}${summaryStats.trend}%`}
          iconColor={Number(summaryStats.trend) >= 0 ? "text-green-500" : "text-red-500"}
        />
      </div>

      {/* Retention Trend Chart */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            Динамика удержания
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Процент пользователей, вернувшихся через N дней
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[200px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_RETENTION_TREND}>
                <defs>
                  <linearGradient id="colorD1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorD7" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: any) => {
                    const labels: Record<string, string> = {
                      d1: "Day 1",
                      d7: "Day 7",
                      d14: "Day 14",
                      d30: "Day 30",
                    };
                    return [`${value}%`, labels[name] || name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="d1"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorD1)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="d7"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorD7)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cohort Table */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Когортный анализ
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Удержание по неделям регистрации</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="overflow-x-auto -mx-2 sm:mx-0 touch-pan-x">
            <table className="w-full text-xs sm:text-sm min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 sm:py-3 px-1.5 sm:px-2 font-medium">Когорта</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-medium">Юзеров</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-medium">D1</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-medium">D7</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-medium hidden xs:table-cell">D14</th>
                  <th className="text-right py-2 sm:py-3 px-1.5 sm:px-2 font-medium hidden sm:table-cell">D30</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_COHORTS.map((cohort) => (
                  <tr key={cohort.cohort} className="border-b last:border-0">
                    <td className="py-2 sm:py-3 px-1.5 sm:px-2 font-medium text-xs sm:text-sm">{cohort.cohort}</td>
                    <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-right text-muted-foreground">
                      {cohort.users.toLocaleString()}
                    </td>
                    <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-right">
                      <RetentionCell value={cohort.d1} />
                    </td>
                    <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-right">
                      <RetentionCell value={cohort.d7} />
                    </td>
                    <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-right hidden xs:table-cell">
                      <RetentionCell value={cohort.d14} />
                    </td>
                    <td className="py-2 sm:py-3 px-1.5 sm:px-2 text-right hidden sm:table-cell">
                      <RetentionCell value={cohort.d30} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RetentionCell({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const getColor = (v: number) => {
    if (v >= 40) return "bg-green-500/20 text-green-500";
    if (v >= 25) return "bg-yellow-500/20 text-yellow-500";
    if (v >= 15) return "bg-orange-500/20 text-orange-500";
    return "bg-red-500/20 text-red-500";
  };

  return <Badge className={cn("font-mono", getColor(value))}>{value.toFixed(1)}%</Badge>;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  iconColor: string;
}

function StatCard({ icon: Icon, label, value, subtext, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-2.5 sm:p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{value}</p>
            {subtext && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{subtext}</p>
            )}
          </div>
          <Icon className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}
