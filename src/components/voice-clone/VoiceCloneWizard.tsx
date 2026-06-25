import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Square, Upload, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { useVoiceCloneWizard } from '@/hooks/voice/useVoiceCloneWizard';
import { useVoiceRecorder } from '@/hooks/voice/useVoiceRecorder';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (voiceId: string) => void;
}

export function VoiceCloneWizard({ open, onOpenChange, onComplete }: Props) {
  const { step, voice, isWorking, startValidation, submitRecording, reRecord, reset } = useVoiceCloneWizard();
  const recorder = useVoiceRecorder();
  const [file, setFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [voiceName, setVoiceName] = useState('');
  const [description, setDescription] = useState('');
  const [vocalStart, setVocalStart] = useState(0);
  const [vocalEnd, setVocalEnd] = useState(10);
  const [language, setLanguage] = useState('ru');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!file) { setAudioDuration(0); return; }
    const url = URL.createObjectURL(file);
    const a = new Audio(url);
    a.onloadedmetadata = () => {
      const dur = isFinite(a.duration) ? a.duration : 0;
      setAudioDuration(dur);
      setVocalStart(0);
      setVocalEnd(Math.min(10, Math.max(5, Math.floor(dur))));
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (step === 'ready' && voice?.voice_id && onComplete) {
      onComplete(voice.voice_id);
    }
  }, [step, voice?.voice_id, onComplete]);

  function close() {
    onOpenChange(false);
    setTimeout(() => {
      reset();
      recorder.reset();
      setFile(null);
      setVoiceName('');
      setDescription('');
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? onOpenChange(v) : close()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать кастомный голос</DialogTitle>
          <DialogDescription>30 кредитов · 6 шагов</DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice-name">Название</Label>
              <Input id="voice-name" value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="Мой голос" maxLength={50} />
            </div>
            <div>
              <Label htmlFor="voice-desc">Описание (опционально)</Label>
              <Textarea id="voice-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="voice-file">Исходное аудио (≤25 MB)</Label>
              <Input id="voice-file" type="file" accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            {audioDuration > 0 && (
              <div className="space-y-2">
                <Label>Чистый вокальный сегмент: {vocalStart}с — {vocalEnd}с ({vocalEnd - vocalStart}с)</Label>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-8">Старт</span>
                  <input type="range" min={0} max={Math.max(0, Math.floor(audioDuration) - 5)} value={vocalStart}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setVocalStart(v);
                      if (vocalEnd - v < 5) setVocalEnd(v + 5);
                      if (vocalEnd - v > 30) setVocalEnd(v + 30);
                    }} className="flex-1" />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-8">Конец</span>
                  <input type="range" min={vocalStart + 5} max={Math.min(Math.floor(audioDuration), vocalStart + 30)}
                    value={vocalEnd} onChange={(e) => setVocalEnd(parseInt(e.target.value))} className="flex-1" />
                </div>
                <audio ref={audioRef} src={file ? URL.createObjectURL(file) : undefined} controls className="w-full" />
              </div>
            )}
            <div>
              <Label htmlFor="lang">Язык фразы</Label>
              <select id="lang" value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <Button className="w-full" disabled={!voiceName || !file || isWorking || vocalEnd - vocalStart < 5}
              onClick={() => {
                if (!file) return;
                startValidation({
                  voiceName, sourceFile: file, vocalStartS: vocalStart, vocalEndS: vocalEnd,
                  language, description: description || undefined,
                });
              }}>
              {isWorking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка…</> : <><Upload className="mr-2 h-4 w-4" />Начать (30 кредитов)</>}
            </Button>
          </div>
        )}

        {step === 'validating' && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Анализируем ваш голос и готовим фразу…</p>
            <p className="text-xs text-muted-foreground">Это занимает 30–90 секунд</p>
          </div>
        )}

        {step === 'phrase_ready' && voice?.validate_phrase && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <Label className="text-xs uppercase text-muted-foreground">Запишите эту фразу (петь, не читать)</Label>
              <p className="mt-2 text-lg font-medium leading-snug">{voice.validate_phrase}</p>
            </div>

            {recorder.state === 'idle' && (
              <Button className="w-full" onClick={recorder.start}>
                <Mic className="mr-2 h-4 w-4" />Записать
              </Button>
            )}
            {recorder.state === 'recording' && (
              <div className="space-y-2">
                <div className="text-center text-2xl font-mono">{recorder.duration.toFixed(1)}s</div>
                <Button variant="destructive" className="w-full" onClick={recorder.stop}>
                  <Square className="mr-2 h-4 w-4" />Стоп
                </Button>
              </div>
            )}
            {recorder.state === 'stopped' && recorder.blob && (
              <div className="space-y-2">
                <audio src={URL.createObjectURL(recorder.blob)} controls className="w-full" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={recorder.reset}>
                    <RotateCcw className="mr-2 h-4 w-4" />Перезаписать
                  </Button>
                  <Button className="flex-1" disabled={isWorking}
                    onClick={() => recorder.blob && submitRecording(recorder.blob)}>
                    {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Отправить
                  </Button>
                </div>
              </div>
            )}
            {recorder.state === 'error' && (
              <p className="text-sm text-destructive">{recorder.error}</p>
            )}
          </div>
        )}

        {step === 'generating' && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Создаём голос…</p>
            <p className="text-xs text-muted-foreground">Это занимает 1–3 минуты</p>
          </div>
        )}

        {step === 'ready' && voice && (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Голос «{voice.voice_name}» готов!</h3>
            <p className="text-xs text-muted-foreground">Voice ID: {voice.voice_id}</p>
            <Button className="w-full" onClick={close}>Готово</Button>
          </div>
        )}

        {step === 'failed' && (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-semibold">Что-то пошло не так</h3>
            <p className="text-sm text-muted-foreground">{voice?.error_message || 'Попробуйте позже'}</p>
            <div className="flex gap-2 w-full">
              {voice?.validate_phrase && recorder.blob ? (
                <Button className="flex-1" onClick={() => recorder.blob && reRecord(recorder.blob)}>
                  Повторить
                </Button>
              ) : null}
              <Button variant="outline" className="flex-1" onClick={close}>Закрыть</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
