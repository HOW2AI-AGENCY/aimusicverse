/**
 * AdminLayout - Shared layout for all admin pages
 * Provides navigation and common UI for admin sub-pages
 */
import { useState, useMemo, lazy, Suspense } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TAB_OPTIONS = [
  { value: "overview", label: "Обзор", icon: Activity, path: "/admin" },
  { value: "analytics", label: "Аналитика", icon: TrendingUp, path: "/admin/analytics" },
  { value: "generation-stats", label: "Генерации", icon: Music, path: "/admin/generation-stats" },
  { value: "performance", label: "Перформанс", icon: Activity, path: "/admin/performance" },
  { value: "economy", label: "Экономика", icon: Coins, path: "/admin/economy" },
  { value: "users", label: "Пользователи", icon: Users, path: "/admin/users" },
  { value: "balances", label: "Балансы", icon: Coins, path: "/admin/balances" },
  { value: "tracks", label: "Треки", icon: Music, path: "/admin/tracks" },
  { value: "moderation", label: "Жалобы", icon: AlertTriangle, path: "/admin/moderation" },
  { value: "feedback", label: "Фидбек", icon: MessageSquare, path: "/admin/feedback" },
  { value: "tariffs", label: "Тарифы", icon: Crown, path: "/admin/tariffs" },
  { value: "bot", label: "Бот", icon: MessageSquare, path: "/admin/bot" },
  { value: "telegram", label: "Telegram", icon: Globe, path: "/admin/telegram" },
  { value: "payments", label: "Платежи", icon: Coins, path: "/admin/payments" },
  { value: "logs", label: "Логи", icon: Clock, path: "/admin/logs" },
  { value: "deeplinks", label: "Диплинки", icon: Globe, path: "/admin/deeplinks" },
  { value: "alerts", label: "Алерты", icon: AlertTriangle, path: "/admin/alerts" },
  { value: "broadcast", label: "Рассылка", icon: MessageSquare, path: "/admin/broadcast" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { data: auth, isLoading: authLoading } = useAdminAuth();

  // Determine active tab from URL
  const activeTab = useMemo(() => {
    const path = location.pathname;
    const tab = TAB_OPTIONS.find(t => t.path === path);
    return tab?.value ?? "overview";
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    const tab = TAB_OPTIONS.find(t => t.value === value);
    if (tab) {
      navigate(tab.path);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!auth?.isAdmin) {
    return <Navigate to="/" replace />;
  }

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
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Обновить</span>
        </Button>
      </div>

      {/* Mobile Tab Selector */}
      {isMobile ? (
        <Select value={activeTab} onValueChange={handleTabChange}>
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
        <ScrollArea className="w-full">
          <div className="flex gap-1 pb-2">
            {TAB_OPTIONS.map((tab) => (
              <Button
                key={tab.value}
                variant={activeTab === tab.value ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap",
                  activeTab === tab.value && "bg-primary text-primary-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Page Content - rendered via Outlet */}
      <div className="space-y-4">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
