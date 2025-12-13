// PrivacySettings component - Sprint 011
import { Globe, Lock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/contexts/TelegramContext';

export function PrivacySettings() {
  const { hapticFeedback } = useTelegram();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const handleToggle = (key: string, value: boolean) => {
    hapticFeedback('light');
    updateProfile.mutate({ [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Приватность
        </CardTitle>
        <CardDescription>
          Настройки видимости вашего профиля и контента
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Публичный профиль
            </Label>
            <p className="text-sm text-muted-foreground">
              Другие пользователи смогут видеть ваш профиль
            </p>
          </div>
          <Switch
            checked={profile?.is_public ?? true}
            onCheckedChange={(v) => handleToggle('is_public', v)}
            disabled={updateProfile.isPending}
          />
        </div>

        <Separator />

        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Публичный контент</p>
              <p className="text-xs text-muted-foreground mt-1">
                Треки, созданные на бесплатном тарифе, автоматически становятся публичными. 
                Для создания приватного контента требуется подписка.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
