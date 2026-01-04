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
      className="space-y-4"
    >
      {/* Today Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4" />
            Сегодня
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Генераций</span>
              </div>
              <div className="text-xl font-bold">{stats.today.generations}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Успешных</span>
              </div>
              <div className="text-xl font-bold text-green-600">{stats.today.successful}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Расход</span>
              </div>
              <div className="text-xl font-bold">${stats.today.cost.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Успешность</span>
              </div>
              <div className="text-xl font-bold">
                {stats.today.generations > 0 
                  ? Math.round((stats.today.successful / stats.today.generations) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4" />
            Всего
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-center">
              <div className="text-xl font-bold text-primary">{stats.total.generations}</div>
              <div className="text-xs text-muted-foreground">Генераций</div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <div className="text-xl font-bold text-green-600">{stats.total.successful}</div>
              <div className="text-xs text-muted-foreground">Успешных</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
              <div className="text-xl font-bold text-amber-600">${stats.total.cost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Расход</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="w-4 h-4" />
            По типам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Music className="w-4 h-4 mx-auto mb-1 text-violet-500" />
              <div className="text-sm font-bold">{stats.byType.music}</div>
              <div className="text-[10px] text-muted-foreground">Музыка</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Mic className="w-4 h-4 mx-auto mb-1 text-pink-500" />
              <div className="text-sm font-bold">{stats.byType.vocals}</div>
              <div className="text-[10px] text-muted-foreground">Вокал</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Guitar className="w-4 h-4 mx-auto mb-1 text-orange-500" />
              <div className="text-sm font-bold">{stats.byType.instrumental}</div>
              <div className="text-[10px] text-muted-foreground">Инструм.</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
              <div className="text-sm font-bold">{stats.byType.extend}</div>
              <div className="text-[10px] text-muted-foreground">Extend</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Scissors className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <div className="text-sm font-bold">{stats.byType.stems}</div>
              <div className="text-[10px] text-muted-foreground">Стемы</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Layers className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
              <div className="text-sm font-bold">{stats.byType.cover}</div>
              <div className="text-[10px] text-muted-foreground">Каверы</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Days */}
      {stats.recentDays && stats.recentDays.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4" />
              Последние дни
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentDays.slice(0, 5).map(day => (
                <div key={day.date} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">{day.date}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {day.generations} ген.
                    </Badge>
                    {day.successful > 0 && (
                      <Badge variant="secondary" className="text-xs text-green-600">
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
