/**
 * Generation Stats Panel
 * Shows music generation statistics and trends
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { GenerationAnalytics } from '@/hooks/useGenerationAnalytics';

interface GenerationStatsPanelProps {
  data: GenerationAnalytics | null | undefined;
  isLoading: boolean;
}

const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981'];

export function GenerationStatsPanel({ data, isLoading }: GenerationStatsPanelProps) {
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
          Нет данных о генерациях за выбранный период
        </CardContent>
      </Card>
    );
  }

  const successRate = data.total_generations > 0
    ? (data.successful_generations / data.total_generations) * 100
    : 0;

  // Format generations by day
  const generationsByDayData = (data.generations_by_day || []).map(d => ({
    ...d,
    day: new Date(d.day).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })
  }));

  // Top styles for pie chart - transform to chart-compatible format
  const topStylesData = (data.top_styles || []).slice(0, 6).map(s => ({
    name: s.style,
    value: s.count
  }));

  // Top tags
  const topTagsData = (data.top_tags || []).slice(0, 8);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Успешность генераций</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{successRate.toFixed(1)}%</span>
              <Badge variant={successRate > 90 ? 'default' : successRate > 70 ? 'secondary' : 'destructive'}>
                {successRate > 90 ? 'Отлично' : successRate > 70 ? 'Хорошо' : 'Требует внимания'}
              </Badge>
            </div>
            <Progress value={successRate} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-green-500">{data.successful_generations}</p>
                <p className="text-xs text-muted-foreground">Успешных</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-red-500">{data.failed_generations}</p>
                <p className="text-xs text-muted-foreground">Неудачных</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Стоимость</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold">${data.total_estimated_cost.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Общая стоимость</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-semibold">${data.avg_cost_per_generation.toFixed(3)}</p>
                <p className="text-xs text-muted-foreground">Ср. за генерацию</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{data.total_generation_time_minutes.toFixed(0)} мин</p>
                <p className="text-xs text-muted-foreground">Общее время</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generations by Day */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Генерации по дням</CardTitle>
        </CardHeader>
        <CardContent>
          {generationsByDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={generationsByDayData}>
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="completed" stackId="a" fill="#10b981" name="Успешные" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Неудачные" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Top Styles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Популярные стили</CardTitle>
        </CardHeader>
        <CardContent>
          {topStylesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={topStylesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => 
                    `${String(name || '').slice(0, 10)} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {topStylesData.map((_, index) => (
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

      {/* Top Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Популярные теги</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topTagsData.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag.tag}
                <span className="ml-1 opacity-60">×{tag.usage_count}</span>
              </Badge>
            ))}
          </div>
          {topTagsData.length === 0 && (
            <p className="text-center text-muted-foreground py-4">Нет данных</p>
          )}
        </CardContent>
      </Card>

      {/* Model Distribution */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Использование моделей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.model_distribution || []).map((model, i) => {
              const modelSuccessRate = model.count > 0 ? (model.successful / model.count) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{model.model || 'Unknown'}</span>
                    <span className="text-muted-foreground">
                      {model.count} генераций • {model.avg_time_seconds.toFixed(1)}с avg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={modelSuccessRate} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-12">{modelSuccessRate.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
