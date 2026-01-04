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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, Music, FolderKanban, ListMusic, Activity, 
  TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle,
  Shield, RefreshCw, BookOpen, Search, Play, Globe, Lock,
  Coins, MessageSquare, Eye, Crown, ChevronDown, Menu
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";
import { Navigate, useNavigate } from "react-router-dom";
import { BroadcastPanel } from "@/components/admin/BroadcastPanel";
import { HealthCheckPanel } from "@/components/admin/HealthCheckPanel";
import { AlertHistoryPanel } from "@/components/admin/AlertHistoryPanel";
import { AlertAnalyticsPanel } from "@/components/admin/AlertAnalyticsPanel";
import { MobileTelegramBotSettings } from "@/components/admin/MobileTelegramBotSettings";
import { GenerationLogsPanel } from "@/components/admin/GenerationLogsPanel";
import { StarsPaymentsPanel } from "@/components/admin/StarsPaymentsPanel";
import { AdminUserCreditsDialog } from "@/components/admin/AdminUserCreditsDialog";
import { AdminUserSubscriptionDialog } from "@/components/admin/AdminUserSubscriptionDialog";
import { AdminSendMessageDialog } from "@/components/admin/AdminSendMessageDialog";
import { AdminTrackDetailsDialog } from "@/components/admin/AdminTrackDetailsDialog";
import { UserBalancesPanel } from "@/components/admin/UserBalancesPanel";
import { DeeplinkAnalyticsPanel } from "@/components/admin/DeeplinkAnalyticsPanel";
import { EnhancedAnalyticsPanel } from "@/components/admin/EnhancedAnalyticsPanel";
import { ModerationReportsPanel } from "@/components/admin/ModerationReportsPanel";
import { AdminBotImagesPanel } from "@/components/admin/AdminBotImagesPanel";
import { BotMenuEditor } from "@/components/admin/BotMenuEditor";
import { StatCard, StatGrid } from "@/components/admin/StatCard";
import { AdminUserCard } from "@/components/admin/AdminUserCard";
import { PerformanceDashboard } from "@/components/performance";
import { GenerationStatsPanel } from "@/components/admin/GenerationStatsPanel";
import { SubscriptionTiersManager } from "@/components/admin/SubscriptionTiersManager";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserWithRoles {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  created_at: string;
  roles: string[];
  subscription_tier?: string;
  subscription_expires_at?: string | null;
  balance?: number;
  total_earned?: number;
  total_spent?: number;
  level?: number;
}

const TAB_OPTIONS = [
  { value: "overview", label: "Обзор", icon: Activity },
  { value: "analytics", label: "Аналитика", icon: TrendingUp },
  { value: "generation-stats", label: "Генерации", icon: Music },
  { value: "performance", label: "Перформанс", icon: Activity },
  { value: "users", label: "Пользователи", icon: Users },
  { value: "balances", label: "Балансы", icon: Coins },
  { value: "tracks", label: "Треки", icon: Music },
  { value: "moderation", label: "Жалобы", icon: AlertTriangle },
  { value: "feedback", label: "Фидбек", icon: MessageSquare },
  { value: "tariffs", label: "Тарифы", icon: Crown },
  { value: "bot", label: "Бот", icon: MessageSquare },
  { value: "telegram", label: "Telegram", icon: Globe },
  { value: "payments", label: "Платежи", icon: Coins },
  { value: "logs", label: "Логи", icon: Clock },
  { value: "deeplinks", label: "Диплинки", icon: Globe },
  { value: "alerts", label: "Алерты", icon: AlertTriangle },
  { value: "broadcast", label: "Рассылка", icon: MessageSquare },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");
  const [trackSearch, setTrackSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<UserWithRoles[]>([]);
  const [creditsDialogUser, setCreditsDialogUser] = useState<UserWithRoles | null>(null);
  const [subscriptionDialogUser, setSubscriptionDialogUser] = useState<UserWithRoles | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  
  const { data: auth, isLoading: authLoading } = useAdminAuth();
  const { data: metrics, refetch: refetchMetrics } = useBotMetrics("24 hours");
  const { data: recentEvents } = useRecentMetricEvents(100);
  const { data: users, refetch: refetchUsers } = useAdminUsers();
  const { data: stats } = useAdminStats();
  const { data: tracks, isLoading: tracksLoading } = useAdminTracks(trackSearch, 100);
  const toggleRole = useToggleUserRole();

  // Filter users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = !userSearch || 
      user.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesFilter = userFilter === "all" ||
      (userFilter === "admin" && user.roles.includes("admin")) ||
      (userFilter === "premium" && user.subscription_tier && user.subscription_tier !== "free") ||
      (userFilter === "free" && (!user.subscription_tier || user.subscription_tier === "free"));
    
    return matchesSearch && matchesFilter;
  });

  const toggleUserSelection = (user: UserWithRoles) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.user_id === user.user_id);
      if (exists) {
        return prev.filter(u => u.user_id !== user.user_id);
      }
      return [...prev, user];
    });
  };

  const selectAllUsers = () => {
    if (filteredUsers) {
      setSelectedUsers(filteredUsers);
    }
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Проверка доступа...</div>;
  }

  if (!auth?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const successRate = metrics?.success_rate || 0;

  const CurrentTabIcon = TAB_OPTIONS.find(t => t.value === activeTab)?.icon || Activity;

  return (
    <div 
      className="container mx-auto p-3 md:p-4 space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      style={{
        paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem), calc(env(safe-area-inset-top, 0px) + 0.75rem))'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 md:h-6 md:w-6" />
          <span className="hidden sm:inline">Админ-панель</span>
          <span className="sm:hidden">Админ</span>
        </h1>
        <Button variant="outline" size="sm" onClick={() => refetchMetrics()}>
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Обновить</span>
        </Button>
      </div>

      {/* Mobile Tab Selector */}
      {isMobile ? (
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <CurrentTabIcon className="h-4 w-4 flex-shrink-0" />
              <span>{TAB_OPTIONS.find(t => t.value === activeTab)?.label}</span>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {TAB_OPTIONS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <SelectItem key={tab.value} value={tab.value} className="pl-2">
                  <div className="flex items-center gap-2">
                    <TabIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              {TAB_OPTIONS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>
      )}

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <StatGrid columns={6}>
              <StatCard title="Пользователи" value={stats?.totalUsers || 0} icon={<Users className="h-4 w-4" />} />
              <StatCard title="Треки" value={stats?.totalTracks || 0} icon={<Music className="h-4 w-4" />} />
              <StatCard title="Проекты" value={stats?.totalProjects || 0} icon={<FolderKanban className="h-4 w-4" />} />
              <StatCard title="Плейлисты" value={stats?.totalPlaylists || 0} icon={<ListMusic className="h-4 w-4" />} />
              <StatCard title="Публичные" value={stats?.publicTracks || 0} icon={<TrendingUp className="h-4 w-4" />} />
              <StatCard title="Генераций" value={stats?.generationTasks || 0} icon={<Activity className="h-4 w-4" />} />
            </StatGrid>
            <HealthCheckPanel />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <EnhancedAnalyticsPanel />
        )}

        {/* Generation Stats Tab */}
        {activeTab === "generation-stats" && (
          <GenerationStatsPanel />
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <PerformanceDashboard />
        )}

        {activeTab === "alerts" && (
          <div className="space-y-6">
            <AlertAnalyticsPanel />
            <AlertHistoryPanel />
          </div>
        )}

        {/* Tracks Tab */}
        {activeTab === "tracks" && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Music className="h-5 w-5" />
                Треки ({tracks?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={trackSearch}
                  onChange={(e) => setTrackSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[400px] md:h-[500px]">
                {tracksLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
                ) : (
                  <div className="space-y-2">
                    {tracks?.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedTrack(track)}
                      >
                        <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {track.cover_url ? (
                            <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Music className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base truncate">{track.title || "Без названия"}</div>
                          <div className="text-xs md:text-sm text-muted-foreground truncate">
                            @{track.creator_username || "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2">
                          {track.is_public ? (
                            <Globe className="h-4 w-4 text-green-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge variant={track.status === "completed" ? "default" : "secondary"} className="text-xs">
                            {track.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Moderation Tab */}
        {activeTab === "moderation" && (
          <ModerationReportsPanel />
        )}

        {/* Feedback Tab - redirect to dedicated page */}
        {activeTab === "feedback" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Обратная связь
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Просмотр и ответ на сообщения пользователей из бота.
              </p>
              <Button onClick={() => navigate("/admin/feedback")} className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Открыть панель фидбека
              </Button>
            </CardContent>
          </Card>
        )}
        {activeTab === "bot" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Успешные
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl md:text-2xl font-bold">{metrics?.successful_events || 0}</div>
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
                  <div className="text-xl md:text-2xl font-bold text-red-500">{metrics?.failed_events || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">События по типу (24ч)</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.events_by_type ? (
                  <div className="space-y-2">
                    {Object.entries(metrics.events_by_type)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, isMobile ? 8 : 15)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-xs md:text-sm font-mono truncate flex-1">{type}</span>
                          <Badge variant="outline">{count as number}</Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Нет данных</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Telegram Settings Tab */}
        {activeTab === "telegram" && (
          <div className="space-y-6">
            <BotMenuEditor />
            <MobileTelegramBotSettings />
            <AdminBotImagesPanel />
          </div>
        )}

        {/* Stars Payments Tab */}
        {activeTab === "payments" && (
          <StarsPaymentsPanel />
        )}

        {/* Generation Logs Tab */}
        {activeTab === "logs" && (
          <GenerationLogsPanel />
        )}

        {/* User Balances Tab */}
        {activeTab === "balances" && (
          <UserBalancesPanel />
        )}

        {/* Deeplink Analytics Tab */}
        {activeTab === "deeplinks" && (
          <DeeplinkAnalyticsPanel />
        )}

        {/* Broadcast Tab */}
        {activeTab === "broadcast" && (
          <div className="grid gap-4 md:grid-cols-2">
            <BroadcastPanel />
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Блог
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Создавайте статьи и отправляйте их пользователям
                </p>
                <Button onClick={() => navigate("/blog")} className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Открыть блог
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tariffs Tab */}
        {activeTab === "tariffs" && (
          <Card>
            <CardContent className="pt-6">
              <SubscriptionTiersManager />
            </CardContent>
          </Card>
        )}


        {activeTab === "users" && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg">
                    Пользователи ({filteredUsers?.length || 0})
                  </CardTitle>
                  {selectedUsers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedUsers.length}</Badge>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setMessageDialogOpen(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Написать
                      </Button>
                      <Button size="sm" variant="ghost" onClick={clearSelection}>
                        Сбросить
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Фильтр" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="admin">Админы</SelectItem>
                    <SelectItem value="premium">Премиум</SelectItem>
                    <SelectItem value="free">Бесплатные</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={selectAllUsers} className="hidden sm:flex">
                  Все
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-320px)] min-h-[300px]">
                <div className="space-y-2 pr-2">
                  {filteredUsers?.map((user) => (
                    <AdminUserCard
                      key={user.id}
                      user={user}
                      isSelected={selectedUsers.some(u => u.user_id === user.user_id)}
                      onSelect={() => toggleUserSelection(user)}
                      onCredits={() => setCreditsDialogUser(user)}
                      onSubscription={() => setSubscriptionDialogUser(user)}
                      onMessage={() => {
                        setSelectedUsers([user]);
                        setMessageDialogOpen(true);
                      }}
                      onToggleAdmin={(action) => toggleRole.mutate({
                        userId: user.user_id,
                        role: "admin",
                        action,
                      })}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <AdminUserCreditsDialog
        open={!!creditsDialogUser}
        onOpenChange={(open) => !open && setCreditsDialogUser(null)}
        user={creditsDialogUser}
        onSuccess={() => refetchUsers()}
      />

      <AdminUserSubscriptionDialog
        open={!!subscriptionDialogUser}
        onOpenChange={(open) => !open && setSubscriptionDialogUser(null)}
        user={subscriptionDialogUser}
        currentTier={subscriptionDialogUser?.subscription_tier || "free"}
        currentExpires={subscriptionDialogUser?.subscription_expires_at}
        onSuccess={() => refetchUsers()}
      />

      <AdminSendMessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        selectedUsers={selectedUsers}
        onClearSelection={clearSelection}
      />

      <AdminTrackDetailsDialog
        open={!!selectedTrack}
        onOpenChange={(open) => !open && setSelectedTrack(null)}
        track={selectedTrack}
      />
    </div>
  );
}
