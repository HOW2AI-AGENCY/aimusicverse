import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera, Upload, Sparkles, Loader2, X, Image as ImageIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface ArtistAvatarUploadProps {
  avatarUrl: string | null;
  onAvatarChange: (url: string | null) => void;
  artistName: string;
  styleDescription?: string;
  disabled?: boolean;
}

export function ArtistAvatarUpload({
  avatarUrl,
  onAvatarChange,
  artistName,
  styleDescription,
  disabled = false,
}: ArtistAvatarUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  const handleFileUpload = async (file: File, isReference = false) => {
    if (!user?.id) {
      toast.error('Необходима авторизация');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/artist-avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      if (isReference) {
        setReferenceImage(publicUrl);
        toast.success('Референс загружен. Нажмите "Сгенерировать" для создания портрета');
      } else {
        onAvatarChange(publicUrl);
        toast.success('Аватар загружен');
      }
    } catch (error) {
      logger.error('Error uploading avatar', error);
      toast.error('Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeneratePortrait = async () => {
    if (!artistName.trim()) {
      toast.error('Введите имя артиста');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-artist-portrait', {
        body: { 
          artistName: artistName.trim(),
          styleDescription: styleDescription || undefined,
          referenceImageUrl: referenceImage || undefined,
        }
      });

      if (error) throw error;

      if (data?.avatarUrl) {
        onAvatarChange(data.avatarUrl);
        setReferenceImage(null);
        toast.success('Портрет сгенерирован');
      } else {
        throw new Error('No avatar URL in response');
      }
    } catch (error) {
      logger.error('Error generating portrait', error);
      toast.error('Ошибка генерации портрета');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, isReference = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Выберите изображение');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Файл слишком большой (макс. 10MB)');
        return;
      }
      handleFileUpload(file, isReference);
    }
    e.target.value = '';
  };

  const isProcessing = isUploading || isGenerating;

  return (
    <div className="space-y-4">
      {/* Avatar Preview */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-28 h-28">
          {/* Glow effect */}
          {avatarUrl && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 blur-xl" />
          )}
          
          <div className={cn(
            "relative w-full h-full rounded-full overflow-hidden border-4 border-primary/20 bg-gradient-to-br from-primary/20 to-primary/10",
            isProcessing && "opacity-50"
          )}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-primary/50" />
              </div>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          {avatarUrl && !isProcessing && (
            <button
              onClick={() => onAvatarChange(null)}
              className="absolute -top-1 -right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Reference Image Preview */}
        {referenceImage && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
            <img src={referenceImage} alt="Reference" className="w-10 h-10 rounded object-cover" />
            <span className="text-xs text-muted-foreground">Референс загружен</span>
            <button
              onClick={() => setReferenceImage(null)}
              className="p-1 rounded-full hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* Generate Portrait */}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleGeneratePortrait}
          disabled={disabled || isProcessing || !artistName.trim()}
          className="gap-1.5 col-span-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Генерация...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {referenceImage ? 'Сгенерировать по референсу' : 'Сгенерировать портрет'}
            </>
          )}
        </Button>

        {/* Upload Photo */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="gap-1.5"
        >
          <Upload className="w-4 h-4" />
          Загрузить
        </Button>

        {/* Camera */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="gap-1.5"
        >
          <Camera className="w-4 h-4" />
          Фото
        </Button>

        {/* Reference Image */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => referenceInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="gap-1.5 col-span-2 text-muted-foreground"
        >
          <ImageIcon className="w-4 h-4" />
          Загрузить референс для генерации
        </Button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileInputChange(e, false)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => handleFileInputChange(e, false)}
      />
      <input
        ref={referenceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileInputChange(e, true)}
      />
    </div>
  );
}
