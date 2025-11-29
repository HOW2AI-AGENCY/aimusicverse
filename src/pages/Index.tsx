import { TelegramInfo } from "@/components/TelegramInfo";
import { NotificationBadge } from "@/components/NotificationBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, LogOut, UserCircle, Activity, TrendingUp, Clock, CheckCircle2, CheckSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useNavigate } from "react-router-dom";
import { useUserActivity, useCreateActivity } from "@/hooks/useUserActivity";
import { ActivitySkeleton, StatCardSkeleton } from "@/components/ui/skeleton-loader";
import { toast } from "sonner";

const Index = () => {
  const { logout } = useAuth();
  const { hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  const { data: activities, isLoading: activitiesLoading } = useUserActivity();
  const createActivity = useCreateActivity();

  const handleAction = async (actionType: string) => {
    hapticFeedback('success');
    
    createActivity.mutate(
      { action_type: actionType, action_data: { timestamp: new Date().toISOString() } },
      {
        onSuccess: () => {
          toast.success(`Действие "${actionType}" выполнено!`);
        },
        onError: () => {
          toast.error('Ошибка при выполнении действия');
        }
      }
    );
  };

  const handleLogout = () => {
    hapticFeedback('medium');
    logout();
  };

  const goToProfile = () => {
    hapticFeedback('light');
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl glass-card border-primary/20">
              <Music className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI MusicVerse
              </h1>
              <p className="text-sm text-muted-foreground">
                Создавайте музыку с помощью AI
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <NotificationBadge />
            <Button
              variant="ghost"
              size="icon"
              onClick={goToProfile}
              className="text-muted-foreground hover:text-foreground glass rounded-full"
            >
              <UserCircle className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive glass rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* User Info Card */}
        <div className="mb-6">
          <TelegramInfo />
        </div>

        {/* Stats Grid */}
        {activitiesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 glass-card border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activities?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Действий</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 glass-card border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">100%</p>
                  <p className="text-xs text-muted-foreground">Активность</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 glass-card border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">24/7</p>
                  <p className="text-xs text-muted-foreground">Онлайн</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 glass-card border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">OK</p>
                  <p className="text-xs text-muted-foreground">Статус</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="p-6 mb-6 glass-card border-primary/20">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Быстрые действия</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => navigate('/tasks')}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-auto py-4 flex flex-col gap-2"
            >
              <CheckSquare className="w-6 h-6" />
              <span className="text-sm">Задачи</span>
            </Button>
            <Button
              onClick={() => handleAction('activity_logged')}
              variant="outline"
              className="glass border-primary/20 h-auto py-4 flex flex-col gap-2"
            >
              <Activity className="w-6 h-6" />
              <span className="text-sm">Активность</span>
            </Button>
            <Button
              onClick={() => handleAction('data_synced')}
              variant="outline"
              className="glass border-primary/20 h-auto py-4 flex flex-col gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">Синхр.</span>
            </Button>
            <Button
              onClick={goToProfile}
              variant="outline"
              className="glass border-primary/20 h-auto py-4 flex flex-col gap-2"
            >
              <UserCircle className="w-6 h-6" />
              <span className="text-sm">Профиль</span>
            </Button>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6 glass-card border-primary/20">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Последняя активность</h2>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <ActivitySkeleton key={i} />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg glass border border-primary/10 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {activity.action_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30">Завершено</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Пока нет активности. Выполните действие, чтобы увидеть его здесь.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
