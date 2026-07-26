import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mic, Square, CheckCircle2, AlertCircle, RotateCcw, Copy, Sparkles, Trash2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useVoiceCloneWizard, STEP_INDEX, STEP_LABEL, STEP_TOTAL } from "@/hooks/voice/useVoiceCloneWizard";
import { useCustomVoices } from "@/hooks/voice/useCustomVoices";
import { useVoiceRecorder } from "@/hooks/voice/useVoiceRecorder";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import { usePreviewAudio } from "@/hooks/audio/usePreviewAudio";
import { AudioPriority } from "@/lib/audioElementPool";
import { VoiceWaveformEditor } from "./VoiceWaveformEditor";
import { trimAudioToMp3 } from "@/lib/audio/trimAudio";
import { GenerateModal } from "@/components/generate-form/primitives";
import { FormSettingCard } from "@/components/generate-form/primitives";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (voiceId: string) => void;
  /** Currently selected voice_id in the generation form (enables the "select existing" panel). */
  selectedVoiceId?: string | null;
  /** Called when the user picks an existing voice (or clears the selection). */
  onSelectVoice?: (voiceId: string | null) => void;
}

const MIN_SOURCE_SEC = 5;
const MAX_SEGMENT_SEC = 30;
const MIN_PHRASE_REC_SEC = 5;

export function VoiceCloneWizard({ open, onOpenChange, onComplete, selectedVoiceId, onSelectVoice }: Props) {
  const {
    step,
    voice,
    isWorking,
    lastError,
    canRetry,
    startValidation,
    submitRecording,
    regeneratePhrase,
    retryLast,
    reset,
  } = useVoiceCloneWizard();

  const phraseRecorder = useVoiceRecorder();
  const sourceRecorder = useVoiceRecorder();
  const [audioDuration, setAudioDuration] = useState(0);
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [vocalStart, setVocalStart] = useState(0);
  const [vocalEnd, setVocalEnd] = useState(10);
  const [language, setLanguage] = useState<string>(() => {
    if (typeof navigator === "undefined") return "ru";
    const l = navigator.language.split("-")[0]?.toLowerCase();
    return ["ru", "en", "es", "fr", "de", "it", "ja", "zh", "pt"].includes(l) ? l : "en";
  });

  // ---- "select existing voice" panel (same window as the recorder) ----
  const selectionEnabled = !!onSelectVoice;
  const { voices, isLoading: voicesLoading, deleteVoice } = useCustomVoices();
  const readyVoices = voices.filter((v) => v.voice_id && v.status === "ready" && v.is_available);
  const [pane, setPane] = useState<"select" | "create">("select");
  useEffect(() => {
    if (!open) return;
    setPane(selectionEnabled ? "select" : "create");
  }, [open, selectionEnabled]);
  const showSelectPane = selectionEnabled && pane === "select";

  // Microphone is the only accepted source for the voice sample (Suno requires sung audio).
  const sourceBlob: Blob | null = sourceRecorder.blob;

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

  // Pool-based duration probe (replaces inline `new Audio(sourceUrl)`).
  const { duration: probedDuration } = usePreviewAudio({
    id: sourceUrl ? `voice-clone-source-${sourceUrl}` : "voice-clone-source-none",
    src: sourceUrl ?? "",
    priority: AudioPriority.LOW,
  });

  // Compute duration whenever the source blob changes
  useEffect(() => {
    if (!sourceBlob || !sourceUrl) {
      setAudioDuration(0);
      return;
    }
    if (!probedDuration || !Number.isFinite(probedDuration)) return;
    setAudioDuration(probedDuration);
    setVocalStart(0);
    setVocalEnd(Math.min(10, Math.max(MIN_SOURCE_SEC, Math.floor(probedDuration))));
  }, [sourceBlob, sourceUrl, probedDuration]);

  // Toasts driven by wizard state transitions — so users always know what's happening.
  const lastStepRef = useRef(step);
  useEffect(() => {
    if (step === lastStepRef.current) return;
    lastStepRef.current = step;
    if (step === "validating") {
      notify.info("Голос анализируется", { description: "Готовим контрольную фразу…" });
    } else if (step === "phrase_ready") {
      notify.success("Фраза готова", { description: "Спойте её — это нужно для клонирования." });
    } else if (step === "generating") {
      notify.info("Клонируем голос", { description: "Это может занять 1–3 минуты." });
    } else if (step === "ready" && voice?.voice_id) {
      notify.success(`Голос «${voice.voice_name}» готов`, {
        description: "Подставлен в форму генерации.",
      });
      onComplete?.(voice.voice_id);
    } else if (step === "failed") {
      const description = lastError || voice?.error_message || "Попробуйте ещё раз.";
      notify.error("Клонирование не удалось", {
        description,
        duration: 10_000,
        action: canRetry
          ? {
              label: "Повторить",
              onClick: () => {
                void retryLast();
              },
            }
          : undefined,
      });
    }
  }, [step, voice?.voice_id, voice?.voice_name, voice?.error_message, lastError, canRetry, retryLast, onComplete]);

  function close() {
    onOpenChange(false);
    setTimeout(() => {
      reset();
      phraseRecorder.reset();
      sourceRecorder.reset();
      setVoiceName("");
      setDescription("");
    }, 300);
  }

  async function handleStart() {
    if (!sourceBlob) return;
    try {
      // Client-side trim to reduce upload size and let backend see clean 0..N range
      const trimmed = await trimAudioToMp3(sourceBlob, vocalStart, vocalEnd);
      startValidation({
        voiceName,
        sourceFile: trimmed,
        vocalStartS: 0,
        vocalEndS: vocalEnd - vocalStart,
        language,
        description: description || undefined,
      });
    } catch (e) {
      logger.error("trim failed, falling back to full clip", e as Error);
      startValidation({
        voiceName,
        sourceFile: sourceBlob,
        vocalStartS: vocalStart,
        vocalEndS: vocalEnd,
        language,
        description: description || undefined,
      });
    }
  }

  const stepIndex = STEP_INDEX[step] ?? 0;
  const showSteps = step !== "failed" && step !== "ready";
  const segmentTooShort = vocalEnd - vocalStart < MIN_SOURCE_SEC;

  const footer = (() => {
    if (step === "upload" && showSelectPane) {
      return (
        <Button className="w-full h-11" variant="outline" onClick={() => setPane("create")} data-testid="voice-new">
          <Mic className="mr-2 h-4 w-4" />
          Записать новый голос · 30 кредитов
        </Button>
      );
    }
    if (step === "upload") {
      return (
        <Button
          className="w-full h-11"
          disabled={!voiceName || !sourceBlob || isWorking || segmentTooShort}
          onClick={() => void handleStart()}
        >
          {isWorking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Далее · 30 кредитов
            </>
          )}
        </Button>
      );
    }
    if (step === "ready") {
      return (
        <Button className="w-full h-11" onClick={close}>
          Готово
        </Button>
      );
    }
    if (step === "failed") {
      return (
        <div className="flex gap-2">
          {canRetry && (
            <Button
              className="flex-1 h-11"
              disabled={isWorking}
              data-testid="voice-clone-retry"
              onClick={() => void retryLast()}
            >
              {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Повторить
            </Button>
          )}
          <Button variant="outline" className="flex-1 h-11" onClick={close}>
            Закрыть
          </Button>
        </div>
      );
    }
    return null;
  })();

  return (
    <GenerateModal
      open={open}
      onOpenChange={(v) => (v ? onOpenChange(v) : close())}
      title="Кастомный голос"
      description={
        showSelectPane ? "Выберите голос или запишите новый" : "30 кредитов · запись только с микрофона"
      }
      icon={Mic}
      size="lg"
      step={showSteps && !showSelectPane ? { current: stepIndex, total: STEP_TOTAL, label: STEP_LABEL[step] } : undefined}
      footer={footer}
      data-testid="voice-clone-wizard"
    >
      {step === "upload" && showSelectPane && (
        <div className="space-y-2" data-testid="voice-select-pane">
          <button
            type="button"
            onClick={() => {
              onSelectVoice?.(null);
              close();
            }}
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
              !selectedVoiceId ? "border-primary/60 bg-primary/5" : "border-border/60 hover:bg-muted/40",
            )}
          >
            <Mic className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Без кастомного голоса</span>
            {!selectedVoiceId && <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />}
          </button>

          {voicesLoading && <p className="text-xs text-muted-foreground px-1">Загрузка…</p>}

          {!voicesLoading && readyVoices.length === 0 && (
            <p className="text-xs text-muted-foreground px-1 py-2">
              Готовых голосов пока нет — запишите первый ниже.
            </p>
          )}

          {readyVoices.map((v) => {
            const active = v.voice_id === selectedVoiceId;
            return (
              <div
                key={v.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border p-3 transition-colors",
                  active ? "border-primary/60 bg-primary/5" : "border-border/60",
                )}
              >
                <button
                  type="button"
                  data-testid="voice-select-option"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => {
                    onSelectVoice?.(v.voice_id!);
                    close();
                  }}
                >
                  <p className="text-sm font-medium truncate">{v.voice_name}</p>
                  <p className="text-[0.6875rem] text-muted-foreground truncate">
                    {v.language ? `${v.language} · ` : ""}использован {v.usage_count ?? 0} раз
                  </p>
                </button>
                {active && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                <button
                  type="button"
                  aria-label={`Удалить голос ${v.voice_name}`}
                  className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Удалить голос «${v.voice_name}»?`)) {
                      if (v.voice_id === selectedVoiceId) onSelectVoice?.(null);
                      deleteVoice(v.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {step === "upload" && !showSelectPane && (
        <>
          {selectionEnabled && (
            <Button variant="ghost" size="sm" className="self-start -mb-1" onClick={() => setPane("select")}>
              <RotateCcw className="mr-2 h-3 w-3" />
              К списку голосов
            </Button>
          )}
          <div className="flex gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3">
            <Mic className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Сначала запишите <span className="font-medium text-foreground">образец пения</span>, затем Suno выдаст
              контрольную фразу — её тоже нужно будет пропеть в микрофон.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="voice-name" className="text-xs font-medium">
                Название
              </Label>
              <Input
                id="voice-name"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Мой голос"
                maxLength={50}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="voice-desc" className="text-xs font-medium">
                Описание <span className="text-muted-foreground font-normal">(опционально)</span>
              </Label>
              <Textarea
                id="voice-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={200}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <FormSettingCard label="Образец голоса" info="Спойте 10–30 секунд в чистой акустике, без музыки на фоне.">
            {sourceRecorder.state === "idle" && !sourceRecorder.blob && (
              <Button
                variant="outline"
                className="w-full h-11"
                data-testid="voice-source-record"
                onClick={sourceRecorder.start}
              >
                <Mic className="mr-2 h-4 w-4" />
                Начать запись
              </Button>
            )}
            {sourceRecorder.state === "recording" && (
              <div className="space-y-2.5">
                <VoiceWaveformEditor mode="live" stream={sourceRecorder.stream} height={72} />
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-xl font-mono tabular-nums">
                    {sourceRecorder.duration.toFixed(1)}
                    <span className="text-xs text-muted-foreground ml-1">с</span>
                  </div>
                  <Button variant="destructive" className="h-10 px-5" onClick={sourceRecorder.stop}>
                    <Square className="mr-2 h-3.5 w-3.5" />
                    Стоп
                  </Button>
                </div>
              </div>
            )}
            {sourceRecorder.state === "stopped" && sourceRecorder.blob && (
              <Button variant="outline" size="sm" className="w-full" onClick={sourceRecorder.reset}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                Перезаписать
              </Button>
            )}
            {sourceRecorder.state === "error" && <p className="text-xs text-destructive">{sourceRecorder.error}</p>}
          </FormSettingCard>

          {audioDuration > 0 && sourceBlob && (
            <FormSettingCard label="Чистый вокальный сегмент" info="Перетащите ручки, чтобы оставить только вокал.">
              <VoiceWaveformEditor
                mode="static"
                blob={sourceBlob}
                duration={audioDuration}
                trimStart={vocalStart}
                trimEnd={vocalEnd}
                minSegmentS={MIN_SOURCE_SEC}
                maxSegmentS={MAX_SEGMENT_SEC}
                onTrimChange={(s, e) => {
                  setVocalStart(s);
                  setVocalEnd(e);
                }}
              />
              {segmentTooShort && (
                <p className="text-xs text-destructive">Сегмент должен быть минимум {MIN_SOURCE_SEC} сек.</p>
              )}
            </FormSettingCard>
          )}

          <FormSettingCard label="Язык контрольной фразы">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="lang" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </FormSettingCard>
        </>
      )}

      {step === "validating" && (
        <div className="py-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm font-medium">Анализируем голос и готовим фразу</p>
          <p className="text-xs text-muted-foreground">Обычно занимает 30–90 секунд</p>
        </div>
      )}

      {step === "phrase_ready" && voice?.validate_phrase && (
        <>
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-[0.6875rem] uppercase tracking-wide text-primary">Спойте эту фразу</Label>
              <button
                type="button"
                aria-label="Скопировать фразу"
                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(voice.validate_phrase ?? "")
                    .then(() => notify.success("Фраза скопирована"));
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-lg font-semibold leading-snug text-balance" data-testid="voice-validate-phrase">
              «{voice.validate_phrase}»
            </p>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Именно пение, а не чтение — от этого зависит качество голоса. Минимум {MIN_PHRASE_REC_SEC} секунд, без
              фоновой музыки.
            </p>
          </div>

          {phraseRecorder.state === "idle" && (
            <div className="space-y-2">
              <Button className="w-full h-11" onClick={phraseRecorder.start}>
                <Mic className="mr-2 h-4 w-4" />
                Записать
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                disabled={isWorking}
                onClick={() => void regeneratePhrase()}
              >
                <RotateCcw className="mr-2 h-3 w-3" />
                Сложно спеть — другая фраза
              </Button>
            </div>
          )}

          {phraseRecorder.state === "recording" && (
            <div className="space-y-3">
              <VoiceWaveformEditor mode="live" stream={phraseRecorder.stream} height={72} />
              <div className="flex items-center gap-3">
                <div className="flex-1 text-xl font-mono tabular-nums">
                  {phraseRecorder.duration.toFixed(1)}
                  <span className="text-xs text-muted-foreground ml-1">с</span>
                </div>
                <Button variant="destructive" className="h-10 px-5" onClick={phraseRecorder.stop}>
                  <Square className="mr-2 h-3.5 w-3.5" />
                  Стоп
                </Button>
              </div>
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
                <Button variant="outline" className="flex-1 h-11" onClick={phraseRecorder.reset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Перезаписать
                </Button>
                <Button
                  className="flex-1 h-11"
                  disabled={isWorking || phraseRecorder.duration < MIN_PHRASE_REC_SEC}
                  onClick={() => phraseRecorder.blob && submitRecording(phraseRecorder.blob)}
                >
                  {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Отправить
                </Button>
              </div>
            </div>
          )}
          {phraseRecorder.state === "error" && <p className="text-xs text-destructive">{phraseRecorder.error}</p>}
        </>
      )}

      {step === "generating" && (
        <div className="py-10 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm font-medium">Создаём голос</p>
          <p className="text-xs text-muted-foreground">Обычно занимает 1–3 минуты</p>
        </div>
      )}

      {step === "ready" && voice && (
        <div className="py-6 flex flex-col items-center gap-2 text-center">
          <CheckCircle2 className="h-11 w-11 text-success" />
          <h3 className="text-base font-semibold">Голос «{voice.voice_name}» готов</h3>
          <p className="text-xs text-muted-foreground">Он подставлен в форму генерации</p>
        </div>
      )}

      {step === "failed" && (
        <div className="py-6 flex flex-col items-center gap-2 text-center" data-testid="voice-clone-failed">
          <AlertCircle className="h-11 w-11 text-destructive" />
          <h3 className="text-base font-semibold">Что-то пошло не так</h3>
          <p className="text-sm text-muted-foreground">{lastError || voice?.error_message || "Попробуйте позже"}</p>
        </div>
      )}
    </GenerateModal>
  );
}
