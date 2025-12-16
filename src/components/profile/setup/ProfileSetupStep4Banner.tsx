import { useState } from 'react';
import { motion } from '@/lib/motion';
import { ImageIcon, Upload, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { ProfileSetupData } from './EnhancedProfileSetup';

interface ProfileSetupStep4BannerProps {
  data: ProfileSetupData;
  onUpdate: (updates: Partial<ProfileSetupData>) => void;
  userId?: string;
}

export function ProfileSetupStep4Banner({ data, onUpdate, userId }: ProfileSetupStep4BannerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10МБ)');
      return;
    }
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${userId}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      onUpdate({ bannerUrl: publicUrl });
      toast.success('Баннер загружен');
    } catch (error) {
      logger.error('Error uploading banner', error instanceof Error ? error : new Error(String(error)), {
        userId
      });
      toast.error('Ошибка загрузки баннера');
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
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Баннер профиля
        </Label>
        <p className="text-xs text-muted-foreground">
          Баннер отображается вверху вашего публичного профиля
        </p>
      </div>

      {/* Banner Preview */}
      <div className="relative aspect-[3/1] rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/30">
        {data.bannerUrl ? (
          <>
            <img
              src={data.bannerUrl}
              alt="Баннер профиля"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <label htmlFor="banner-upload" className="cursor-pointer">
                <Button variant="secondary" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Заменить
                  </span>
                </Button>
              </label>
            </div>
            <div className="absolute top-2 right-2">
              <div className="p-1 rounded-full bg-green-500 text-white">
                <Check className="w-3 h-3" />
              </div>
            </div>
          </>
        ) : (
          <label
            htmlFor="banner-upload"
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors",
              "hover:bg-muted/50",
              isUploading && "pointer-events-none"
            )}
          >
            {isUploading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Нажмите для загрузки
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Рекомендуемый размер: 1200x400px
                </span>
              </>
            )}
          </label>
        )}
        <input
          id="banner-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerUpload}
          disabled={isUploading}
        />
      </div>

      {/* Skip banner option */}
      <div className="p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground text-center">
        Баннер можно добавить позже в настройках профиля
      </div>

      {/* Preview Card */}
      <div className="p-4 rounded-lg border bg-card">
        <p className="text-sm font-medium mb-3">Предпросмотр профиля:</p>
        <div className="relative rounded-lg overflow-hidden border">
          {/* Mini banner */}
          <div 
            className={cn(
              "h-16 bg-gradient-to-r from-primary/20 to-primary/5",
              data.bannerUrl && "bg-cover bg-center"
            )}
            style={data.bannerUrl ? { backgroundImage: `url(${data.bannerUrl})` } : undefined}
          />
          {/* Avatar overlay */}
          <div className="absolute left-4 top-8">
            <div className="w-16 h-16 rounded-full border-4 border-background bg-muted overflow-hidden">
              {data.avatarUrl ? (
                <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                  {data.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </div>
          {/* Info */}
          <div className="pt-10 pb-4 px-4">
            <h4 className="font-bold">{data.displayName || 'Ваше имя'}</h4>
            {data.username && (
              <p className="text-xs text-muted-foreground">@{data.username}</p>
            )}
            {data.bio && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.bio}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
