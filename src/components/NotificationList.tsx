import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSkeleton } from "@/components/ui/skeleton-loader";
import { Info, CheckCircle, AlertTriangle, XCircle, CheckCheck, ExternalLink, Music, Folder, Users, Sparkles, Trophy, Bell as BellIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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
  const { data: allNotifications, isLoading: allLoading } = useNotifications('all');
  const { data: unreadNotifications, isLoading: unreadLoading } = useNotifications('unread');
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotificationClick = (id: string, read: boolean, actionUrl?: string | null) => {
    // Mark as read if unread
    if (!read) {
      markAsRead.mutate(id);
    }
    // Navigate to action URL if available
    if (actionUrl) {
      onNotificationClick?.();
      navigate(actionUrl);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean | null;
    created_at: string | null;
    action_url?: string | null;
  }

  const renderNotifications = (notifications: Notification[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-2 p-3">
          {[1, 2, 3].map((i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!notifications || notifications.length === 0) {
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
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type as keyof typeof iconMap] || Info;
            const colorClass = colorMap[notification.type as keyof typeof colorMap] || "text-blue-500";

            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.read || false, notification.action_url)}
                className={cn(
                  "w-full p-3 rounded-lg text-left transition-colors hover:bg-accent group",
                  !notification.read && "bg-accent/50",
                  notification.action_url && "cursor-pointer"
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
                        {notification.action_url && (
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-0.5" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {notification.message}
                    </p>
                    {notification.created_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Уведомления</h3>
        {unreadNotifications && unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-xs"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Прочитать все
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none">
          <TabsTrigger value="all">
            Все {allNotifications && `(${allNotifications.length})`}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Непрочитанные {unreadNotifications && `(${unreadNotifications.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="m-0">
          {renderNotifications(allNotifications, allLoading)}
        </TabsContent>
        <TabsContent value="unread" className="m-0">
          {renderNotifications(unreadNotifications, unreadLoading)}
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
