import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  UserPlus
} from "lucide-react";
import {
  useModelUsageStats,
  useGenerationModeStats,
  useActiveUsersStats,
  useErrorDistribution,
  useContentStats,
  useSourceDistribution,
} from "@/hooks/useEnhancedAnalytics";

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
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <SelectTrigger className="w-[140px]">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Активность пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatBox
              label="DAU"
              value={activeUsers?.daily_active || 0}
              icon={<Zap className="h-4 w-4 text-yellow-500" />}
              color="yellow"
            />
            <StatBox
              label="WAU"
              value={activeUsers?.weekly_active || 0}
              icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
              color="blue"
            />
            <StatBox
              label="MAU"
              value={activeUsers?.monthly_active || 0}
              icon={<Users className="h-4 w-4 text-purple-500" />}
              color="purple"
            />
            <StatBox
              label="Новых сегодня"
              value={activeUsers?.new_today || 0}
              icon={<UserPlus className="h-4 w-4 text-green-500" />}
              color="green"
            />
            <StatBox
              label="Новых за неделю"
              value={activeUsers?.new_this_week || 0}
              icon={<UserPlus className="h-4 w-4 text-emerald-500" />}
              color="emerald"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Контент
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatBox
              label="Прослушиваний"
              value={contentStats?.total_plays || 0}
              icon={<Play className="h-4 w-4 text-blue-500" />}
              color="blue"
            />
            <StatBox
              label="Лайков"
              value={contentStats?.total_likes || 0}
              icon={<Heart className="h-4 w-4 text-red-500" />}
              color="red"
            />
            <StatBox
              label="Комментариев"
              value={contentStats?.total_comments || 0}
              icon={<MessageSquare className="h-4 w-4 text-green-500" />}
              color="green"
            />
            <StatBox
              label="Ср. прослушиваний"
              value={(contentStats?.avg_plays_per_track || 0).toFixed(1)}
              icon={<BarChart3 className="h-4 w-4 text-purple-500" />}
              color="purple"
            />
            <StatBox
              label="% публичных"
              value={`${(contentStats?.public_tracks_percentage || 0).toFixed(1)}%`}
              icon={<Globe className="h-4 w-4 text-cyan-500" />}
              color="cyan"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Model Usage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Использование моделей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {modelStats?.map((stat) => (
                  <div key={stat.model} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stat.model}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{stat.count}</Badge>
                        <Badge 
                          variant={stat.success_rate >= 80 ? "default" : stat.success_rate >= 50 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {stat.success_rate.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={stat.success_rate} className="h-1.5" />
                  </div>
                ))}
                {(!modelStats || modelStats.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Generation Modes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Режимы генерации
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {modeStats?.map((stat) => (
                  <div key={stat.mode} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{MODE_LABELS[stat.mode] || stat.mode}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{stat.count}</Badge>
                        <span className="text-xs text-muted-foreground">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-1.5" />
                  </div>
                ))}
                {(!modeStats || modeStats.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Error Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Распределение ошибок
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {errorStats?.map((stat) => (
                  <div key={stat.error_type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stat.error_type}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">{stat.count}</Badge>
                        <span className="text-xs text-muted-foreground">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-1.5 [&>div]:bg-destructive" />
                  </div>
                ))}
                {(!errorStats || errorStats.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет ошибок</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Источники генераций
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {sourceStats?.map((stat) => (
                  <div key={stat.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{SOURCE_LABELS[stat.source] || stat.source}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{stat.count}</Badge>
                        <span className="text-xs text-muted-foreground">{stat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={stat.percentage} className="h-1.5" />
                  </div>
                ))}
                {(!sourceStats || sourceStats.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
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
    <div className={`p-3 rounded-lg ${colorClasses[color] || 'bg-muted/50'} text-center`}>
      <div className="flex items-center justify-center mb-1">
        {icon}
      </div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
