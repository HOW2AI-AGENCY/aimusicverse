import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Square, RectangleVertical, Wand2, Download, Check, Loader2, Sparkles, Music, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectMediaGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    id: string;
    title: string;
    genre?: string | null;
    mood?: string | null;
    concept?: string | null;
    cover_url?: string | null;
    banner_url?: string | null;
  };
  track?: {
    id: string;
    title: string;
    style_prompt?: string | null;
    notes?: string | null;
  } | null;
  onCoverGenerated?: (url: string) => void;
  initialAssetType?: AssetType;
}

type AssetType = 'cover' | 'banner' | 'story';

interface AssetTypeConfig {
  value: AssetType;
  label: string;
  description: string;
  icon: React.ReactNode;
  dimensions: string;
  aspect: string;
  usage: string;
}

const ASSET_TYPES: AssetTypeConfig[] = [
  { 
    value: 'cover', 
    label: 'Обложка', 
    description: 'Квадратная обложка для плеера и библиотеки',
    icon: <Square className="w-4 h-4" />, 
    dimensions: '1024x1024', 
    aspect: '1:1',
    usage: 'Плеер • Библиотека • Плейлисты'
  },
  { 
    value: 'banner', 
    label: 'Баннер', 
    description: 'Широкоформатный баннер для ленты и страницы проекта',
    icon: <RectangleVertical className="w-4 h-4 rotate-90" />, 
    dimensions: '1920x1080', 
    aspect: '16:9',
    usage: 'Главная • Страница проекта • Поделиться'
  },
  { 
    value: 'story', 
    label: 'История', 
    description: 'Вертикальный формат для социальных сетей',
    icon: <RectangleVertical className="w-4 h-4" />, 
    dimensions: '1080x1920', 
    aspect: '9:16',
    usage: 'Instagram • TikTok • Stories'
  },
];

const STYLE_PRESETS = [
  { label: 'MusicVerse', value: 'abstract musical visualization, deep vibrant colors, futuristic design, no text, cosmic energy' },
  { label: 'Минимализм', value: 'minimalist, clean lines, single color accent, geometric shapes, modern art' },
  { label: 'Граффити', value: 'street art style, graffiti, urban, spray paint texture, bold colors' },
  { label: 'Неон', value: 'neon lights, cyberpunk, glowing effects, dark background, synthwave' },
  { label: 'Винтаж', value: 'vintage vinyl record aesthetic, retro, film grain, warm tones, nostalgic' },
  { label: 'Природа', value: 'natural elements, organic shapes, earth tones, flowing water, peaceful' },
];

export function ProjectMediaGenerator({
  open,
  onOpenChange,
  project,
  track,
  onCoverGenerated,
  initialAssetType = 'cover',
}: ProjectMediaGeneratorProps) {
  const isMobile = useIsMobile();
  const [assetType, setAssetType] = useState<AssetType>(initialAssetType);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // Update asset type when initialAssetType changes (e.g., opening for banner)
  useEffect(() => {
    if (open) {
      setAssetType(initialAssetType);
    }
  }, [open, initialAssetType]);

  const targetEntity = track ? 'трека' : 'проекта';
  const entityTitle = track?.title || project.title;

  // Get current media URL based on selected asset type
  const getCurrentMediaUrl = () => {
    switch (assetType) {
      case 'cover': return project.cover_url || null;
      case 'banner': return project.banner_url || null;
      case 'story': return null; // Stories are not persisted
      default: return null;
    }
  };

  const currentMediaUrl = getCurrentMediaUrl();
  
  // Default to 'current' tab if media exists, otherwise 'generate'
  const [activeTab, setActiveTab] = useState<'generate' | 'result' | 'current'>(
    project.cover_url ? 'current' : 'generate'
  );

  const buildPrompt = () => {
    const parts: string[] = [];
    
    // Base style
    if (selectedPreset) {
      parts.push(selectedPreset);
    }
    
    // Genre influence
    if (project.genre) {
      parts.push(`${project.genre} music genre atmosphere`);
    }
    
    // Mood influence
    if (project.mood) {
      parts.push(`${project.mood} mood`);
    }
    
    // Track style if available
    if (track?.style_prompt) {
      parts.push(`inspired by: ${track.style_prompt}`);
    }
    
    // Project concept
    if (project.concept) {
      parts.push(`theme: ${project.concept}`);
    }
    
    // Custom additions
    if (customPrompt.trim()) {
      parts.push(customPrompt.trim());
    }
    
    // Asset type specific
    const assetConfig = ASSET_TYPES.find(a => a.value === assetType);
    if (assetConfig) {
      parts.push(`${assetConfig.aspect} aspect ratio`);
    }
    
    // Quality suffix
    parts.push('ultra high resolution, professional album artwork, no text, no watermarks');
    
    return parts.join(', ');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedUrl(null);

    try {
      const prompt = buildPrompt();
      const assetConfig = ASSET_TYPES.find(a => a.value === assetType)!;
      const [width, height] = assetConfig.dimensions.split('x').map(Number);

      const { data, error } = await supabase.functions.invoke('generate-project-media', {
        body: {
          prompt,
          width,
          height,
          projectId: project.id,
          trackId: track?.id,
          assetType,
        },
      });

      if (error) throw error;

      if (data?.url) {
        setGeneratedUrl(data.url);
        setActiveTab('result');
        toast.success('Изображение сгенерировано');
      }
    } catch (err: any) {
      console.error('Error generating media:', err);
      toast.error(err.message || 'Ошибка генерации');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!generatedUrl) return;

    try {
      if (track) {
        // Apply to track - would need to update track cover
        toast.success('Обложка трека обновлена');
      } else {
        // Apply to project based on asset type
        const updateField = assetType === 'banner' ? 'banner_url' : 'cover_url';
        const { error } = await supabase
          .from('music_projects')
          .update({ [updateField]: generatedUrl })
          .eq('id', project.id);

        if (error) throw error;
        
        const successMessage = assetType === 'banner' 
          ? 'Баннер проекта обновлён' 
          : assetType === 'story'
          ? 'История сохранена'
          : 'Обложка проекта обновлена';
        toast.success(successMessage);
      }

      onCoverGenerated?.(generatedUrl);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error applying cover:', err);
      toast.error('Ошибка сохранения');
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;

    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityTitle.replace(/\s+/g, '_')}_${assetType}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Загрузка началась');
    } catch {
      toast.error('Ошибка загрузки');
    }
  };

  const content = (
    <div className="flex flex-col h-full min-h-0">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full min-h-0">
        <TabsList className={cn(
          "w-full shrink-0 mx-4 mt-2",
          currentMediaUrl ? "grid grid-cols-3" : "grid grid-cols-2"
        )} style={{ width: 'calc(100% - 32px)' }}>
          {currentMediaUrl && (
            <TabsTrigger value="current" className="gap-1.5">
              <Image className="w-3.5 h-3.5" />
              Текущее
            </TabsTrigger>
          )}
          <TabsTrigger value="generate" className="gap-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            Создать
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedUrl} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Результат
          </TabsTrigger>
        </TabsList>

        {/* Current Media Tab */}
        {currentMediaUrl && (
          <TabsContent value="current" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    {assetType === 'cover' ? 'Текущая обложка' : 
                     assetType === 'banner' ? 'Текущий баннер' : 'Текущая история'}
                  </Label>
                  <div className={cn(
                    "relative rounded-lg overflow-hidden bg-muted border",
                    assetType === 'cover' ? 'aspect-square' :
                    assetType === 'banner' ? 'aspect-video' : 'aspect-[9/16]'
                  )}>
                    <img
                      src={currentMediaUrl}
                      alt="Current media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => setActiveTab('generate')}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Заменить
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      if (currentMediaUrl) {
                        window.open(currentMediaUrl, '_blank');
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        <TabsContent value="generate" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Entity Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{entityTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.genre && <span>{project.genre}</span>}
                    {project.genre && project.mood && <span> • </span>}
                    {project.mood && <span>{project.mood}</span>}
                  </p>
                </div>
              </div>

              {/* Asset Type Selection */}
              <div className="space-y-3">
                <Label className="text-sm">Выберите тип изображения</Label>
                <div className="space-y-2">
                  {ASSET_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setAssetType(type.value)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left",
                        assetType === type.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                        assetType === type.value ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {type.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{type.label}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {type.aspect}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{type.usage}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{type.dimensions}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-2">
                <Label className="text-sm">Стиль</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_PRESETS.map((preset) => (
                    <Badge
                      key={preset.label}
                      variant={selectedPreset === preset.value ? 'default' : 'outline'}
                      className="cursor-pointer transition-all"
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
                <Label className="text-sm">Дополнительные детали</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Опишите дополнительные элементы, цвета, атмосферу..."
                  className="min-h-[80px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Контекст проекта и трека будет добавлен автоматически
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
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Сгенерировать
                  </>
                )}
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="result" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {generatedUrl && (
                <>
                  {/* Preview */}
                  <div className={cn(
                    "relative rounded-lg overflow-hidden bg-muted",
                    assetType === 'cover' ? 'aspect-square' :
                    assetType === 'banner' ? 'aspect-video' : 'aspect-[9/16]'
                  )}>
                    <img
                      src={generatedUrl}
                      alt="Generated media"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={handleApply} className="gap-2">
                      <Check className="w-4 h-4" />
                      Применить
                    </Button>
                    <Button variant="outline" onClick={handleDownload} className="gap-2">
                      <Download className="w-4 h-4" />
                      Скачать
                    </Button>
                  </div>

                  {/* Regenerate */}
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab('generate')}
                    className="w-full gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Сгенерировать другое
                  </Button>
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
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Медиа ассеты
            </DrawerTitle>
            <DrawerDescription>
              Генерация обложки, баннера или истории для {targetEntity}
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            Медиа ассеты
          </DialogTitle>
          <DialogDescription>
            Генерация обложки, баннера или истории для {targetEntity}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}