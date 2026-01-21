import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, Loader2, Mic, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SUNO_MODELS, getAvailableModels } from '@/constants/sunoModels';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/lib/logger';
import { validatePromptForGeneration, showGenerationError } from '@/lib/errorHandling';
import { formatDuration } from '@/lib/player-utils';
import { PromptValidationAlert } from '@/components/generate-form/PromptValidationAlert';
import { AudioReferencePreview } from '@/components/audio/AudioReferencePreview';

interface AudioExtendDialogProps {
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

// Model duration limits
const MODEL_LIMITS: Record<string, { duration: number; label: string }> = {
  'V5': { duration: 240, label: '4 мин' },
  'V4_5PLUS': { duration: 480, label: '8 мин' },
  'V4_5ALL': { duration: 60, label: '1 мин' },
  'V4': { duration: 240, label: '4 мин' },
  'V3_5': { duration: 180, label: '3 мин' },
};

export const AudioExtendDialog = ({
  open,
  onOpenChange,
  projectId,
  initialAudioFile,
  prefillData
}: AudioExtendDialogProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  
  // Core settings
  const [style, setStyle] = useState(prefillData?.style || '');
  const [title, setTitle] = useState(prefillData?.title ? `${prefillData.title} (extended)` : '');
  const [lyrics, setLyrics] = useState(prefillData?.lyrics || '');
  const [instrumental, setInstrumental] = useState(prefillData?.isInstrumental ?? false);
  const [model, setModel] = useState('V4_5ALL');
  const [continueAt, setContinueAt] = useState(0);
  
  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativeTags, setNegativeTags] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | 'auto'>('auto');
  
  // Validation
  const [durationError, setDurationError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open && prefillData) {
      setStyle(prefillData.style || '');
      setTitle(prefillData.title ? `${prefillData.title} (extended)` : '');
      setLyrics(prefillData.lyrics || '');
      setInstrumental(prefillData.isInstrumental ?? false);
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

  // Validate duration
  useEffect(() => {
    if (audioDuration) {
      const limit = MODEL_LIMITS[model]?.duration || 60;
      if (audioDuration > limit) {
        setDurationError(`Аудио (${formatDuration(audioDuration)}) превышает лимит модели (${formatDuration(limit)})`);
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
      setTitle(file.name.replace(/\.[^/.]+$/, '') + ' (extended)');
    }

    const previewUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(previewUrl);

    const audio = new Audio();
    audio.src = previewUrl;
    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      setAudioDuration(duration);
      // Set continue point to 80% by default
      setContinueAt(Math.floor(duration * 0.8));
      
      // Auto-select model
      if (duration > 60 && model === 'V4_5ALL') {
        if (duration <= 180) setModel('V3_5');
        else if (duration <= 240) setModel('V5');
        else setModel('V4_5PLUS');
        toast.info('Модель автоматически выбрана');
      }
    };
  };

  const clearAudio = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioFile(null);
    setAudioDuration(null);
    setAudioPreviewUrl(null);
    setDurationError(null);
    setContinueAt(0);
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      toast.error('Загрузите аудиофайл');
      return;
    }

    if (!style.trim()) {
      toast.error('Укажите стиль');
      return;
    }

    if (durationError) {
      toast.error(durationError);
      return;
    }

    // Pre-validate for blocked artist names
    const validation = validatePromptForGeneration(lyrics, style);
    if (!validation.valid) {
      toast.error(validation.error, {
        description: validation.suggestion,
      });
      return;
    }

    // Validate lyrics for extend mode (non-instrumental)
    if (!instrumental && !lyrics.trim()) {
      toast.error('Добавьте текст для продолжения', {
        description: 'Укажите текст или выберите инструментальный режим',
      });
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });

      const { data, error } = await supabase.functions.invoke('suno-upload-extend', {
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
          title: title || 'Extended Track',
          prompt: instrumental ? undefined : lyrics,
          continueAt,
          negativeTags: negativeTags || undefined,
          vocalGender: vocalGender === 'auto' ? undefined : vocalGender,
          projectId,
        }
      });

      if (error) throw error;

      toast.success('Расширение трека началось! 🎵', {
        description: 'Результат появится в библиотеке через 1-3 минуты',
      });

      clearAudio();
      setStyle('');
      setTitle('');
      setLyrics('');
      setNegativeTags('');
      setVocalGender('auto');
      onOpenChange(false);
    } catch (error) {
      logger.error('Extend submit error', { error });
      showGenerationError(error);
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
          <AudioReferencePreview
            file={audioFile}
            audioUrl={audioPreviewUrl}
            duration={audioDuration}
            onRemove={clearAudio}
            error={durationError}
            modelLimit={MODEL_LIMITS[model]}
            className="mt-2"
          />
        ) : (
          <Button
            variant="outline"
            className="w-full mt-2 h-20 border-dashed gap-2"
            onClick={() => document.getElementById('extend-audio-input')?.click()}
          >
            <Upload className="w-5 h-5" />
            <span>Загрузить аудио</span>
          </Button>
        )}
        <input
          id="extend-audio-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Continue Point */}
      {audioDuration && audioDuration > 0 && (
        <div>
          <Label className="text-sm font-medium">Продолжить с</Label>
          <div className="mt-2">
            <Slider
              value={[continueAt]}
              onValueChange={(v) => setContinueAt(v[0])}
              min={0}
              max={Math.floor(audioDuration)}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0:00</span>
              <span className="font-medium text-foreground">{formatDuration(continueAt)}</span>
              <span>{formatDuration(audioDuration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Model */}
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
                  <span className="text-xs text-muted-foreground">(до {MODEL_LIMITS[m.key]?.label})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Style */}
      <div>
        <Label className="text-sm font-medium">Стиль *</Label>
        <Textarea
          placeholder="Стиль для продолжения..."
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          rows={2}
          className="mt-1.5 resize-none"
          maxLength={500}
        />
        <PromptValidationAlert 
          text={style} 
          onApplyReplacement={(newText) => setStyle(newText)}
          className="mt-1"
        />
      </div>

      {/* Title */}
      <div>
        <Label className="text-sm font-medium">Название</Label>
        <Input
          placeholder="Название"
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

      {/* Lyrics */}
      {!instrumental && (
        <div>
          <Label className="text-sm font-medium">Текст для продолжения</Label>
          <Textarea
            placeholder="[Verse]&#10;Текст..."
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={3}
            className="mt-1.5 font-mono text-sm resize-none"
            maxLength={3000}
          />
          <PromptValidationAlert 
            text={lyrics} 
            onApplyReplacement={(newText) => setLyrics(newText)}
            className="mt-1"
          />
        </div>
      )}

      {/* Advanced */}
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
                <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as 'm' | 'f' | 'auto')}>
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
            Расширение...
          </>
        ) : (
          <>
            <ArrowRight className="w-4 h-4 mr-2" />
            Расширить трек
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
              <ArrowRight className="w-5 h-5 text-primary" />
              Расширить трек
            </DrawerTitle>
            <DrawerDescription>
              Добавьте продолжение к треку
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
            <ArrowRight className="w-5 h-5 text-primary" />
            Расширить трек
          </DialogTitle>
          <DialogDescription>
            Добавьте продолжение к треку
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
