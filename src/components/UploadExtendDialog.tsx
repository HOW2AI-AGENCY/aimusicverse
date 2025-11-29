import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, Loader2, Music, Mic, FileAudio, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadExtendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadExtendDialog = ({ open, onOpenChange }: UploadExtendDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  
  // Settings
  const [defaultParamFlag, setDefaultParamFlag] = useState(false);
  const [instrumental, setInstrumental] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [title, setTitle] = useState('');
  const [continueAt, setContinueAt] = useState<number>(0);
  const [model, setModel] = useState('V4_5ALL');
  
  // Advanced
  const [negativeTags, setNegativeTags] = useState('');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | ''>('');
  const [styleWeight, setStyleWeight] = useState([0.65]);
  const [weirdnessConstraint, setWeirdnessConstraint] = useState([0.65]);
  const [audioWeight, setAudioWeight] = useState([0.65]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Пожалуйста, выберите аудиофайл');
      return;
    }

    setAudioFile(file);

    // Get audio duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
      setContinueAt(Math.floor(audio.duration * 0.8)); // Default to 80% of duration
      URL.revokeObjectURL(audio.src);
    };

    toast.success('Аудио загружено');
  };

  const handleExtend = async () => {
    if (!audioFile) {
      toast.error('Пожалуйста, загрузите аудиофайл');
      return;
    }

    if (defaultParamFlag && !style) {
      toast.error('Укажите стиль музыки');
      return;
    }

    if (model === 'V4_5ALL' && audioDuration && audioDuration > 60) {
      toast.error('Для модели V4_5ALL аудио не должно превышать 1 минуту');
      return;
    }

    if (audioDuration && audioDuration > 480) {
      toast.error('Аудио не должно превышать 8 минут');
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

      const { data, error } = await supabase.functions.invoke('suno-upload-extend', {
        body: {
          audioFile: {
            name: audioFile.name,
            type: audioFile.type,
            data: reader.result,
          },
          defaultParamFlag,
          instrumental,
          prompt: defaultParamFlag && !instrumental ? prompt : undefined,
          style: defaultParamFlag ? style : undefined,
          title: title || undefined,
          continueAt: defaultParamFlag ? continueAt : undefined,
          model,
          negativeTags: negativeTags || undefined,
          vocalGender: vocalGender || undefined,
          styleWeight: styleWeight[0],
          weirdnessConstraint: weirdnessConstraint[0],
          audioWeight: audioWeight[0],
        },
      });

      if (error) throw error;

      toast.success('Расширение началось! 🎵', {
        description: 'Расширенный трек появится в библиотеке через 1-3 минуты',
      });

      // Reset
      setAudioFile(null);
      setAudioDuration(null);
      setPrompt('');
      setStyle('');
      setTitle('');
      setContinueAt(0);
      setNegativeTags('');
      setVocalGender('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Extend error:', error);
      
      if (error.message?.includes('429') || error.message?.includes('кредитов')) {
        toast.error('Недостаточно кредитов', {
          description: 'Пополните баланс SunoAPI',
        });
      } else {
        toast.error('Ошибка расширения', {
          description: error.message || 'Попробуйте еще раз',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const modelInfo = {
    V5: { name: 'V5', max: 480, desc: 'До 8 минут' },
    V4_5PLUS: { name: 'V4.5+', max: 480, desc: 'До 8 минут' },
    V4_5ALL: { name: 'V4.5 All', max: 60, desc: 'До 1 минуты' },
    V4_5: { name: 'V4.5', max: 480, desc: 'До 8 минут' },
    V4: { name: 'V4', max: 240, desc: 'До 4 минут' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-primary" />
            Загрузить и Расширить Аудио
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label>Аудиофайл</Label>
            <div className="mt-2">
              {audioFile ? (
                <div className="p-4 rounded-lg glass border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{audioFile.name}</p>
                      {audioDuration && (
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(audioDuration / 60)}:{String(Math.floor(audioDuration % 60)).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAudioFile(null);
                      setAudioDuration(null);
                    }}
                  >
                    Удалить
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => document.getElementById('audio-upload-extend')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Загрузить аудио
                </Button>
              )}
              <input
                id="audio-upload-extend"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          </div>

          {/* Model */}
          <div>
            <Label>Модель</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modelInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.name} - {info.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {model === 'V4_5ALL' && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Для V4_5ALL аудио не должно превышать 1 минуту
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
            <div>
              <Label htmlFor="custom-mode">Продвинутый режим</Label>
              <p className="text-xs text-muted-foreground">
                Настройка стиля, лирики и параметров
              </p>
            </div>
            <Switch
              id="custom-mode"
              checked={defaultParamFlag}
              onCheckedChange={setDefaultParamFlag}
            />
          </div>

          {defaultParamFlag && (
            <>
              {/* Custom Mode Settings */}
              <div>
                <Label htmlFor="style">Стиль музыки *</Label>
                <Textarea
                  id="style"
                  placeholder="Опишите стиль: жанр, настроение, инструменты..."
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  rows={3}
                  className="mt-2"
                  maxLength={1000}
                />
              </div>

              <div>
                <Label htmlFor="title">Название (опционально)</Label>
                <Input
                  id="title"
                  placeholder="Extended Track"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                  maxLength={100}
                />
              </div>

              {/* Continue At */}
              {audioDuration && (
                <div>
                  <Label>Начать расширение с (секунд)</Label>
                  <div className="mt-2 space-y-2">
                    <Slider
                      value={[continueAt]}
                      onValueChange={(v) => setContinueAt(v[0])}
                      min={0}
                      max={Math.floor(audioDuration)}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      {continueAt}s из {Math.floor(audioDuration)}s
                    </p>
                  </div>
                </div>
              )}

              {/* Instrumental Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg glass border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Mic className="w-4 h-4 text-primary" />
                  </div>
                  <Label htmlFor="instrumental-toggle">С вокалом</Label>
                </div>
                <Switch
                  id="instrumental-toggle"
                  checked={!instrumental}
                  onCheckedChange={(checked) => setInstrumental(!checked)}
                />
              </div>

              {!instrumental && (
                <div>
                  <Label htmlFor="prompt">Лирика</Label>
                  <Textarea
                    id="prompt"
                    placeholder="[VERSE]&#10;Your lyrics here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    className="mt-2 font-mono text-sm"
                    maxLength={5000}
                  />
                </div>
              )}

              {/* Advanced Settings */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base">Расширенные настройки</Label>

                <div>
                  <Label>Исключить стили</Label>
                  <Input
                    placeholder="Rock, Metal..."
                    value={negativeTags}
                    onChange={(e) => setNegativeTags(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {!instrumental && (
                  <div>
                    <Label>Пол вокала</Label>
                    <Select value={vocalGender || "auto"} onValueChange={(v) => setVocalGender(v === "auto" ? '' : v as 'm' | 'f')}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Автоматически</SelectItem>
                        <SelectItem value="m">Мужской</SelectItem>
                        <SelectItem value="f">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Вес стиля</Label>
                    <span className="text-sm text-muted-foreground">{styleWeight[0].toFixed(2)}</span>
                  </div>
                  <Slider
                    value={styleWeight}
                    onValueChange={setStyleWeight}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Креативность</Label>
                    <span className="text-sm text-muted-foreground">{weirdnessConstraint[0].toFixed(2)}</span>
                  </div>
                  <Slider
                    value={weirdnessConstraint}
                    onValueChange={setWeirdnessConstraint}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Вес входного аудио</Label>
                    <span className="text-sm text-muted-foreground">{audioWeight[0].toFixed(2)}</span>
                  </div>
                  <Slider
                    value={audioWeight}
                    onValueChange={setAudioWeight}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <Button
            onClick={handleExtend}
            disabled={loading || !audioFile}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Расширение...
              </>
            ) : (
              <>
                <FileAudio className="w-4 h-4" />
                Расширить аудио
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
