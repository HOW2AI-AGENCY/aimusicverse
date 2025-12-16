import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Check,
  Trash2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MenuImageConfig {
  key: string;
  title: string;
  description: string;
  currentUrl: string | null;
  fallbackUrl: string;
}

const MENU_IMAGE_CONFIGS: MenuImageConfig[] = [
  {
    key: 'mainMenu',
    title: 'Главное меню',
    description: 'Приветственное изображение /start',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'generator',
    title: 'Генератор',
    description: 'Создание музыки',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'library',
    title: 'Библиотека',
    description: 'Созданные треки',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'projects',
    title: 'Проекты',
    description: 'Музыкальные проекты',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'analysis',
    title: 'Анализ',
    description: 'MIDI, аккорды, BPM',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'settings',
    title: 'Настройки',
    description: 'Управление аккаунтом',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'cloud',
    title: 'Облако',
    description: 'Загруженные файлы',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'profile',
    title: 'Профиль',
    description: 'Статистика и баланс',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f39cffb?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'shop',
    title: 'Магазин',
    description: 'Покупка кредитов',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop&q=80'
  },
  {
    key: 'help',
    title: 'Справка',
    description: 'Помощь по боту',
    currentUrl: null,
    fallbackUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop&q=80'
  },
];

export function AdminBotImagesPanel() {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();

  // Fetch current images from database config
  const { data: imageConfig, isLoading } = useQuery({
    queryKey: ['bot-menu-images-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('telegram_bot_config')
        .select('*')
        .eq('config_key', 'menu_images')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.config_value as Record<string, string> || {};
    }
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (images: Record<string, string>) => {
      const { error } = await supabase
        .from('telegram_bot_config')
        .upsert({
          config_key: 'menu_images',
          config_value: images,
          description: 'Изображения меню бота',
          updated_at: new Date().toISOString()
        }, { onConflict: 'config_key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-menu-images-config'] });
      toast.success('Конфигурация сохранена');
    },
    onError: (error) => {
      toast.error('Ошибка сохранения: ' + (error as Error).message);
    }
  });

  const handleFileUpload = async (key: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    setUploadingKey(key);
    try {
      const fileName = `menu-images/${key}.${file.name.split('.').pop()}`;
      
      // Delete existing file if any
      await supabase.storage.from('bot-assets').remove([fileName]);
      
      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('bot-assets')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('bot-assets')
        .getPublicUrl(fileName);

      // Update config
      const newConfig = { ...imageConfig, [key]: publicUrl };
      await saveConfigMutation.mutateAsync(newConfig);
      
      toast.success(`Изображение "${key}" загружено`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки: ' + (error as Error).message);
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      // Remove from storage
      const extensions = ['png', 'jpg', 'jpeg', 'webp'];
      for (const ext of extensions) {
        await supabase.storage.from('bot-assets').remove([`menu-images/${key}.${ext}`]);
      }

      // Update config
      const newConfig = { ...imageConfig };
      delete newConfig[key];
      await saveConfigMutation.mutateAsync(newConfig);
      
      toast.success(`Изображение "${key}" удалено`);
    } catch (error) {
      toast.error('Ошибка удаления: ' + (error as Error).message);
    }
  };

  const getImageUrl = (config: MenuImageConfig) => {
    return imageConfig?.[config.key] || config.fallbackUrl;
  };

  const isCustomImage = (key: string) => {
    return imageConfig?.[key] !== undefined;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Изображения меню бота
        </CardTitle>
        <CardDescription>
          Загрузите изображения для пунктов меню Telegram бота. Рекомендуемый размер: 800x400px
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="grid gap-4">
            {MENU_IMAGE_CONFIGS.map((config) => (
              <div
                key={config.key}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border bg-card"
              >
                {/* Preview */}
                <div className="relative w-full sm:w-40 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={getImageUrl(config)}
                    alt={config.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = config.fallbackUrl;
                    }}
                  />
                  {isCustomImage(config.key) && (
                    <div className="absolute top-1 right-1">
                      <div className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                        Custom
                      </div>
                    </div>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium">{config.title}</h4>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                      <code className="text-xs text-muted-foreground">{config.key}</code>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { fileInputRefs.current[config.key] = el; }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(config.key, file);
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRefs.current[config.key]?.click()}
                      disabled={uploadingKey === config.key}
                    >
                      {uploadingKey === config.key ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Загрузить
                    </Button>
                    
                    {isCustomImage(config.key) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(config.key)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(getImageUrl(config), '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
