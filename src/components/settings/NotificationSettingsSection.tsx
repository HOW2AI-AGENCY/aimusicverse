/**
 * NotificationSettingsSection - Grouped notification settings with categories
 * Sprint 012 - Improved UX
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Music, 
  Heart, 
  MessageSquare, 
  Trophy,
  Clock,
  BellOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { NotificationSettings } from '@/hooks/useNotificationSettings';

interface NotificationSettingsSectionProps {
  settings: NotificationSettings | null;
  onToggle: (key: string, value: boolean) => void;
  isUpdating: boolean;
}

interface NotificationGroup {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: {
    key: keyof NotificationSettings;
    label: string;
    description: string;
    defaultValue: boolean;
  }[];
}

const NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    id: 'creation',
    title: 'Создание музыки',
    description: 'Уведомления о генерации и обработке',
    icon: <Music className="w-4 h-4" />,
    settings: [
      {
        key: 'notify_completed',
        label: 'Готовность трека',
        description: 'Когда генерация завершена',
        defaultValue: true,
      },
      {
        key: 'notify_failed',
        label: 'Ошибки генерации',
        description: 'Когда что-то пошло не так',
        defaultValue: true,
      },
      {
        key: 'notify_progress',
        label: 'Прогресс генерации',
        description: 'Промежуточные этапы',
        defaultValue: false,
      },
      {
        key: 'notify_stem_ready',
        label: 'Готовность стемов',
        description: 'Когда разделение завершено',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'social',
    title: 'Социальные',
    description: 'Взаимодействие с другими пользователями',
    icon: <Heart className="w-4 h-4" />,
    settings: [
      {
        key: 'notify_likes',
        label: 'Новые лайки',
        description: 'Когда кто-то лайкнул ваш трек',
        defaultValue: true,
      },
      {
        key: 'notify_comments',
        label: 'Комментарии',
        description: 'Новые комментарии к вашим трекам',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'achievements',
    title: 'Достижения',
    description: 'Награды и прогресс',
    icon: <Trophy className="w-4 h-4" />,
    settings: [
      {
        key: 'notify_achievements',
        label: 'Достижения',
        description: 'Получение новых достижений',
        defaultValue: true,
      },
      {
        key: 'notify_daily_reminder',
        label: 'Ежедневное напоминание',
        description: 'Напоминание о чекине',
        defaultValue: false,
      },
    ],
  },
];

export function NotificationSettingsSection({
  settings,
  onToggle,
  isUpdating,
}: NotificationSettingsSectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['creation']));

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const enabledCount = NOTIFICATION_GROUPS.flatMap(g => g.settings).filter(
    s => settings?.[s.key] ?? s.defaultValue
  ).length;
  const totalCount = NOTIFICATION_GROUPS.flatMap(g => g.settings).length;

  const handleToggleAll = (enable: boolean) => {
    NOTIFICATION_GROUPS.flatMap(g => g.settings).forEach(s => {
      onToggle(s.key as string, enable);
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-5 h-5" />
              Уведомления
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {enabledCount}/{totalCount} активно
            </Badge>
          </div>
          <CardDescription>
            Настройте какие уведомления получать
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(true)}
              disabled={isUpdating || enabledCount === totalCount}
              className="flex-1"
            >
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              Включить все
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleAll(false)}
              disabled={isUpdating || enabledCount === 0}
              className="flex-1"
            >
              <BellOff className="w-3.5 h-3.5 mr-1.5" />
              Выключить все
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grouped settings */}
      {NOTIFICATION_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.id);
        const groupEnabledCount = group.settings.filter(
          s => settings?.[s.key] ?? s.defaultValue
        ).length;

        return (
          <Card key={group.id} className="overflow-hidden">
            <button
              type="button"
              className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {group.icon}
                </div>
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    {group.title}
                    <Badge variant="outline" className="text-[10px] h-4">
                      {groupEnabledCount}/{group.settings.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0 pb-4 space-y-3">
                    <Separator />
                    {group.settings.map((setting, idx) => (
                      <div key={setting.key}>
                        <div className="flex items-center justify-between py-1">
                          <div className="space-y-0.5">
                            <Label className="text-sm">{setting.label}</Label>
                            <p className="text-xs text-muted-foreground">
                              {setting.description}
                            </p>
                          </div>
                          <Switch
                            checked={settings?.[setting.key] as boolean ?? setting.defaultValue}
                            onCheckedChange={(v) => onToggle(setting.key as string, v)}
                            disabled={isUpdating}
                          />
                        </div>
                        {idx < group.settings.length - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}
