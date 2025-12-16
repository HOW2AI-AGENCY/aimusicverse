/**
 * Generation Analytics Panel
 * Displays comprehensive generation statistics with charts
 */

import { useState } from 'react';
import { 
  BarChart3, Clock, DollarSign, Music, Tag, 
  TrendingUp, Loader2, RefreshCw, Cpu
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerationAnalytics, type GenerationAnalytics } from '@/hooks/useGenerationAnalytics';
import { cn } from '@/lib/utils';

type TimePeriod = '7 days' | '30 days' | '90 days' | '365 days';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  trend,
  className,
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  description?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}) {
  return (
    <Card className={cn("bg-card/50", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className={cn(
            "mt-2 text-xs font-medium flex items-center gap-1",
            trend.positive ? "text-green-500" : "text-red-500"
          )}>
            <TrendingUp className={cn("w-3 h-3", !trend.positive && "rotate-180")} />
            {trend.positive ? '+' : ''}{trend.value}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StylesChart({ styles }: { styles: GenerationAnalytics['top_styles'] }) {
  const maxCount = Math.max(...styles.map(s => s.count), 1);
  
  return (
    <div className="space-y-3">
      {styles.slice(0, 10).map((style, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate max-w-[200px]" title={style.style}>
              {style.style}
            </span>
            <span className="text-muted-foreground font-mono">{style.count}</span>
          </div>
          <Progress value={(style.count / maxCount) * 100} className="h-2" />
        </div>
      ))}
      {styles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Нет данных о стилях
        </p>
      )}
    </div>
  );
}

function GenresChart({ genres }: { genres: GenerationAnalytics['top_genres'] }) {
  const colors = [
    'bg-primary', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-cyan-500',
    'bg-red-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500',
  ];
  const total = genres.reduce((sum, g) => sum + g.count, 0);
  
  return (
    <div className="space-y-4">
      {/* Simple bar visualization */}
      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
        {genres.map((genre, i) => (
          <div
            key={genre.genre}
            className={cn(colors[i % colors.length], "transition-all")}
            style={{ width: `${(genre.count / total) * 100}%` }}
            title={`${genre.genre}: ${genre.count}`}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {genres.map((genre, i) => (
          <div key={genre.genre} className="flex items-center gap-2 text-sm">
            <div className={cn("w-3 h-3 rounded-full", colors[i % colors.length])} />
            <span className="truncate">{genre.genre}</span>
            <span className="text-muted-foreground ml-auto font-mono text-xs">
              {Math.round((genre.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TagsCloud({ tags }: { tags: GenerationAnalytics['top_tags'] }) {
  const maxUsage = Math.max(...tags.map(t => t.usage_count), 1);
  
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const intensity = tag.usage_count / maxUsage;
        return (
          <Badge
            key={tag.tag}
            variant="secondary"
            className={cn(
              "transition-all cursor-default",
              intensity > 0.7 && "bg-primary/20 text-primary",
              intensity > 0.4 && intensity <= 0.7 && "bg-primary/10",
            )}
            style={{ 
              fontSize: `${0.75 + intensity * 0.25}rem`,
            }}
          >
            {tag.tag}
            <span className="ml-1 text-[10px] opacity-70">{tag.usage_count}</span>
          </Badge>
        );
      })}
      {tags.length === 0 && (
        <p className="text-sm text-muted-foreground">Нет данных о тегах</p>
      )}
    </div>
  );
}

function ModelDistribution({ models }: { models: GenerationAnalytics['model_distribution'] }) {
  const total = models.reduce((sum, m) => sum + m.count, 0);
  
  return (
    <div className="space-y-3">
      {models.map((model) => {
        const successRate = model.count > 0 ? (model.successful / model.count) * 100 : 0;
        return (
          <div key={model.model} className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{model.model}</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {model.count} ({Math.round((model.count / total) * 100)}%)
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Успешность: <span className={cn(
                  "font-medium",
                  successRate >= 90 ? "text-green-500" : 
                  successRate >= 70 ? "text-yellow-500" : "text-red-500"
                )}>{successRate.toFixed(1)}%</span>
              </div>
              <div>
                Ср. время: <span className="font-medium text-foreground">
                  {model.avg_time_seconds?.toFixed(1) || 0}с
                </span>
              </div>
            </div>
          </div>
        );
      })}
      {models.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Нет данных о моделях
        </p>
      )}
    </div>
  );
}

function CostBreakdown({ costs }: { costs: GenerationAnalytics['cost_by_service'] }) {
  return (
    <div className="space-y-2">
      {costs.map((service) => (
        <div 
          key={service.service} 
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <div>
            <p className="font-medium text-sm">{service.service}</p>
            <p className="text-xs text-muted-foreground">
              {service.requests} запросов • {service.avg_duration_ms}мс
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono font-medium">${service.total_cost.toFixed(4)}</p>
          </div>
        </div>
      ))}
      {costs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Нет данных о затратах
        </p>
      )}
    </div>
  );
}

function HourlyDistribution({ hours }: { hours: Record<string, number> }) {
  const maxValue = Math.max(...Object.values(hours), 1);
  const hourLabels = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Активность по часам (UTC)</p>
      <div className="flex items-end gap-0.5 h-16">
        {hourLabels.map((hour) => {
          const value = hours[hour] || 0;
          const height = (value / maxValue) * 100;
          return (
            <div
              key={hour}
              className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors cursor-default"
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${hour}:00 - ${value} генераций`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>00:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

export function GenerationAnalyticsPanel() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30 days');
  const { data, isLoading, error, refetch, isRefetching } = useGenerationAnalytics(timePeriod);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Ошибка загрузки аналитики</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Повторить
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const successRate = data.total_generations > 0 
    ? (data.successful_generations / data.total_generations) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Аналитика генерации</h2>
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7 days">7 дней</SelectItem>
              <SelectItem value="30 days">30 дней</SelectItem>
              <SelectItem value="90 days">90 дней</SelectItem>
              <SelectItem value="365 days">1 год</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Всего генераций"
          value={data.total_generations}
          icon={BarChart3}
          description={`${data.successful_generations} успешных`}
        />
        <StatCard
          title="Успешность"
          value={`${successRate.toFixed(1)}%`}
          icon={TrendingUp}
          description={`${data.failed_generations} неудачных`}
        />
        <StatCard
          title="Ср. время"
          value={`${data.avg_generation_time_seconds.toFixed(1)}с`}
          icon={Clock}
          description={`${data.total_generation_time_minutes.toFixed(0)} мин всего`}
        />
        <StatCard
          title="Затраты"
          value={`$${data.total_estimated_cost.toFixed(2)}`}
          icon={DollarSign}
          description={`$${data.avg_cost_per_generation.toFixed(4)} за трек`}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="styles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="styles" className="gap-1.5">
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">Стили</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-1.5">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Теги</span>
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-1.5">
            <Cpu className="w-4 h-4" />
            <span className="hidden sm:inline">Модели</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Затраты</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="styles" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Популярные стили</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <StylesChart styles={data.top_styles} />
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Распределение жанров</CardTitle>
              </CardHeader>
              <CardContent>
                <GenresChart genres={data.top_genres} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Облако тегов</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsCloud tags={data.top_tags} />
            </CardContent>
          </Card>
          
          {data.tag_combinations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Популярные комбинации</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.tag_combinations.map((combo, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <span>{combo.tag_combo}</span>
                      <Badge variant="secondary">{combo.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Использование моделей</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelDistribution models={data.model_distribution} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Активность по времени</CardTitle>
              </CardHeader>
              <CardContent>
                <HourlyDistribution hours={data.generations_by_hour} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Затраты по сервисам</CardTitle>
            </CardHeader>
            <CardContent>
              <CostBreakdown costs={data.cost_by_service} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
