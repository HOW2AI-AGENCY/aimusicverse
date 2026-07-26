import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronRight, Users, BarChart3, Settings, TrendingUp, Shield, GraduationCap, LogOut, Gift } from "@/lib/icons";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  path?: string;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

interface ProfileMenuProps {
  isAdmin?: boolean;
  onNavigate: (path: string) => void;
  onStartOnboarding: () => void;
  onLogout: () => void;
}

export function ProfileMenu({ isAdmin, onNavigate, onStartOnboarding, onLogout }: ProfileMenuProps) {
  const menuItems: MenuItem[] = [
    {
      icon: Users,
      title: "Мои AI-артисты",
      description: "Управление вашими AI-артистами",
      path: "/artists",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: BarChart3,
      title: "Аналитика",
      description: "Детальная статистика",
      path: "/analytics",
      color: "text-info",
      bgColor: "bg-primary/10",
    },
    {
      icon: Settings,
      title: "Настройки",
      description: "Профиль, уведомления, Telegram",
      path: "/settings",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const secondaryItems: MenuItem[] = [
    {
      icon: GraduationCap,
      title: "Обучение",
      description: "Туториалы и подсказки",
      color: "text-success",
      bgColor: "bg-success/10",
      onClick: onStartOnboarding,
    },
    ...(isAdmin
      ? [
          {
            icon: Shield,
            title: "Админ-панель",
            description: "Управление приложением",
            path: "/admin",
            color: "text-error",
            bgColor: "bg-error/10",
          } as MenuItem,
        ]
      : []),
    {
      icon: Gift,
      title: "Пригласить друзей",
      description: "Бонусы за приглашения",
      path: "/referral",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: LogOut,
      title: "Выйти",
      description: "Завершить сессию",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      onClick: onLogout,
    },
  ];

  const renderItem = (item: MenuItem, index: number) => (
    <motion.button
      key={item.title}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.05 }}
      onClick={() => {
        if (item.onClick) item.onClick();
        else if (item.path) onNavigate(item.path);
      }}
      className="w-full flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl hover:bg-muted/50 transition-colors text-left"
    >
      <div className={`p-2 lg:p-2.5 rounded-lg ${item.bgColor}`}>
        <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${item.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm lg:text-base font-medium">{item.title}</p>
        <p className="text-xs lg:text-sm text-muted-foreground truncate">{item.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );

  return (
    <div className="space-y-3 lg:space-y-4">
      <Card className="divide-y divide-border/50 glass-card">
        <div className="p-2 lg:p-3">{menuItems.map((item, i) => renderItem(item, i))}</div>
      </Card>

      <Card className="divide-y divide-border/50 glass-card">
        <div className="p-2 lg:p-3">{secondaryItems.map((item, i) => renderItem(item, i + menuItems.length))}</div>
      </Card>
    </div>
  );
}
