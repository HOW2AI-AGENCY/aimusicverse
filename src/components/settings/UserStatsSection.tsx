/**
 * User Statistics Section for Settings page
 * 
 * Displays user's generation statistics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserGenerationStats } from '@/hooks/useUserGenerationStats';
import { 
  Activity, 
  Music, 
  Mic, 
  Guitar, 
  TrendingUp, 
  Scissors, 
  Layers, 
  Coins,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { motion } from '@/lib/motion';

export function UserStatsSection() {
  const { data: stats, isLoading } = useUserGenerationStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Статистика генераций
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Статистика генераций
          </CardTitle>
          <CardDescription>
            Здесь будет отображаться ваша статистика после первых генераций
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Today Stats - compact */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Calendar className="w-3.5 h-3.5" />
            Сегодня
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Activity className="w-3.5 h-3.5 mx-auto text-primary" />
              <div className="text-base font-bold">{stats.today.generations}</div>
              <div className="text-[9px] text-muted-foreground">Ген.</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <CheckCircle className="w-3.5 h-3.5 mx-auto text-green-500" />
              <div className="text-base font-bold text-green-600">{stats.today.successful}</div>
              <div className="text-[9px] text-muted-foreground">Усп.</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Coins className="w-3.5 h-3.5 mx-auto text-amber-500" />
              <div className="text-base font-bold">${stats.today.cost.toFixed(1)}</div>
              <div className="text-[9px] text-muted-foreground">Расход</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <TrendingUp className="w-3.5 h-3.5 mx-auto text-blue-500" />
              <div className="text-base font-bold">
                {stats.today.generations > 0 
                  ? Math.round((stats.today.successful / stats.today.generations) * 100)
                  : 0}%
              </div>
              <div className="text-[9px] text-muted-foreground">%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Stats - compact */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Activity className="w-3.5 h-3.5" />
            Всего (7 дней)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-center">
              <div className="text-lg font-bold text-primary">{stats.total.generations}</div>
              <div className="text-[9px] text-muted-foreground">Генераций</div>
            </div>
            <div className="p-2 rounded-lg bg-green-500/10 text-center">
              <div className="text-lg font-bold text-green-600">{stats.total.successful}</div>
              <div className="text-[9px] text-muted-foreground">Успешных</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-center">
              <div className="text-lg font-bold text-amber-600">${stats.total.cost.toFixed(1)}</div>
              <div className="text-[9px] text-muted-foreground">Расход</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Type - compact 6 columns */}
      <Card>
        <CardHeader className="pb-2 px-3 pt-3">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Music className="w-3.5 h-3.5" />
            По типам
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="grid grid-cols-6 gap-1">
            <div className="p-1.5 rounded-lg bg-muted/50 text-center">
              <Music className="w-3 h-3 mx-auto text-violet-500" />
              <div className="text-xs font-bold">{stats.byType.music}</div>
              <div className="text-[8px] text-muted-foreground">Муз</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/50 text-center">
              <Mic className="w-3 h-3 mx-auto text-pink-500" />
              <div className="text-xs font-bold">{stats.byType.vocals}</div>
              <div className="text-[8px] text-muted-foreground">Вок</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/50 text-center">
              <Guitar className="w-3 h-3 mx-auto text-orange-500" />
              <div className="text-xs font-bold">{stats.byType.instrumental}</div>
              <div className="text-[8px] text-muted-foreground">Инст</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/50 text-center">
              <TrendingUp className="w-3 h-3 mx-auto text-cyan-500" />
              <div className="text-xs font-bold">{stats.byType.extend}</div>
              <div className="text-[8px] text-muted-foreground">Ext</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/50 text-center">
              <Scissors className="w-3 h-3 mx-auto text-green-500" />
              <div className="text-xs font-bold">{stats.byType.stems}</div>
              <div className="text-[8px] text-muted-foreground">Стем</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/50 text-center">
              <Layers className="w-3 h-3 mx-auto text-indigo-500" />
              <div className="text-xs font-bold">{stats.byType.cover}</div>
              <div className="text-[8px] text-muted-foreground">Кав</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Days - compact */}
      {stats.recentDays && stats.recentDays.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-3.5 h-3.5" />
              История
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1">
              {stats.recentDays.slice(0, 5).map(day => (
                <div key={day.date} className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium">{day.date}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      {day.generations}
                    </Badge>
                    {day.successful > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-green-600">
                        ✓{day.successful}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
