import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Music, Mic, FileAudio, Disc, Sparkles, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SUNO_MODELS, getAvailableModels } from '@/constants/sunoModels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/player-utils';

interface AudioCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  initialAudioFile?: File;
  prefillData?: {
    title?: string | null;
    style?: string | null;
    lyrics?: string | null;
    isInstrumental?: boolean;
  };
}

// Model duration limits in seconds
const MODEL_LIMITS: Record<string, { duration: number; label: string }> = {
  'V5': { duration: 240, label: '4 мин' },
  'V4_5PLUS': { duration: 480, label: '8 мин' },
  'V4_5ALL': { duration: 60, label: '1 мин' },
  'V4': { duration: 240, label: '4 мин' },
  'V3_5': { duration: 180, label: '3 мин' },
};

export const AudioCoverDialog = ({
  open,
  onOpenChange,
  projectId,
  initialAudioFile,
  prefillData
}: AudioCoverDialogProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  
  // Core settings (simplified)
  const [style, setStyle] = useState(prefillData?.style || '');
  const [title, setTitle] = useState(prefillData?.title ? `${prefillData.title} (кавер)` : '');
  const [lyrics, setLyrics] = useState(prefillData?.lyrics || '');
  const [instrumental, setInstrumental] = useState(prefillData?.isInstrumental ?? false);
  const [model, setModel] = useState('V4_5ALL');
  
  // Advanced (collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativeTags, setNegativeTags] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');
  
  // Validation
  const [durationError, setDurationError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      if (prefillData) {
        setStyle(prefillData.style || '');
        setTitle(prefillData.title ? `${prefillData.title} (кавер)` : '');
        setLyrics(prefillData.lyrics || '');
        setInstrumental(prefillData.isInstrumental ?? false);
      }
    }
  }, [open, prefillData]);

  // Handle initial audio file
  useEffect(() => {
    if (open && initialAudioFile && !audioFile) {
      handleFileSelect(initialAudioFile);
    }
  }, [open, initialAudioFile]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // Validate duration when model or audio changes
  useEffect(() => {
    if (audioDuration) {
      const limit = MODEL_LIMITS[model]?.duration || 60;
      if (audioDuration > limit) {
        const mins = Math.floor(limit / 60);
        const secs = limit % 60;
        setDurationError(`Аудио (${formatDuration(audioDuration)}) превышает лимит модели (${mins}:${secs.toString().padStart(2, '0')})`);
      } else {
        setDurationError(null);
      }
    }
  }, [audioDuration, model]);


  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Выберите аудиофайл');
      return;
    }

    setAudioFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '') + ' (кавер)');
    }

    const previewUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(previewUrl);

    const audio = new Audio();
    audio.src = previewUrl;
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      setAudioDuration(duration);
      
      // Auto-select best model for duration
      if (duration > 60 && model === 'V4_5ALL') {
        if (duration <= 180) {
          setModel('V3_5');
        } else if (duration <= 240) {
          setModel('V5');
        } else {
          setModel('V4_5PLUS');
        }
        toast.info('Модель автоматически выбрана для вашего аудио');
      }
    };
  };

  const clearAudio = () => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioFile(null);
    setAudioDuration(null);
    setAudioPreviewUrl(null);
    setDurationError(null);
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      toast.error('Загрузите аудиофайл');
      return;
    }

    if (!style.trim()) {
      toast.error('Укажите стиль музыки');
      return;
    }

    if (!instrumental && !lyrics.trim()) {
      toast.error('Укажите текст для вокальной композиции');
      return;
    }

    if (durationError) {
      toast.error(durationError);
      return;
    }

    setLoading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });

      const { data, error } = await supabase.functions.invoke('suno-upload-cover', {
        body: {
          audioFile: {
            name: audioFile.name,
            type: audioFile.type,
            data: reader.result,
          },
          audioDuration,
          model,
          customMode: true,
          instrumental,
          style,
          title: title || 'Кавер',
          prompt: instrumental ? undefined : lyrics,
          negativeTags: negativeTags || undefined,
          vocalGender: vocalGender || undefined,
          projectId,
        }
      });

      if (error) throw error;

      toast.success('Создание кавера началось! 🎵', {
        description: 'Трек появится в библиотеке через 1-3 минуты',
      });

      // Reset and close
      clearAudio();
      setStyle('');
      setTitle('');
      setLyrics('');
      setNegativeTags('');
      setVocalGender('');
      onOpenChange(false);
    } catch (error) {
      logger.error('Cover submit error', { error });
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('INSUFFICIENT_CREDITS')) {
        toast.error('Недостаточно кредитов');
      } else if (errorMessage.includes('DURATION_LIMIT')) {
        toast.error('Аудио слишком длинное для выбранной модели');
      } else {
        toast.error('Ошибка создания кавера', {
          description: errorMessage || 'Попробуйте позже',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const availableModels = getAvailableModels();

  const content = (
    <div className="space-y-4">
      {/* Audio Upload */}
      <div>
        <Label className="text-sm font-medium">Аудиофайл *</Label>
        {audioFile ? (
          <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{audioFile.name}</p>
                {audioDuration && (
                  <p className="text-xs text-muted-foreground">{formatDuration(audioDuration)}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={clearAudio}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {durationError && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-xs">{durationError}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full mt-2 h-20 border-dashed gap-2"
            onClick={() => document.getElementById('cover-audio-input')?.click()}
          >
            <Upload className="w-5 h-5" />
            <span>Загрузить аудио</span>
          </Button>
        )}
        <input
          id="cover-audio-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Model Selection */}
      <div>
        <Label className="text-sm font-medium">Модель</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                <span className="flex items-center gap-2">
                  {m.label}
                  <span className="text-xs text-muted-foreground">
                    (до {MODEL_LIMITS[m.key]?.label || '?'})
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Style */}
      <div>
        <Label className="text-sm font-medium">Стиль музыки *</Label>
        <Textarea
          placeholder="Опишите стиль: жанр, настроение, инструменты..."
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          rows={2}
          className="mt-1.5 resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground mt-1">{style.length}/500</p>
      </div>

      {/* Title */}
      <div>
        <Label className="text-sm font-medium">Название</Label>
        <Input
          placeholder="Название кавера"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5"
          maxLength={80}
        />
      </div>

      {/* Vocal Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <Label className="text-sm">С вокалом</Label>
        </div>
        <Switch
          checked={!instrumental}
          onCheckedChange={(checked) => setInstrumental(!checked)}
        />
      </div>

      {/* Lyrics (if vocal) */}
      {!instrumental && (
        <div>
          <Label className="text-sm font-medium">Текст песни *</Label>
          <Textarea
            placeholder="[Verse]&#10;Ваш текст..."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={4}
            className="mt-1.5 font-mono text-sm resize-none"
            maxLength={3000}
          />
          <p className="text-xs text-muted-foreground mt-1">{lyrics.length}/3000</p>
        </div>
      )}

      {/* Advanced Settings */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Дополнительно
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        
        {showAdvanced && (
          <div className="space-y-3 mt-2 p-3 rounded-lg bg-muted/20">
            <div>
              <Label className="text-xs">Исключить стили</Label>
              <Input
                placeholder="Rock, Metal..."
                value={negativeTags}
                onChange={(e) => setNegativeTags(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
            {!instrumental && (
              <div>
                <Label className="text-xs">Пол вокала</Label>
                <Select value={vocalGender || "auto"} onValueChange={(v) => setVocalGender(v === "auto" ? '' : v as 'm' | 'f')}>
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Авто</SelectItem>
                    <SelectItem value="m">Мужской</SelectItem>
                    <SelectItem value="f">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={loading || !audioFile || !style.trim() || !!durationError}
        className="w-full h-11"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Создание...
          </>
        ) : (
          <>
            <Disc className="w-4 h-4 mr-2" />
            Создать кавер
          </>
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-primary" />
              Создать кавер
            </DrawerTitle>
            <DrawerDescription>
              Новая версия песни в другом стиле
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-6 overflow-y-auto">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-primary" />
            Создать кавер
          </DialogTitle>
          <DialogDescription>
            Новая версия песни в другом стиле
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
