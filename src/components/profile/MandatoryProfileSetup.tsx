import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  User, Camera, Sparkles, CheckCircle, AtSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface MandatoryProfileSetupProps {
  onComplete: () => void;
}

export function MandatoryProfileSetup({ onComplete }: MandatoryProfileSetupProps) {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Import from existing profile OR Telegram data
  useEffect(() => {
    if (profile) {
      // Use existing profile data
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      setDisplayName(fullName || profile.first_name || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.photo_url || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5МБ)');
      return;
    }
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setAvatarUrl(publicUrl);
      toast.success('Фото загружено');
    } catch (error) {
      logger.error('Error uploading avatar', error instanceof Error ? error : new Error(String(error)), {
        userId: user?.id
      });
      toast.error('Ошибка загрузки фото');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Введите имя для профиля');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        first_name: displayName.trim(),
        username: username.trim() || null,
        photo_url: avatarUrl || null,
        is_public: true, // Always public for free users
      });

      toast.success('Профиль создан!');
      onComplete();
    } catch (error) {
      logger.error('Error saving profile', error instanceof Error ? error : new Error(String(error)), {
        userId: user?.id
      });
      toast.error('Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="p-3 rounded-xl bg-primary/10 border border-primary/20"
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">Создайте публичный профиль</h2>
                <p className="text-sm text-muted-foreground">
                  Это нужно для сообщества и лидерборда
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {displayName?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload"
                  className={cn(
                    "absolute -bottom-1 -right-1 p-2 rounded-full cursor-pointer transition-colors",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    isUploading && "opacity-50 pointer-events-none"
                  )}
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Нажмите на иконку для загрузки фото
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Отображаемое имя *
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Как вас называть?"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <AtSign className="w-4 h-4" />
                Юзернейм (опционально)
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="username"
              />
            </div>

            {/* Info - Free users are always public */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
              💡 На бесплатном тарифе ваш профиль и треки публичны для сообщества. Это помогает вам получать лайки и набирать аудиторию!
            </div>

            {/* Save button */}
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !displayName.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Создать профиль
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
