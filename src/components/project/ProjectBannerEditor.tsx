import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Image, Upload, Wand2, Download, Check, Loader2, Sparkles, 
  Move, ZoomIn, ZoomOut, RotateCcw, Crop, X 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectBannerEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    title: string;
    genre?: string | null;
    mood?: string | null;
    concept?: string | null;
    banner_url?: string | null;
    cover_url?: string | null;
  };
  onBannerUpdate: (url: string) => void;
}

const BANNER_WIDTH = 1920;
const BANNER_HEIGHT = 1080;
const ASPECT_RATIO = BANNER_WIDTH / BANNER_HEIGHT;

const STYLE_PRESETS = [
  { label: 'Кинематограф', value: 'cinematic wide shot, dramatic lighting, movie poster style, epic atmosphere' },
  { label: 'Неон', value: 'neon lights, cyberpunk cityscape, glowing effects, synthwave, wide panorama' },
  { label: 'Абстракция', value: 'abstract art, flowing colors, dynamic movement, artistic visualization, wide format' },
  { label: 'Природа', value: 'majestic landscape, cinematic nature, golden hour, panoramic view' },
  { label: 'Минимал', value: 'minimalist design, clean geometric shapes, negative space, modern aesthetic' },
  { label: 'Ретро', value: 'vintage retro aesthetic, film grain, warm colors, nostalgic wide banner' },
];

export function ProjectBannerEditor({
  open,
  onOpenChange,
  project,
  onBannerUpdate,
}: ProjectBannerEditorProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'upload' | 'generate' | 'crop'>('generate');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(project.banner_url || null);
  
  // Crop state
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  const buildPrompt = () => {
    const parts: string[] = [];
    
    if (selectedPreset) {
      parts.push(selectedPreset);
    }
    
    if (project.genre) {
      parts.push(`${project.genre} music genre atmosphere`);
    }
    
    if (project.mood) {
      parts.push(`${project.mood} mood and feeling`);
    }
    
    if (project.concept) {
      parts.push(`inspired by: ${project.concept}`);
    }
    
    if (customPrompt.trim()) {
      parts.push(customPrompt.trim());
    }
    
    parts.push('16:9 widescreen banner format, ultra high resolution, no text, no watermarks, professional album banner');
    
    return parts.join(', ');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const prompt = buildPrompt();

      const { data, error } = await supabase.functions.invoke('generate-project-media', {
        body: {
          prompt,
          width: BANNER_WIDTH,
          height: BANNER_HEIGHT,
          projectId: project.id,
          assetType: 'banner',
        },
      });

      if (error) throw error;

      if (data?.url) {
        setPreviewUrl(data.url);
        setCropImage(data.url);
        setActiveTab('crop');
        toast.success('Баннер сгенерирован');
      }
    } catch (err: any) {
      console.error('Error generating banner:', err);
      toast.error(err.message || 'Ошибка генерации');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 10MB');
      return;
    }

    // Create preview and go to crop
    const url = URL.createObjectURL(file);
    setCropImage(url);
    setCropScale(1);
    setCropPosition({ x: 0, y: 0 });
    setActiveTab('crop');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...cropPosition };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    setCropPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    });
  }, [isDragging]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetCrop = () => {
    setCropScale(1);
    setCropPosition({ x: 0, y: 0 });
  };

  const handleApplyCrop = async () => {
    if (!cropImage) return;
    
    setIsUploading(true);

    try {
      // Create canvas for cropping
      const canvas = document.createElement('canvas');
      canvas.width = BANNER_WIDTH;
      canvas.height = BANNER_HEIGHT;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas not supported');

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = cropImage;
      });

      // Calculate crop area
      const previewWidth = 400; // Preview container width
      const previewHeight = previewWidth / ASPECT_RATIO;
      
      const scaleX = img.width / (previewWidth * cropScale);
      const scaleY = img.height / (previewHeight * cropScale);
      
      const sourceX = -cropPosition.x * scaleX;
      const sourceY = -cropPosition.y * scaleY;
      const sourceWidth = previewWidth * scaleX;
      const sourceHeight = previewHeight * scaleY;

      ctx.drawImage(
        img,
        Math.max(0, sourceX),
        Math.max(0, sourceY),
        Math.min(img.width, sourceWidth),
        Math.min(img.height, sourceHeight),
        0,
        0,
        BANNER_WIDTH,
        BANNER_HEIGHT
      );

      // Convert to blob and upload
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 0.95);
      });

      const fileName = `banners/${project.id}_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      // Update project
      const { error: updateError } = await supabase
        .from('music_projects')
        .update({ 
          banner_url: publicUrl,
          banner_prompt: selectedPreset || customPrompt || null,
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      onBannerUpdate(publicUrl);
      toast.success('Баннер сохранён');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      toast.error('Ошибка сохранения');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewUrl) return;

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title.replace(/\s+/g, '_')}_banner.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Ошибка загрузки');
    }
  };

  const content = (
    <div className="flex flex-col h-full min-h-0">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full min-h-0">
        <TabsList className="w-full grid grid-cols-3 shrink-0 mx-4 mt-2" style={{ width: 'calc(100% - 32px)' }}>
          <TabsTrigger value="generate" className="gap-1.5 text-xs">
            <Wand2 className="w-3.5 h-3.5" />
            Генерация
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" />
            Загрузка
          </TabsTrigger>
          <TabsTrigger value="crop" disabled={!cropImage} className="gap-1.5 text-xs">
            <Crop className="w-3.5 h-3.5" />
            Обрезка
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Current Banner Preview */}
              {project.banner_url && (
                <div className="relative rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={project.banner_url}
                    alt="Current banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <span className="absolute bottom-2 left-2 text-xs text-muted-foreground">
                    Текущий баннер
                  </span>
                </div>
              )}

              {/* Style Presets */}
              <div className="space-y-2">
                <Label className="text-sm">Стиль баннера</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_PRESETS.map((preset) => (
                    <Badge
                      key={preset.label}
                      variant={selectedPreset === preset.value ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => setSelectedPreset(
                        selectedPreset === preset.value ? null : preset.value
                      )}
                    >
                      {preset.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label className="text-sm">Описание</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Опишите желаемый баннер: цвета, настроение, элементы..."
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Жанр ({project.genre}) и настроение ({project.mood}) добавятся автоматически
                </p>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Генерация баннера...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Сгенерировать баннер
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Размер: 1920×1080px (16:9)
              </p>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full p-8 rounded-xl border-2 border-dashed transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  "flex flex-col items-center justify-center gap-3"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Загрузить изображение</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG или WEBP до 10MB
                  </p>
                </div>
              </motion.button>

              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Рекомендации:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Минимальный размер: 1920×1080px</li>
                  <li>• Соотношение сторон: 16:9</li>
                  <li>• Избегайте текста на изображении</li>
                  <li>• После загрузки можно обрезать</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Crop Tab */}
        <TabsContent value="crop" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {cropImage && (
                <>
                  {/* Crop Preview */}
                  <div 
                    className="relative rounded-lg overflow-hidden bg-muted/50 border-2 border-primary/30 cursor-move select-none"
                    style={{ aspectRatio: '16/9' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={cropImage}
                      alt="Crop preview"
                      className="absolute pointer-events-none"
                      style={{
                        transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`,
                        transformOrigin: 'top left',
                        maxWidth: 'none',
                      }}
                      draggable={false}
                    />
                    {/* Crop overlay */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/50" />
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs">
                      <Move className="w-3 h-3" />
                      Перетащите для позиционирования
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Масштаб</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(cropScale * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ZoomOut className="w-4 h-4 text-muted-foreground" />
                      <Slider
                        value={[cropScale]}
                        onValueChange={([v]) => setCropScale(v)}
                        min={0.5}
                        max={3}
                        step={0.1}
                        className="flex-1"
                      />
                      <ZoomIn className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetCrop}
                      className="gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Сбросить
                    </Button>
                    <Button
                      onClick={handleApplyCrop}
                      disabled={isUploading}
                      className="flex-1 gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Применить баннер
                        </>
                      )}
                    </Button>
                  </div>

                  {previewUrl && (
                    <Button
                      variant="ghost"
                      onClick={handleDownload}
                      className="w-full gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Скачать оригинал
                    </Button>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Баннер проекта
            </DrawerTitle>
            <DrawerDescription>
              Создайте широкоформатный баннер для «{project.title}»
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Баннер проекта
          </DialogTitle>
          <DialogDescription>
            Создайте широкоформатный баннер для «{project.title}»
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
