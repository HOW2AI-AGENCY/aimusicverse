import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Wand2, Crop, RotateCcw, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'avatar' | 'banner' | 'cover';
  onGenerated: (imageUrl: string) => void;
  defaultPrompt?: string;
  context?: {
    displayName?: string;
    bio?: string;
    genres?: string[];
    trackTitle?: string;
    trackStyle?: string;
  };
}

const ASPECT_RATIOS = {
  avatar: { width: 1, height: 1, label: '1:1 (Аватар)' },
  banner: { width: 3, height: 1, label: '3:1 (Баннер)' },
  cover: { width: 1, height: 1, label: '1:1 (Обложка)' },
};

const DEFAULT_PROMPTS = {
  avatar: 'Профессиональный, художественный аватар для музыкального продюсера. Современный стиль, креативный дизайн, яркие цвета.',
  banner: 'Атмосферный баннер для профиля музыканта. Абстрактная визуализация звуковых волн, глубокие цвета, футуристический дизайн.',
  cover: 'Стильная обложка музыкального трека. Абстрактное искусство, визуализация музыки, современный дизайн без текста.',
};

export function ImageGeneratorDialog({
  open,
  onOpenChange,
  type,
  onGenerated,
  defaultPrompt,
  context,
}: ImageGeneratorDialogProps) {
  const [prompt, setPrompt] = useState(defaultPrompt || DEFAULT_PROMPTS[type]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState([1]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const aspectRatio = ASPECT_RATIOS[type];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-profile-image', {
        body: {
          type: type === 'cover' ? 'avatar' : type, // cover uses same aspect as avatar
          prompt,
          displayName: context?.displayName,
          bio: context?.bio,
          genres: context?.genres,
        },
      });

      if (error) throw error;
      if (!data?.imageUrl) throw new Error('No image generated');

      setGeneratedImage(data.imageUrl);
      toast.success('Изображение сгенерировано!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Ошибка генерации изображения');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCrop = useCallback(async () => {
    if (!generatedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = async () => {
      // Set canvas size based on type
      const outputWidth = type === 'banner' ? 1200 : 512;
      const outputHeight = type === 'banner' ? 400 : 512;
      
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Calculate crop area
      const scale = zoom[0];
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      const sourceX = Math.max(0, (scaledWidth - outputWidth) / 2 + cropPosition.x);
      const sourceY = Math.max(0, (scaledHeight - outputHeight) / 2 + cropPosition.y);

      ctx.drawImage(
        img,
        sourceX / scale,
        sourceY / scale,
        outputWidth / scale,
        outputHeight / scale,
        0,
        0,
        outputWidth,
        outputHeight
      );

      // Convert to blob and upload
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const fileName = `${type}_cropped_${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          toast.error('Ошибка сохранения');
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        onGenerated(publicUrl);
        onOpenChange(false);
        toast.success('Изображение сохранено!');
      }, 'image/png');
    };

    img.src = generatedImage;
  }, [generatedImage, zoom, cropPosition, type, onGenerated, onOpenChange]);

  const handleAcceptWithoutCrop = () => {
    if (generatedImage) {
      onGenerated(generatedImage);
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setCropMode(false);
    setCropPosition({ x: 0, y: 0 });
    setZoom([1]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Генератор {type === 'avatar' ? 'аватара' : type === 'banner' ? 'баннера' : 'обложки'}
          </DialogTitle>
          <DialogDescription>
            Опишите желаемое изображение или используйте промпт по умолчанию
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>Промпт для генерации</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите желаемое изображение..."
              rows={3}
              className="resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Совет: чем подробнее описание, тем лучше результат
            </p>
          </div>

          {/* Preview Area */}
          <div
            className={cn(
              "relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/30",
              type === 'banner' ? 'aspect-[3/1]' : 'aspect-square'
            )}
          >
            {generatedImage ? (
              <div className="relative w-full h-full">
                <img
                  ref={imageRef}
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${zoom[0]}) translate(${-cropPosition.x}px, ${-cropPosition.y}px)`,
                    transformOrigin: 'center',
                  }}
                />
                {cropMode && (
                  <div className="absolute inset-0 border-4 border-primary/50 pointer-events-none">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="border border-primary/20" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Генерация...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Нажмите "Сгенерировать"
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Crop Controls */}
          {generatedImage && cropMode && (
            <div className="space-y-3">
              <Label>Масштаб</Label>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={1}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Actions */}
          <div className="flex gap-2">
            {!generatedImage ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Сгенерировать
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleReset} size="icon">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant={cropMode ? 'default' : 'outline'}
                  onClick={() => setCropMode(!cropMode)}
                  className="flex-1"
                >
                  <Crop className="w-4 h-4 mr-2" />
                  {cropMode ? 'Режим обрезки' : 'Обрезать'}
                </Button>
                <Button onClick={cropMode ? handleCrop : handleAcceptWithoutCrop} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  {cropMode ? 'Применить' : 'Использовать'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
