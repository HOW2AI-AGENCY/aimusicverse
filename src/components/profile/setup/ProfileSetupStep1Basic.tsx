import { useState } from 'react';
import { motion } from '@/lib/motion';
import { User, Camera, AtSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { ProfileSetupData } from './EnhancedProfileSetup';

interface ProfileSetupStep1BasicProps {
  data: ProfileSetupData;
  onUpdate: (updates: Partial<ProfileSetupData>) => void;
  userId?: string;
}

export function ProfileSetupStep1Basic({ data, onUpdate, userId }: ProfileSetupStep1BasicProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5МБ)');
      return;
    }
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      onUpdate({ avatarUrl: publicUrl });
      toast.success('Фото загружено');
    } catch (error) {
      logger.error('Error uploading avatar', error instanceof Error ? error : new Error(String(error)), {
        userId
      });
      toast.error('Ошибка загрузки фото');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={data.avatarUrl} />
            <AvatarFallback className="text-2xl bg-primary/10">
              {data.displayName?.[0]?.toUpperCase() || '?'}
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
        <p className="text-xs text-muted-foreground text-center">
          Нажмите на иконку для загрузки фото<br />
          или используем фото из Telegram
        </p>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Отображаемое имя *
        </Label>
        <Input
          id="displayName"
          value={data.displayName}
          onChange={(e) => onUpdate({ displayName: e.target.value })}
          placeholder="Как вас называть?"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Это имя будут видеть другие пользователи
        </p>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="username" className="flex items-center gap-2">
          <AtSign className="w-4 h-4" />
          Юзернейм (опционально)
        </Label>
        <Input
          id="username"
          value={data.username}
          onChange={(e) => onUpdate({ username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() })}
          placeholder="username"
          maxLength={30}
        />
        <p className="text-xs text-muted-foreground">
          Уникальный идентификатор для вашего профиля
        </p>
      </div>
    </motion.div>
  );
}
