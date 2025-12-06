import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { 
  BarChart3, 
  Music, 
  Play, 
  Heart, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useUserStats } from '@/hooks/useUserStats';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function Analytics() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: stats, isLoading } = useUserStats();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const mainStats = [
    { 
      icon: Music, 
      label: 'Всего треков', 
      value: stats?.totalTracks || 0,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      icon: Play, 
      label: 'Прослушиваний', 
      value: stats?.totalPlays || 0,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      icon: Heart, 
      label: 'Получено лайков', 
      value: stats?.totalLikes || 0,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    { 
      icon: TrendingUp, 
      label: 'Публичных треков', 
      value: stats?.publicTracks || 0,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
  ];

  const generationStats = [
    { 
      icon: Calendar, 
      label: 'Генераций в этом месяце', 
      value: stats?.generationsThisMonth || 0,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    { 
      icon: CheckCircle2, 
      label: 'Успешных', 
      value: stats?.completedGenerations || 0,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    { 
      icon: XCircle, 
      label: 'Неудачных', 
      value: stats?.failedGenerations || 0,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
  ];

  const successRate = stats?.generationsThisMonth 
    ? Math.round((stats.completedGenerations / stats.generationsThisMonth) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-3 rounded-full glass-card border-primary/20">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Аналитика
            </h1>
            <p className="text-sm text-muted-foreground">Ваша статистика и достижения</p>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {mainStats.map((stat, index) => (
            <Card key={stat.label} className="p-4 glass-card border-border/50">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </motion.div>

        {/* Generation Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Генерации за месяц
          </h2>
          <Card className="p-4 glass-card border-border/50 mb-6">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Успешность генераций</span>
                  <span className="text-2xl font-bold text-primary">{successRate}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {generationStats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                      <p className="text-xl font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Content Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold mb-3">Ваш контент</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 glass-card border-border/50 text-center">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-amber-500">{stats?.totalProjects || 0}</p>
                  <p className="text-xs text-muted-foreground">Проектов</p>
                </>
              )}
            </Card>
            <Card className="p-4 glass-card border-border/50 text-center">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-cyan-500">{stats?.totalPlaylists || 0}</p>
                  <p className="text-xs text-muted-foreground">Плейлистов</p>
                </>
              )}
            </Card>
            <Card className="p-4 glass-card border-border/50 text-center">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-violet-500">{stats?.totalArtists || 0}</p>
                  <p className="text-xs text-muted-foreground">AI-артистов</p>
                </>
              )}
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}