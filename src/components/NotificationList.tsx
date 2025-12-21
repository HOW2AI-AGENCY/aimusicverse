import { useNotificationHub, type NotificationItem } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSkeleton } from "@/components/ui/skeleton-loader";
import { 
  Info, CheckCircle, AlertTriangle, XCircle, CheckCheck, ExternalLink, 
  Music, Folder, Users, Trophy, Bell as BellIcon, Trash2, X, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/date-utils";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";

const iconMap: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  generation: Music,
  project: Folder,
  social: Users,
  achievement: Trophy,
  system: BellIcon,
};

const colorMap: Record<string, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  generation: "text-primary",
  project: "text-purple-500",
  social: "text-pink-500",
  achievement: "text-amber-500",
  system: "text-cyan-500",
};

interface NotificationListProps {
  onNotificationClick?: () => void;
}

export const NotificationList = ({ onNotificationClick }: NotificationListProps) => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, clearNotification, clearAllRead } = useNotificationHub();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  const allNotifications = notifications;
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.read), [notifications]);
  const readNotifications = useMemo(() => notifications.filter(n => n.read), [notifications]);
  const isLoading = false;

  const handleNotificationClick = async (id: string, read: boolean, actionUrl?: string | null) => {
    if (!read) {
      await markAsRead(id);
    }
    if (actionUrl) {
      onNotificationClick?.();
      navigate(actionUrl);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingIds(prev => new Set(prev).add(id));
    await clearNotification(id);
    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAllRead = () => {
    clearAllRead();
  };

  const renderNotifications = (notificationList: NotificationItem[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-2 p-3">
          {[1, 2, 3].map((i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!notificationList || notificationList.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Нет уведомлений</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-1 p-2">
          <AnimatePresence mode="popLayout">
            {notificationList.map((notification) => {
              const Icon = iconMap[notification.type as keyof typeof iconMap] || Info;
              const colorClass = colorMap[notification.type as keyof typeof colorMap] || "text-blue-500";
              const isDeleting = deletingIds.has(notification.id);
              const hasExpiry = notification.expires_at;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => handleNotificationClick(notification.id, notification.read || false, notification.action_url)}
                    disabled={isDeleting}
                    className={cn(
                      "w-full p-3 rounded-lg text-left transition-colors hover:bg-accent group relative",
                      !notification.read && "bg-accent/50",
                      notification.action_url && "cursor-pointer",
                      isDeleting && "opacity-50"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn("flex-shrink-0 mt-0.5", colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {hasExpiry && (
                              <span title="Автоудаление">
                                <Clock className="w-3 h-3 text-muted-foreground opacity-50" />
                              </span>
                            )}
                            {notification.action_url && (
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="p-1 rounded hover:bg-destructive/20 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Удалить"
                            >
                              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatRelative(new Date(notification.created_at))}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Уведомления</h3>
        <div className="flex items-center gap-2">
          {readNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllRead}
              className="text-xs text-muted-foreground hover:text-destructive"
              title="Удалить прочитанные"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {unreadNotifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Все
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none">
          <TabsTrigger value="all">
            Все {allNotifications && `(${allNotifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Новые {unreadNotifications && `(${unreadNotifications.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="m-0">
          {renderNotifications(allNotifications, isLoading)}
        </TabsContent>
        <TabsContent value="unread" className="m-0">
          {renderNotifications(unreadNotifications, isLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Bell = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
