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
}

const TAB_OPTIONS = [
  { value: "overview", label: "Обзор", icon: Activity },
  { value: "users", label: "Пользователи", icon: Users },
  { value: "tracks", label: "Треки", icon: Music },
  { value: "bot", label: "Бот", icon: MessageSquare },
  { value: "telegram", label: "Telegram", icon: Globe },
  { value: "payments", label: "Платежи", icon: Coins },
  { value: "logs", label: "Логи", icon: Clock },
  { value: "alerts", label: "Алерты", icon: AlertTriangle },
  { value: "broadcast", label: "Рассылка", icon: MessageSquare },
  { value: "events", label: "События", icon: Activity },
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
    <div className="container mx-auto p-3 md:p-4 space-y-4 pb-24">
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
              <CurrentTabIcon className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {TAB_OPTIONS.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                <div className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </div>
              </SelectItem>
            ))}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <StatCard title="Пользователи" value={stats?.totalUsers || 0} icon={<Users className="h-4 w-4" />} />
              <StatCard title="Треки" value={stats?.totalTracks || 0} icon={<Music className="h-4 w-4" />} />
              <StatCard title="Проекты" value={stats?.totalProjects || 0} icon={<FolderKanban className="h-4 w-4" />} />
              <StatCard title="Плейлисты" value={stats?.totalPlaylists || 0} icon={<ListMusic className="h-4 w-4" />} />
              <StatCard title="Публичные" value={stats?.publicTracks || 0} icon={<TrendingUp className="h-4 w-4" />} />
              <StatCard title="Генераций" value={stats?.generationTasks || 0} icon={<Activity className="h-4 w-4" />} />
            </div>
            <HealthCheckPanel />
          </div>
        )}

        {/* Alerts Tab */}
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

        {/* Bot Metrics Tab */}
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
          <MobileTelegramBotSettings />
        )}

        {/* Stars Payments Tab */}
        {activeTab === "payments" && (
          <StarsPaymentsPanel />
        )}

        {/* Generation Logs Tab */}
        {activeTab === "logs" && (
          <GenerationLogsPanel />
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

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <CardTitle className="text-base md:text-lg">
                  Пользователи ({filteredUsers?.length || 0})
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedUsers.length > 0 && (
                    <>
                      <Badge variant="secondary">{selectedUsers.length}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMessageDialogOpen(true)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Написать</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={clearSelection}>
                        Сбросить
                      </Button>
                    </>
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
                  <SelectTrigger className="w-[120px] md:w-[150px]">
                    <SelectValue placeholder="Фильтр" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="admin">Админы</SelectItem>
                    <SelectItem value="premium">Премиум</SelectItem>
                    <SelectItem value="free">Бесплатные</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={selectAllUsers}>
                  Все
                </Button>
              </div>

              <ScrollArea className="h-[400px] md:h-[500px]">
                <div className="space-y-2">
                  {filteredUsers?.map((user) => {
                    const isAdmin = user.roles.includes("admin");
                    const isModerator = user.roles.includes("moderator");
                    const isSelected = selectedUsers.some(u => u.user_id === user.user_id);
                    const hasPremium = user.subscription_tier && user.subscription_tier !== "free";

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-2 md:p-3 rounded-lg border bg-card transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleUserSelection(user)}
                          />
                          <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                            <AvatarImage src={user.photo_url || undefined} />
                            <AvatarFallback>
                              {user.first_name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm md:text-base truncate">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs md:text-sm text-muted-foreground truncate">
                              @{user.username || "—"}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                          {/* Badges */}
                          <div className="hidden sm:flex items-center gap-1">
                            {isAdmin && <Badge className="text-xs">Admin</Badge>}
                            {isModerator && <Badge variant="secondary" className="text-xs">Mod</Badge>}
                            {hasPremium && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                {user.subscription_tier}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSubscriptionDialogUser(user)}
                            title="Подписка"
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCreditsDialogUser(user)}
                            title="Кредиты"
                          >
                            <Coins className="h-4 w-4" />
                          </Button>
                          {!isAdmin ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs hidden md:flex"
                              onClick={() => toggleRole.mutate({
                                userId: user.user_id,
                                role: "admin",
                                action: "add",
                              })}
                            >
                              +Admin
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hidden md:flex"
                              onClick={() => toggleRole.mutate({
                                userId: user.user_id,
                                role: "admin",
                                action: "remove",
                              })}
                            >
                              -Admin
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
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Последние события
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] md:h-[400px]">
                <div className="space-y-2">
                  {recentEvents?.map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 md:p-3 rounded-lg border ${
                        event.success ? "bg-card" : "bg-destructive/10 border-destructive/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {event.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="font-mono text-xs md:text-sm truncate">{event.event_type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs flex-shrink-0">
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
        <CardTitle className="text-xs md:text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
