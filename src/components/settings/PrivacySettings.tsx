// PrivacySettings Component - Sprint 011 Task T088
// Privacy controls UI with profile visibility, content permissions

import React, { useState } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, MessageSquare, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { PrivacyLevel } from '@/types/profile';

/**
 * Privacy settings component with visibility controls
 */
export function PrivacySettings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile(user?.id);
  const updateProfile = useUpdateProfile();

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: (profile?.privacy_level as PrivacyLevel) || 'public',
    trackVisibility: (profile?.track_visibility as PrivacyLevel) || 'public',
    commentPermissions: (profile?.comment_permissions as PrivacyLevel) || 'everyone',
    showActivity: profile?.show_activity ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        updates: {
          privacy_level: privacySettings.profileVisibility,
          track_visibility: privacySettings.trackVisibility,
          comment_permissions: privacySettings.commentPermissions,
          show_activity: privacySettings.showActivity,
        },
      });
      toast.success('Настройки приватности сохранены');
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle>Приватность</CardTitle>
        </div>
        <CardDescription>
          Управляйте видимостью вашего профиля и контента
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="profile-visibility" className="text-base">
              Видимость профиля
            </Label>
          </div>
          <Select
            value={privacySettings.profileVisibility}
            onValueChange={(value) =>
              setPrivacySettings({ ...privacySettings, profileVisibility: value as PrivacyLevel })
            }
          >
            <SelectTrigger id="profile-visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div>
                  <div className="font-medium">Публичный</div>
                  <div className="text-xs text-muted-foreground">
                    Профиль виден всем пользователям
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="followers">
                <div>
                  <div className="font-medium">Только подписчики</div>
                  <div className="text-xs text-muted-foreground">
                    Только ваши подписчики видят профиль
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div>
                  <div className="font-medium">Приватный</div>
                  <div className="text-xs text-muted-foreground">Профиль скрыт от всех</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Track Visibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="track-visibility" className="text-base">
              Видимость треков
            </Label>
          </div>
          <Select
            value={privacySettings.trackVisibility}
            onValueChange={(value) =>
              setPrivacySettings({ ...privacySettings, trackVisibility: value as PrivacyLevel })
            }
          >
            <SelectTrigger id="track-visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">
                <div>
                  <div className="font-medium">Публичные</div>
                  <div className="text-xs text-muted-foreground">Все видят ваши треки</div>
                </div>
              </SelectItem>
              <SelectItem value="followers">
                <div>
                  <div className="font-medium">Только подписчики</div>
                  <div className="text-xs text-muted-foreground">
                    Только подписчики видят треки
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="private">
                <div>
                  <div className="font-medium">Приватные</div>
                  <div className="text-xs text-muted-foreground">Только вы видите треки</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Comment Permissions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="comment-permissions" className="text-base">
              Кто может комментировать
            </Label>
          </div>
          <Select
            value={privacySettings.commentPermissions}
            onValueChange={(value) =>
              setPrivacySettings({
                ...privacySettings,
                commentPermissions: value as PrivacyLevel,
              })
            }
          >
            <SelectTrigger id="comment-permissions">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">
                <div>
                  <div className="font-medium">Все</div>
                  <div className="text-xs text-muted-foreground">
                    Любой пользователь может комментировать
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="followers">
                <div>
                  <div className="font-medium">Только подписчики</div>
                  <div className="text-xs text-muted-foreground">
                    Только подписчики могут комментировать
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="off">
                <div>
                  <div className="font-medium">Отключены</div>
                  <div className="text-xs text-muted-foreground">
                    Комментарии отключены для всех
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show Activity */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="show-activity" className="text-base">
              Показывать активность
            </Label>
            <p className="text-sm text-muted-foreground">
              Другие пользователи видят вашу активность (лайки, комментарии)
            </p>
          </div>
          <Switch
            id="show-activity"
            checked={privacySettings.showActivity}
            onCheckedChange={(checked) =>
              setPrivacySettings({ ...privacySettings, showActivity: checked })
            }
          />
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Изменение настроек приватности может занять несколько минут для применения ко всему
            контенту
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </CardContent>
    </Card>
  );
}
