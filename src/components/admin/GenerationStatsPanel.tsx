/**
 * Generation Statistics Panel for Admin Dashboard
 *
 * Displays aggregated generation statistics from user_generation_stats table
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  Music,
  Mic,
  Guitar,
  Scissors,
  Layers,
  RefreshCw,
  Coins,
  Users,
  CheckCircle,
  BarChart3,
} from "@/lib/icons";
import { format } from "@/lib/date-utils";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  useAggregatedGenerationStats,
  useDailyGenerationStats,
  useTopGenerationUsers,
} from "@/hooks/admin/useGenerationStats";

const TIME_PERIODS = [
  { value: "7", label: "Последние 7 дней" },
  { value: "14", label: "Последние 14 дней" },
  { value: "30", label: "Последние 30 дней" },
  { value: "90", label: "Последние 90 дней" },
];

export function GenerationStatsPanel() {
  const [days, setDays] = useState("7");
  const daysNumber = parseInt(days);

  const { data: stats, isLoading: statsLoading, refetch } = useAggregatedGenerationStats(daysNumber);
  const { data: dailyStats } = useDailyGenerationStats(daysNumber);
  const { data: topUsers } = useTopGenerationUsers(daysNumber);

  const successRate =
    stats && stats.total_generations > 0 ? ((stats.total_successful / stats.total_generations) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-base md:text-xl font-bold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
            <span className="truncate">Генерации</span>
          </h2>
          <p className="text-[0.625rem] md:text-sm text-muted-foreground">Агрегированные данные</p>
        </div>
        <div className="flex gap-1.5">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[100px] md:w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => refetch()}>
            <RefreshCw className={`h-3.5 w-3.5 ${statsLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Stats Grid - compact for mobile */}
      <div className="grid grid-cols-4 gap-1.5 md:gap-3">
        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-primary/10 w-fit mx-auto mb-1">
                <Activity className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
              <div className="text-sm md:text-xl font-bold">{stats?.total_generations?.toLocaleString() || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Ген.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-green-500/10 w-fit mx-auto mb-1">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
              </div>
              <div className="text-sm md:text-xl font-bold text-green-600">{successRate}%</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Усп.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-blue-500/10 w-fit mx-auto mb-1">
                <Users className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
              </div>
              <div className="text-sm md:text-xl font-bold">{stats?.unique_users || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Юзеров</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2 md:p-3">
            <div className="text-center">
              <div className="p-1 md:p-1.5 rounded-lg bg-amber-500/10 w-fit mx-auto mb-1">
                <Coins className="h-3 w-3 md:h-4 md:w-4 text-amber-500" />
              </div>
              <div className="text-sm md:text-xl font-bold">{stats?.total_credits_spent?.toLocaleString() || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Кред.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Types Breakdown */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="text-xs md:text-sm">По типам</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-6 gap-1">
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Music className="h-3 w-3 md:h-4 md:w-4 mx-auto text-violet-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_music || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Муз.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Mic className="h-3 w-3 md:h-4 md:w-4 mx-auto text-pink-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_vocals || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Вок.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Guitar className="h-3 w-3 md:h-4 md:w-4 mx-auto text-orange-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_instrumental || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Инстр.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mx-auto text-cyan-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_extend || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Ext.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Scissors className="h-3 w-3 md:h-4 md:w-4 mx-auto text-green-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_stems || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Стем.</div>
            </div>
            <div className="p-1.5 md:p-2 rounded-lg bg-muted/50 text-center">
              <Layers className="h-3 w-3 md:h-4 md:w-4 mx-auto text-indigo-500" />
              <div className="text-xs md:text-sm font-bold">{stats?.total_cover || 0}</div>
              <div className="text-[0.5rem] md:text-[0.625rem] text-muted-foreground">Кав.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {/* Daily Breakdown */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm">По дням</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[180px] md:h-[250px]">
              <div className="space-y-1.5">
                {dailyStats?.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/50">
                    <div>
                      <div className="font-medium text-xs">{format(new Date(day.date), "dd MMM")}</div>
                      <div className="text-[0.625rem] text-muted-foreground">
                        <span className="text-green-600">✓{day.successful_count}</span>
                        {day.failed_count > 0 && <span className="text-red-500 ml-1">✗{day.failed_count}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[0.625rem] h-5 px-1.5">
                      {day.generations_count}
                    </Badge>
                  </div>
                ))}
                {(!dailyStats || dailyStats.length === 0) && (
                  <div className="text-center text-muted-foreground py-6 text-xs">Нет данных</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-xs md:text-sm">Топ юзеров</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[180px] md:h-[250px]">
              <div className="space-y-1.5">
                {topUsers?.map((user, idx) => (
                  <div key={user.user_id} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-muted/50">
                    <span className="text-[0.625rem] text-muted-foreground w-3">{idx + 1}</span>
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[0.625rem] font-medium overflow-hidden flex-shrink-0">
                      {user.photo_url ? (
                        <LazyImage src={user.photo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.first_name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{user.first_name}</div>
                      {user.username && (
                        <div className="text-[0.625rem] text-muted-foreground truncate">@{user.username}</div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[0.625rem] h-5 px-1.5">
                      {user.total_generations}
                    </Badge>
                  </div>
                ))}
                {(!topUsers || topUsers.length === 0) && (
                  <div className="text-center text-muted-foreground py-6 text-xs">Нет данных</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
