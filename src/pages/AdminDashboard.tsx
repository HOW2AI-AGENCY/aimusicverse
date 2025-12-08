import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useBotMetrics, useRecentMetricEvents } from "@/hooks/useBotMetrics";
import { useAdminUsers, useAdminStats, useToggleUserRole } from "@/hooks/useAdminUsers";
import { useAdminTracks } from "@/hooks/useAdminTracks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, Music, FolderKanban, ListMusic, Activity, 
  TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle,
  Shield, RefreshCw, BookOpen, Search, Play, Globe, Lock
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Navigate, useNavigate } from "react-router-dom";
import { BroadcastPanel } from "@/components/admin/BroadcastPanel";
import { HealthCheckPanel } from "@/components/admin/HealthCheckPanel";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [trackSearch, setTrackSearch] = useState("");
  const { data: auth, isLoading: authLoading } = useAdminAuth();
  const { data: metrics, refetch: refetchMetrics } = useBotMetrics("24 hours");
  const { data: recentEvents } = useRecentMetricEvents(100);
  const { data: users } = useAdminUsers();
  const { data: stats } = useAdminStats();
  const { data: tracks, isLoading: tracksLoading } = useAdminTracks(trackSearch, 100);
  const toggleRole = useToggleUserRole();

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Проверка доступа...</div>;
  }

  if (!auth?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const successRate = metrics?.success_rate || 0;
  const isHealthy = successRate >= 95;
  const isWarning = successRate >= 80 && successRate < 95;

  return (
    <div className="container mx-auto p-4 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Админ-панель
        </h1>
        <Button variant="outline" size="sm" onClick={() => refetchMetrics()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="tracks">Треки</TabsTrigger>
          <TabsTrigger value="bot">Бот</TabsTrigger>
          <TabsTrigger value="broadcast">Рассылка</TabsTrigger>
          <TabsTrigger value="users">Юзеры</TabsTrigger>
          <TabsTrigger value="events">События</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              title="Пользователи"
              value={stats?.totalUsers || 0}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Треки"
              value={stats?.totalTracks || 0}
              icon={<Music className="h-4 w-4" />}
            />
            <StatCard
              title="Проекты"
              value={stats?.totalProjects || 0}
              icon={<FolderKanban className="h-4 w-4" />}
            />
            <StatCard
              title="Плейлисты"
              value={stats?.totalPlaylists || 0}
              icon={<ListMusic className="h-4 w-4" />}
            />
            <StatCard
              title="Публичные"
              value={stats?.publicTracks || 0}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              title="Генераций"
              value={stats?.generationTasks || 0}
              icon={<Activity className="h-4 w-4" />}
            />
          </div>

          <HealthCheckPanel />
        </TabsContent>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="h-5 w-5" />
                Все треки ({tracks?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или стилю..."
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[500px]">
                {tracksLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
                ) : (
                  <div className="space-y-2">
                    {tracks?.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {track.cover_url ? (
                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Music className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{track.title || "Без названия"}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {track.style || "—"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={track.creator_photo_url || undefined} />
                              <AvatarFallback className="text-[8px]">
                                {track.creator_username?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span>@{track.creator_username || "—"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            {track.is_public ? (
                              <Globe className="h-4 w-4 text-green-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Badge variant={track.status === "completed" ? "default" : "secondary"}>
                              {track.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Play className="h-3 w-3" />
                            {track.play_count || 0}
                            <span>•</span>
                            {track.created_at && format(new Date(track.created_at), "dd.MM.yy")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bot Metrics Tab */}
        <TabsContent value="bot" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Успешные
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.successful_events || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Ошибки
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{metrics?.failed_events || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">События по типу (24ч)</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics?.events_by_type ? (
                <div className="space-y-2">
                  {Object.entries(metrics.events_by_type)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-mono">{type}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Нет данных</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcast Tab */}
        <TabsContent value="broadcast" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <BroadcastPanel />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Блог
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Создавайте статьи и отправляйте их пользователям через рассылку
                </p>
                <Button onClick={() => navigate("/blog")} className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Открыть блог
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Пользователи ({users?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {users?.map((user) => {
                    const isAdmin = user.roles.includes("admin");
                    const isModerator = user.roles.includes("moderator");

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          {user.photo_url ? (
                            <img
                              src={user.photo_url}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && <Badge>Admin</Badge>}
                          {isModerator && <Badge variant="secondary">Mod</Badge>}
                          {!isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRole.mutate({
                                userId: user.user_id,
                                role: "admin",
                                action: "add",
                              })}
                            >
                              +Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Последние события
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {recentEvents?.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border ${
                        event.success ? "bg-card" : "bg-destructive/10 border-destructive/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {event.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-mono text-sm">{event.event_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(event.created_at), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </div>
                      </div>
                      {event.response_time_ms && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {event.response_time_ms}ms
                        </div>
                      )}
                      {event.error_message && (
                        <div className="text-xs text-red-500 mt-1 truncate">
                          {event.error_message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
