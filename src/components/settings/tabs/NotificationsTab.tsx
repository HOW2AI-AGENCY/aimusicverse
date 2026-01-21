/**
 * Notifications Tab
 * 
 * All notification toggles and quiet hours settings.
 * Updated for Phase 8: Social Activity notifications
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Music, Clock, Heart, MessageCircle, Users } from 'lucide-react';
import { motion } from '@/lib/motion';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  defaultValue: boolean;
}

const GENERATION_TOGGLES: NotificationSetting[] = [
  { key: 'notify_completed', label: 'Завершение генерации', description: 'Уведомлять когда трек готов', defaultValue: true },
  { key: 'notify_failed', label: 'Ошибки генерации', description: 'Уведомлять при неудачной генерации', defaultValue: true },
  { key: 'notify_progress', label: 'Прогресс генерации', description: 'Уведомлять о промежуточных этапах', defaultValue: false },
  { key: 'notify_stem_ready', label: 'Готовность стемов', description: 'Уведомлять когда разделение завершено', defaultValue: true },
];

const SOCIAL_TOGGLES: NotificationSetting[] = [
  { key: 'notify_likes', label: 'Новые лайки', description: 'Уведомлять когда кто-то лайкнул ваш трек', defaultValue: true },
  { key: 'notify_comments', label: 'Комментарии', description: 'Уведомлять о новых комментариях к вашим трекам', defaultValue: true },
  { key: 'notify_followers', label: 'Новые подписчики', description: 'Уведомлять когда кто-то подписался на вас', defaultValue: true },
  { key: 'notify_mentions', label: 'Упоминания', description: 'Уведомлять когда вас упомянули', defaultValue: true },
];

const GAMIFICATION_TOGGLES: NotificationSetting[] = [
  { key: 'notify_achievements', label: 'Достижения', description: 'Уведомлять о полученных достижениях', defaultValue: true },
  { key: 'notify_daily_reminder', label: 'Ежедневное напоминание', description: 'Напоминать о ежедневном чекине', defaultValue: false },
];

interface NotificationsTabProps {
  settings: Record<string, any> | null | undefined;
  isUpdating: boolean;
  onToggle: (key: string, value: boolean) => void;
  onUpdateSettings: (updates: Record<string, any>) => void;
  createFocusHandler: (options?: any) => (event: React.FocusEvent<HTMLElement>) => void;
}

function NotificationToggleList({
  toggles,
  settings,
  isUpdating,
  onToggle,
}: {
  toggles: NotificationSetting[];
  settings: Record<string, any> | null | undefined;
  isUpdating: boolean;
  onToggle: (key: string, value: boolean) => void;
}) {
  return (
    <>
      {toggles.map((toggle, index) => (
        <div key={toggle.key}>
          {index > 0 && <Separator className="mb-4" />}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">{toggle.label}</Label>
              <p className="text-sm text-muted-foreground">
                {toggle.description}
              </p>
            </div>
            <Switch
              checked={(settings as any)?.[toggle.key] ?? toggle.defaultValue}
              onCheckedChange={(v) => onToggle(toggle.key, v)}
              disabled={isUpdating}
            />
          </div>
        </div>
      ))}
    </>
  );
}

export function NotificationsTab({
  settings,
  isUpdating,
  onToggle,
  onUpdateSettings,
  createFocusHandler,
}: NotificationsTabProps) {
  return (
    <>
      {/* Generation Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Уведомления о генерации
            </CardTitle>
            <CardDescription>
              Настройте уведомления о процессе создания музыки
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationToggleList
              toggles={GENERATION_TOGGLES}
              settings={settings}
              isUpdating={isUpdating}
              onToggle={onToggle}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Social Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Социальная активность
            </CardTitle>
            <CardDescription>
              Уведомления о лайках, комментариях и подписчиках
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationToggleList
              toggles={SOCIAL_TOGGLES}
              settings={settings}
              isUpdating={isUpdating}
              onToggle={onToggle}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Gamification Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Достижения и бонусы
            </CardTitle>
            <CardDescription>
              Уведомления о достижениях и напоминания
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationToggleList
              toggles={GAMIFICATION_TOGGLES}
              settings={settings}
              isUpdating={isUpdating}
              onToggle={onToggle}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiet Hours */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Тихие часы
            </CardTitle>
            <CardDescription>
              Период когда уведомления не отправляются
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Начало</Label>
                <Input
                  type="time"
                  value={(settings as any)?.quiet_hours_start || ""}
                  onChange={(e) => onUpdateSettings({ quiet_hours_start: e.target.value || null })}
                  onFocus={createFocusHandler()}
                  disabled={isUpdating}
                />
              </div>
              <div className="space-y-2">
                <Label>Конец</Label>
                <Input
                  type="time"
                  value={(settings as any)?.quiet_hours_end || ""}
                  onChange={(e) => onUpdateSettings({ quiet_hours_end: e.target.value || null })}
                  onFocus={createFocusHandler()}
                  disabled={isUpdating}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Оставьте пустым чтобы отключить тихие часы
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
