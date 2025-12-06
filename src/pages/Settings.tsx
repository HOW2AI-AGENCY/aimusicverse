import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTelegram } from "@/contexts/TelegramContext";
import { useProfile, useUpdateProfile, ProfileUpdate } from "@/hooks/useProfile";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Bell, 
  User, 
  Shield, 
  Smartphone,
  Moon,
  Sun,
  Globe,
  Clock,
  Music,
  Loader2,
  CheckCircle2,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { TelegramBotSetup } from "@/components/TelegramBotSetup";
import { motion } from "framer-motion";

export default function Settings() {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { settings, updateSettings, isLoading: settingsLoading, isUpdating } = useNotificationSettings();

  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [isPublic, setIsPublic] = useState(profile?.is_public || false);

  // Initialize form when profile loads
  useState(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setIsPublic(profile.is_public || false);
    }
  });

  const handleSaveProfile = async () => {
    hapticFeedback('light');
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName || undefined,
        is_public: isPublic,
      });
      toast.success('Профиль сохранён');
    } catch (error) {
      toast.error('Ошибка сохранения');
    }
  };

  const handleNotificationToggle = (key: string, value: boolean) => {
    hapticFeedback('light');
    updateSettings({ [key]: value });
  };

  const handlePrivacyToggle = (value: boolean) => {
    hapticFeedback('light');
    setIsPublic(value);
    updateProfile.mutate({ is_public: value });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Настройки</h1>
            <p className="text-sm text-muted-foreground">Управление аккаунтом и уведомлениями</p>
          </div>
        </motion.div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Уведомления</span>
            </TabsTrigger>
            <TabsTrigger value="telegram" className="gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Telegram</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Личные данные
                  </CardTitle>
                  <CardDescription>
                    Информация отображаемая в вашем профиле
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Введите имя"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Введите фамилию"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveProfile} 
                    className="w-full"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Сохранить изменения
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Приватность
                  </CardTitle>
                  <CardDescription>
                    Управление видимостью вашего профиля
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Публичный профиль</Label>
                      <p className="text-sm text-muted-foreground">
                        Другие пользователи смогут видеть ваш профиль и контент
                      </p>
                    </div>
                    <Switch
                      checked={isPublic}
                      onCheckedChange={handlePrivacyToggle}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between opacity-60">
                    <div className="space-y-0.5">
                      <Label className="text-base">Показывать статистику</Label>
                      <p className="text-sm text-muted-foreground">
                        Отображать количество прослушиваний и лайков
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
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
                    Настройте какие уведомления вы хотите получать
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Завершение генерации</Label>
                      <p className="text-sm text-muted-foreground">
                        Уведомлять когда трек готов
                      </p>
                    </div>
                    <Switch
                      checked={settings?.notify_completed ?? true}
                      onCheckedChange={(v) => handleNotificationToggle('notify_completed', v)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Ошибки генерации</Label>
                      <p className="text-sm text-muted-foreground">
                        Уведомлять при неудачной генерации
                      </p>
                    </div>
                    <Switch
                      checked={settings?.notify_failed ?? true}
                      onCheckedChange={(v) => handleNotificationToggle('notify_failed', v)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Прогресс генерации</Label>
                      <p className="text-sm text-muted-foreground">
                        Уведомлять о промежуточных этапах
                      </p>
                    </div>
                    <Switch
                      checked={settings?.notify_progress ?? false}
                      onCheckedChange={(v) => handleNotificationToggle('notify_progress', v)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Готовность стемов</Label>
                      <p className="text-sm text-muted-foreground">
                        Уведомлять когда разделение завершено
                      </p>
                    </div>
                    <Switch
                      checked={settings?.notify_stem_ready ?? true}
                      onCheckedChange={(v) => handleNotificationToggle('notify_stem_ready', v)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Новые лайки</Label>
                      <p className="text-sm text-muted-foreground">
                        Уведомлять когда кто-то лайкнул ваш трек
                      </p>
                    </div>
                    <Switch
                      checked={(settings as any)?.notify_likes ?? true}
                      onCheckedChange={(v) => handleNotificationToggle('notify_likes', v)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Достижения</Label>
                      <p className="text-sm text-muted-foreground">
                        Уведомлять о полученных достижениях
                      </p>
                    </div>
                    <Switch
                      checked={(settings as any)?.notify_achievements ?? true}
                      onCheckedChange={(v) => handleNotificationToggle('notify_achievements', v)}
                      disabled={isUpdating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Ежедневное напоминание</Label>
                      <p className="text-sm text-muted-foreground">
                        Напоминать о ежедневном чекине
                      </p>
                    </div>
                    <Switch
                      checked={(settings as any)?.notify_daily_reminder ?? false}
                      onCheckedChange={(v) => handleNotificationToggle('notify_daily_reminder', v)}
                      disabled={isUpdating}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                        value={settings?.quiet_hours_start || ""}
                        onChange={(e) => updateSettings({ quiet_hours_start: e.target.value || null })}
                        disabled={isUpdating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Конец</Label>
                      <Input
                        type="time"
                        value={settings?.quiet_hours_end || ""}
                        onChange={(e) => updateSettings({ quiet_hours_end: e.target.value || null })}
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
          </TabsContent>

          {/* Telegram Tab */}
          <TabsContent value="telegram" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TelegramBotSetup />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Telegram интеграция
                  </CardTitle>
                  <CardDescription>
                    Возможности бота @AIMusicVerseBot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Уведомления о готовых треках с аудио</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Быстрый доступ к библиотеке через deep-links</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Шеринг треков и плейлистов в чаты</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Inline-режим для поиска треков</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Публикация в Stories</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
