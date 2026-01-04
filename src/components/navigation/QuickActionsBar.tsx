/**
 * QuickActionsBar - Horizontal scrollable quick actions for MoreMenuSheet
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Gift, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import { useNotificationHub } from '@/contexts/NotificationContext';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  onClick?: () => void;
  badge?: number;
  primary?: boolean;
}

interface QuickActionsBarProps {
  onClose: () => void;
}

export const QuickActionsBar = memo(function QuickActionsBar({ onClose }: QuickActionsBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const { unreadCount } = useNotificationHub();

  const quickActions: QuickAction[] = [
    {
      id: 'profile',
      icon: User,
      label: 'Профиль',
      path: user?.id ? `/profile/${user.id}` : '/profile',
      primary: true,
    },
    {
      id: 'rewards',
      icon: Gift,
      label: 'Награды',
      path: '/rewards',
      badge: 1, // Show as there's always daily reward
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Уведомления',
      path: '/notifications',
      badge: unreadCount,
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Настройки',
      path: '/settings',
    },
  ];

  const handleAction = (action: QuickAction) => {
    hapticFeedback?.('light');
    onClose();
    if (action.path) {
      navigate(action.path);
    } else if (action.onClick) {
      action.onClick();
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant={action.primary ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAction(action)}
              className={cn(
                "flex-shrink-0 gap-2 h-10 px-4 rounded-full",
                action.primary && "bg-primary text-primary-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {action.badge && action.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[9px] bg-destructive text-destructive-foreground border-0"
                  >
                    {action.badge > 9 ? '9+' : action.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
});
