import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, Mic, Square, Upload, CheckCircle2, AlertCircle, RotateCcw, FileAudio, Library } from "@/lib/icons";
import { useVoiceCloneWizard, STEP_INDEX } from "@/hooks/voice/useVoiceCloneWizard";
import { useVoiceRecorder } from "@/hooks/voice/useVoiceRecorder";
import { useUserVocalStems, type UserVocalStem } from "@/hooks/voice/useUserVocalStems";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (voiceId: string) => void;
}

const MIN_SOURCE_SEC = 5;
const MAX_SEGMENT_SEC = 30;
const MIN_PHRASE_REC_SEC = 5;

export function VoiceCloneWizard({ open, onOpenChange, onComplete }: Props) {
  const { step, voice, isWorking, startValidation, submitRecording, reRecord, reset } = useVoiceCloneWizard();
  const phraseRecorder = useVoiceRecorder();
  const sourceRecorder = useVoiceRecorder();
  const [sourceTab, setSourceTab] = useState<"upload" | "record" | "library">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [stemBlob, setStemBlob] = useState<Blob | null>(null);
  const [selectedStem, setSelectedStem] = useState<UserVocalStem | null>(null);
  const [stemLoading, setStemLoading] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [vocalStart, setVocalStart] = useState(0);
  const [vocalEnd, setVocalEnd] = useState(10);
  const [language, setLanguage] = useState("ru");

  const stemsQuery = useUserVocalStems(open && sourceTab === "library");

  // Final blob used for validation (either uploaded file, mic recording, or chosen library stem)
  const sourceBlob: Blob | null =
    sourceTab === "upload" ? file : sourceTab === "record" ? sourceRecorder.blob : stemBlob;

  // Memoized object URL so we don't leak on every render
  const sourceUrl = useMemo(() => {
    if (!sourceBlob) return null;
    return URL.createObjectURL(sourceBlob);
  }, [sourceBlob]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const phraseUrl = useMemo(() => {
    if (!phraseRecorder.blob) return null;
    return URL.createObjectURL(phraseRecorder.blob);
  }, [phraseRecorder.blob]);

  useEffect(() => {
    return () => {
      if (phraseUrl) URL.revokeObjectURL(phraseUrl);
    };
  }, [phraseUrl]);

  // Compute duration whenever the source blob changes
  useEffect(() => {
    if (!sourceBlob || !sourceUrl) {
      setAudioDuration(0);
      return;
    }
    const a = new Audio(sourceUrl);
    a.onloadedmetadata = () => {
      const dur = isFinite(a.duration) ? a.duration : 0;
      setAudioDuration(dur);
      setVocalStart(0);
      setVocalEnd(Math.min(10, Math.max(MIN_SOURCE_SEC, Math.floor(dur))));
    };
  }, [sourceBlob, sourceUrl]);

  useEffect(() => {
    if (step === "ready" && voice?.voice_id && onComplete) {
      onComplete(voice.voice_id);
    }
  }, [step, voice?.voice_id, onComplete]);

  function close() {
    onOpenChange(false);
    setTimeout(() => {
      reset();
      phraseRecorder.reset();
      sourceRecorder.reset();
      setFile(null);
      setVoiceName("");
      setDescription("");
    }, 300);
  }

  const stepIndex = STEP_INDEX[step] ?? 0;
  const progressPct = (stepIndex / 6) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать кастомный голос</DialogTitle>
          <DialogDescription>30 кредитов · 6 шагов</DialogDescription>
        </DialogHeader>

        {step !== "failed" && step !== "ready" && (
          <div className="space-y-1">
            <Progress value={progressPct} className="h-1.5" />
            <p className="text-xs text-muted-foreground text-right">Шаг {stepIndex} из 6</p>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice-name">Название</Label>
              <Input
                id="voice-name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Мой голос"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="voice-desc">Описание (опционально)</Label>
              <Textarea
                id="voice-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={200}
              />
            </div>

            <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as "upload" | "record")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="upload">
                  <FileAudio className="mr-2 h-4 w-4" />
                  Загрузить
                </TabsTrigger>
                <TabsTrigger value="record">
                  <Mic className="mr-2 h-4 w-4" />
                  Записать
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-2 pt-3">
                <Label htmlFor="voice-file">Исходное аудио (≤25 MB)</Label>
                <Input
                  id="voice-file"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </TabsContent>

              <TabsContent value="record" className="space-y-2 pt-3">
                <p className="text-xs text-muted-foreground">
                  Спойте 10–30 секунд в чистой акустике. Без музыки на фоне.
                </p>
                {sourceRecorder.state === "idle" && !sourceRecorder.blob && (
                  <Button variant="outline" className="w-full" onClick={sourceRecorder.start}>
                    <Mic className="mr-2 h-4 w-4" />
                    Начать запись
                  </Button>
                )}
                {sourceRecorder.state === "recording" && (
                  <div className="space-y-2">
                    <div className="text-center text-2xl font-mono">{sourceRecorder.duration.toFixed(1)}s</div>
                    <Button variant="destructive" className="w-full" onClick={sourceRecorder.stop}>
                      <Square className="mr-2 h-4 w-4" />
                      Стоп
                    </Button>
                  </div>
                )}
                {sourceRecorder.state === "stopped" && sourceRecorder.blob && (
                  <Button variant="outline" size="sm" onClick={sourceRecorder.reset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Перезаписать
                  </Button>
                )}
                {sourceRecorder.state === "error" && <p className="text-sm text-destructive">{sourceRecorder.error}</p>}
              </TabsContent>
            </Tabs>

            {audioDuration > 0 && sourceUrl && (
              <div className="space-y-2">
                <Label>
                  Чистый вокальный сегмент: {vocalStart}с — {vocalEnd}с ({vocalEnd - vocalStart}с)
                </Label>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-12">Старт</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, Math.floor(audioDuration) - MIN_SOURCE_SEC)}
                    value={vocalStart}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      setVocalStart(v);
                      if (vocalEnd - v < MIN_SOURCE_SEC) setVocalEnd(v + MIN_SOURCE_SEC);
                      if (vocalEnd - v > MAX_SEGMENT_SEC) setVocalEnd(v + MAX_SEGMENT_SEC);
                    }}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-12">Конец</span>
                  <input
                    type="range"
                    min={vocalStart + MIN_SOURCE_SEC}
                    max={Math.min(Math.floor(audioDuration), vocalStart + MAX_SEGMENT_SEC)}
                    value={vocalEnd}
                    onChange={(e) => setVocalEnd(parseInt(e.target.value))}
                    className="flex-1"
                  />
                </div>
                <audio src={sourceUrl} controls className="w-full" />
                {vocalEnd - vocalStart < MIN_SOURCE_SEC && (
                  <p className="text-xs text-destructive">Сегмент должен быть минимум {MIN_SOURCE_SEC} сек.</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="lang">Язык фразы</Label>
              <select
                id="lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <Button
              className="w-full"
              disabled={!voiceName || !sourceBlob || isWorking || vocalEnd - vocalStart < MIN_SOURCE_SEC}
              onClick={() => {
                if (!sourceBlob) return;
                startValidation({
                  voiceName,
                  sourceFile: sourceBlob,
                  vocalStartS: vocalStart,
                  vocalEndS: vocalEnd,
                  language,
                  description: description || undefined,
                });
              }}
            >
              {isWorking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Начать (30 кредитов)
                </>
              )}
            </Button>
          </div>
        )}

        {step === "validating" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Анализируем ваш голос и готовим фразу…</p>
            <p className="text-xs text-muted-foreground">Это занимает 30–90 секунд</p>
          </div>
        )}

        {step === "phrase_ready" && voice?.validate_phrase && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <Label className="text-xs uppercase text-muted-foreground">Запишите эту фразу (петь, не читать)</Label>
              <p className="mt-2 text-lg font-medium leading-snug">{voice.validate_phrase}</p>
            </div>

            {phraseRecorder.state === "idle" && (
              <Button className="w-full" onClick={phraseRecorder.start}>
                <Mic className="mr-2 h-4 w-4" />
                Записать
              </Button>
            )}
            {phraseRecorder.state === "recording" && (
              <div className="space-y-2">
                <div className="text-center text-2xl font-mono">{phraseRecorder.duration.toFixed(1)}s</div>
                <Button variant="destructive" className="w-full" onClick={phraseRecorder.stop}>
                  <Square className="mr-2 h-4 w-4" />
                  Стоп
                </Button>
              </div>
            )}
            {phraseRecorder.state === "stopped" && phraseRecorder.blob && phraseUrl && (
              <div className="space-y-2">
                <audio src={phraseUrl} controls className="w-full" />
                {phraseRecorder.duration < MIN_PHRASE_REC_SEC && (
                  <p className="text-xs text-destructive">
                    Запись слишком короткая ({phraseRecorder.duration.toFixed(1)}с). Минимум {MIN_PHRASE_REC_SEC}с.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={phraseRecorder.reset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Перезаписать
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isWorking || phraseRecorder.duration < MIN_PHRASE_REC_SEC}
                    onClick={() => phraseRecorder.blob && submitRecording(phraseRecorder.blob)}
                  >
                    {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Отправить
                  </Button>
                </div>
              </div>
            )}
            {phraseRecorder.state === "error" && <p className="text-sm text-destructive">{phraseRecorder.error}</p>}
          </div>
        )}

        {step === "generating" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Создаём голос…</p>
            <p className="text-xs text-muted-foreground">Это занимает 1–3 минуты</p>
          </div>
        )}

        {step === "ready" && voice && (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Голос «{voice.voice_name}» готов!</h3>
            <p className="text-xs text-muted-foreground">Voice ID: {voice.voice_id}</p>
            <Button className="w-full" onClick={close}>
              Готово
            </Button>
          </div>
        )}

        {step === "failed" && (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3 className="text-lg font-semibold">Что-то пошло не так</h3>
            <p className="text-sm text-muted-foreground">{voice?.error_message || "Попробуйте позже"}</p>
            <div className="flex gap-2 w-full">
              {voice?.validate_phrase && phraseRecorder.blob ? (
                <Button className="flex-1" onClick={() => phraseRecorder.blob && reRecord(phraseRecorder.blob)}>
                  Повторить
                </Button>
              ) : null}
              <Button variant="outline" className="flex-1" onClick={close}>
                Закрыть
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
