import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Play,
  Heart,
  MessageSquare,
  Cpu,
  Globe,
  Smartphone,
  Zap,
  UserPlus,
  Music,
} from "lucide-react";
import {
  useModelUsageStats,
  useGenerationModeStats,
  useActiveUsersStats,
  useErrorDistribution,
  useContentStats,
  useSourceDistribution,
} from "@/hooks/useEnhancedAnalytics";
import { GenerationAnalyticsPanel } from "./GenerationAnalyticsPanel";
import { RetentionHeatmap } from "./RetentionHeatmap";
import { FunnelVisualization } from "./FunnelVisualization";

const MODE_LABELS: Record<string, string> = {
  standard: 'Стандарт',
  custom: 'Custom',
  upload_cover: 'Кавер',
  upload_extend: 'Расширение',
  extend: 'Extend',
  replace_section: 'Замена секции',
  remix: 'Ремикс',
};

const SOURCE_LABELS: Record<string, string> = {
  mini_app: 'Mini App',
  telegram: 'Telegram Bot',
  web: 'Web',
};

export function EnhancedAnalyticsPanel() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  const { data: modelStats } = useModelUsageStats(timeRange);
  const { data: modeStats } = useGenerationModeStats(timeRange);
  const { data: activeUsers } = useActiveUsersStats();
  const { data: errorStats } = useErrorDistribution(timeRange);
  const { data: contentStats } = useContentStats();
  const { data: sourceStats } = useSourceDistribution(timeRange);

  return (
    <Tabs defaultValue="overview" className="space-y-3">
      <TabsList className="grid w-full grid-cols-4 h-9">
        <TabsTrigger value="overview" className="gap-1.5 text-xs">
          <BarChart3 className="w-3.5 h-3.5" />
          Обзор
        </TabsTrigger>
        <TabsTrigger value="generation" className="gap-1.5 text-xs">
          <Music className="w-3.5 h-3.5" />
          Генерация
        </TabsTrigger>
        <TabsTrigger value="funnel" className="gap-1.5 text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          Воронка
        </TabsTrigger>
        <TabsTrigger value="retention" className="gap-1.5 text-xs">
          <Users className="w-3.5 h-3.5" />
          Retention
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-3">
        {/* Time Range Selector */}
        <div className="flex justify-end">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 часа</SelectItem>
              <SelectItem value="7d">7 дней</SelectItem>
              <SelectItem value="30d">30 дней</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* Active Users Stats */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            Активность
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
            <StatBox
              label="DAU"
              value={activeUsers?.daily_active || 0}
              icon={<Zap className="h-3 w-3 text-yellow-500" />}
              color="yellow"
            />
            <StatBox
              label="WAU"
              value={activeUsers?.weekly_active || 0}
              icon={<TrendingUp className="h-3 w-3 text-blue-500" />}
              color="blue"
            />
            <StatBox
              label="MAU"
              value={activeUsers?.monthly_active || 0}
              icon={<Users className="h-3 w-3 text-purple-500" />}
              color="purple"
            />
            <StatBox
              label="Новых"
              value={activeUsers?.new_today || 0}
              icon={<UserPlus className="h-3 w-3 text-green-500" />}
              color="green"
            />
            <StatBox
              label="За нед."
              value={activeUsers?.new_this_week || 0}
              icon={<UserPlus className="h-3 w-3 text-emerald-500" />}
              color="emerald"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Stats */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Play className="h-4 w-4 text-primary" />
            Контент
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 sm:gap-2">
            <StatBox
              label="Прослуш."
              value={contentStats?.total_plays || 0}
              icon={<Play className="h-3 w-3 text-blue-500" />}
              color="blue"
            />
            <StatBox
              label="Лайков"
              value={contentStats?.total_likes || 0}
              icon={<Heart className="h-3 w-3 text-red-500" />}
              color="red"
            />
            <StatBox
              label="Коммент."
              value={contentStats?.total_comments || 0}
              icon={<MessageSquare className="h-3 w-3 text-green-500" />}
              color="green"
            />
            <StatBox
              label="Ср. просл."
              value={(contentStats?.avg_plays_per_track || 0).toFixed(1)}
              icon={<BarChart3 className="h-3 w-3 text-purple-500" />}
              color="purple"
            />
            <StatBox
              label="Публ."
              value={`${(contentStats?.public_tracks_percentage || 0).toFixed(0)}%`}
              icon={<Globe className="h-3 w-3 text-cyan-500" />}
              color="cyan"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Model Usage */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-primary" />
              Модели
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[160px]">
              <div className="space-y-2">
                {modelStats?.map((stat) => (
                  <div key={stat.model} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[120px]">{stat.model}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1">{stat.count}</Badge>
                        <Badge 
                          variant={stat.success_rate >= 80 ? "default" : stat.success_rate >= 50 ? "secondary" : "destructive"}
                          className="text-[10px] h-5 px-1"
                        >
                          {stat.success_rate.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={stat.success_rate} className="h-1" />
                  </div>
                ))}
                {(!modelStats || modelStats.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Generation Modes */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-primary" />
              Режимы
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[160px]">
              <div className="space-y-2">
                {modeStats?.map((stat) => (
                  <div key={stat.mode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{MODE_LABELS[stat.mode] || stat.mode}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1">{stat.count}</Badge>
                        <span className="text-[10px] text-muted-foreground">{stat.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-1" />
                  </div>
                ))}
                {(!modeStats || modeStats.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Error Distribution */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Ошибки
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[160px]">
              <div className="space-y-2">
                {errorStats?.map((stat) => (
                  <div key={stat.error_type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[100px]">{stat.error_type}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="destructive" className="text-[10px] h-5 px-1">{stat.count}</Badge>
                        <span className="text-[10px] text-muted-foreground">{stat.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-1 [&>div]:bg-destructive" />
                  </div>
                ))}
                {(!errorStats || errorStats.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">Нет ошибок</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-primary" />
              Источники
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[160px]">
              <div className="space-y-2">
                {sourceStats?.map((stat) => (
                  <div key={stat.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{SOURCE_LABELS[stat.source] || stat.source}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1">{stat.count}</Badge>
                        <span className="text-[10px] text-muted-foreground">{stat.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-1" />
                  </div>
                ))}
                {(!sourceStats || sourceStats.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      </TabsContent>

      <TabsContent value="generation">
        <GenerationAnalyticsPanel />
      </TabsContent>

      <TabsContent value="funnel">
        <FunnelVisualization />
      </TabsContent>

      <TabsContent value="retention">
        <RetentionHeatmap />
      </TabsContent>
    </Tabs>
  );
}

function StatBox({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-500/10',
    blue: 'bg-blue-500/10',
    purple: 'bg-purple-500/10',
    green: 'bg-green-500/10',
    emerald: 'bg-emerald-500/10',
    red: 'bg-red-500/10',
    cyan: 'bg-cyan-500/10',
  };

  return (
    <div className={`p-2 rounded-lg ${colorClasses[color] || 'bg-muted/50'} text-center`}>
      <div className="flex items-center justify-center mb-0.5">
        {icon}
      </div>
      <div className="text-sm md:text-lg font-bold">{value}</div>
      <div className="text-[10px] md:text-xs text-muted-foreground truncate">{label}</div>
    </div>
  );
}
