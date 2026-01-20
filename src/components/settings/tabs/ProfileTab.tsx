/**
 * Profile Tab
 * 
 * Personal information editing: avatar, name, surname.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from '@/lib/motion';
import { AvatarUpload } from '@/components/settings/AvatarUpload';

interface ProfileTabProps {
  profile: { photo_url?: string | null } | null | undefined;
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onAvatarUpload: (url: string | null) => void;
  onSave: () => void;
  isSaving: boolean;
  createFocusHandler: (options?: any) => (event: React.FocusEvent<HTMLElement>) => void;
}

export function ProfileTab({
  profile,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onAvatarUpload,
  onSave,
  isSaving,
  createFocusHandler,
}: ProfileTabProps) {
  return (
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
        <CardContent className="space-y-6">
          <AvatarUpload
            currentUrl={profile?.photo_url}
            firstName={firstName}
            onUpload={onAvatarUpload}
          />

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="firstName">Имя</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
              onFocus={createFocusHandler()}
              placeholder="Введите имя"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Фамилия</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
              onFocus={createFocusHandler()}
              placeholder="Введите фамилию"
            />
          </div>

          <Button 
            onClick={onSave} 
            className="w-full"
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Сохранить изменения
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
