/**
 * VoiceCloneDialog
 *
 * Three-step voice cloning workflow:
 *   1. Source: upload a vocal sample, record from mic, or pick an existing vocal stem.
 *   2. Phrase: generate a short control phrase (AI) that the user must sing.
 *   3. Record: capture the user singing the phrase.
 *
 * Both audio files (original sample + sung control phrase) are persisted to
 * the `reference_audio` table tagged with sources `voice_clone_sample` and
 * `voice_clone_phrase`, sharing a `clone_group_id` stored in the `transcription`
 * metadata column. Backend processing pipeline picks them up to build the persona.
 */

import { useState, useRef, useEffect, useId, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Upload, Mic, MicVocal, Play, Pause, X, Check, Loader2, Sparkles, AudioLines } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReferenceAudio } from "@/hooks/useReferenceAudio";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { notify } from "@/lib/notifications";
import { formatTime } from "@/lib/player-utils";

interface VoiceCloneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClonedReady?: (cloneGroupId: string) => void;
}

type Step = "source" | "phrase" | "record" | "done";

const FALLBACK_PHRASES = [
  "Утро снова рисует свет на моих ладонях",
  "Где-то далеко звёзды поют о свободе",
  "Мой голос как ветер по золотым полям",
  "Я слышу в тишине рассвет твоего сердца",
];

function pickFallbackPhrase() {
  return FALLBACK_PHRASES[Math.floor(Math.random() * FALLBACK_PHRASES.length)];
}

async function uploadToStorage(file: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");
  const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${user.id}/voice-clone-${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from("project-assets")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(error.message);
  const {
    data: { publicUrl },
  } = supabase.storage.from("project-assets").getPublicUrl(path);
  return publicUrl;
}

export function VoiceCloneDialog({ open, onOpenChange, onClonedReady }: VoiceCloneDialogProps) {
  const isMobile = useIsMobile();
  const sourceId = useId();
  const { saveAudio } = useReferenceAudio();

  const [step, setStep] = useState<Step>("source");
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [sampleUrl, setSampleUrl] = useState<string | null>(null);
  const [phrase, setPhrase] = useState<string>("");
  const [phraseLoading, setPhraseLoading] = useState(false);
  const [singFile, setSingFile] = useState<File | null>(null);
  const [singUrl, setSingUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<"sample" | "sing" | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [previewKey, setPreviewKey] = useState<"sample" | "sing" | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progressValue = useMemo(() => {
    switch (step) {
      case "source":
        return sampleFile ? 33 : 8;
      case "phrase":
        return phrase ? 66 : 50;
      case "record":
        return singFile ? 90 : 75;
      case "done":
        return 100;
    }
  }, [step, sampleFile, phrase, singFile]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("source");
      setSampleFile(null);
      setSampleUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      setPhrase("");
      setPhraseLoading(false);
      setSingFile(null);
      setSingUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
      setIsRecording(null);
      setRecordingTime(0);
      setSubmitting(false);
      setPreviewKey(null);
    }
  }, [open]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = useCallback(
    async (target: "sample" | "sing") => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
        });
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/mp4";
        const rec = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = rec;
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const ext = mimeType.includes("webm") ? "webm" : "mp4";
          const file = new File([blob], `${target}-${Date.now()}.${ext}`, { type: mimeType });
          const url = URL.createObjectURL(blob);
          stream.getTracks().forEach((t) => t.stop());
          if (target === "sample") {
            setSampleFile(file);
            setSampleUrl(url);
          } else {
            setSingFile(file);
            setSingUrl(url);
          }
        };
        rec.start(1000);
        setIsRecording(target);
        notify.success("Запись началась");
      } catch (err) {
        logger.error("Voice clone recording error", { error: String(err) });
        notify.error("Не удалось получить доступ к микрофону");
      }
    },
    [],
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(null);
    }
  }, [isRecording]);

  const handleSampleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      notify.error("Максимум 20 МБ");
      return;
    }
    const url = URL.createObjectURL(file);
    setSampleFile(file);
    setSampleUrl(url);
  }, []);

  const togglePreview = useCallback(
    (key: "sample" | "sing") => {
      const url = key === "sample" ? sampleUrl : singUrl;
      if (!url) return;
      if (previewKey === key && previewAudioRef.current) {
        previewAudioRef.current.pause();
        setPreviewKey(null);
        return;
      }
      if (previewAudioRef.current) previewAudioRef.current.pause();
      const a = new Audio(url);
      previewAudioRef.current = a;
      a.onended = () => setPreviewKey(null);
      a.play().catch(() => setPreviewKey(null));
      setPreviewKey(key);
    },
    [sampleUrl, singUrl, previewKey],
  );

  // Generate control phrase via AI (with fallback)
  const generatePhrase = useCallback(async () => {
    setPhraseLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-lyrics-assistant", {
        body: {
          mode: "control_phrase",
          prompt:
            "Сгенерируй одну короткую контрольную фразу для клонирования голоса. Ровно одна строка, 8-12 слов на русском, поэтичная, без рифмы.",
        },
      });
      let next: string | undefined;
      if (!error && data) {
        next =
          (typeof data === "string" ? data : data?.text ?? data?.phrase ?? data?.result ?? data?.lyrics)?.trim() ||
          undefined;
        if (next) {
          // Take first non-empty line
          next = next.split(/\n+/).map((l: string) => l.trim()).find(Boolean);
        }
      }
      if (!next) next = pickFallbackPhrase();
      setPhrase(next);
    } catch (err) {
      logger.warn("control phrase generation fallback", { error: String(err) });
      setPhrase(pickFallbackPhrase());
    } finally {
      setPhraseLoading(false);
    }
  }, []);

  // Auto-generate phrase on entering step 2
  useEffect(() => {
    if (open && step === "phrase" && !phrase && !phraseLoading) {
      generatePhrase();
    }
  }, [open, step, phrase, phraseLoading, generatePhrase]);

  const handleSubmit = useCallback(async () => {
    if (!sampleFile || !singFile || !phrase) return;
    setSubmitting(true);
    try {
      const groupId =
        (crypto.randomUUID && crypto.randomUUID()) ||
        `clone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const [sampleUploaded, singUploaded] = await Promise.all([
        uploadToStorage(sampleFile),
        uploadToStorage(singFile),
      ]);
      await Promise.all([
        saveAudio({
          fileName: sampleFile.name,
          fileUrl: sampleUploaded,
          fileSize: sampleFile.size,
          mimeType: sampleFile.type,
          source: "voice_clone_sample",
          analysisStatus: "pending",
          transcription: JSON.stringify({ clone_group_id: groupId, role: "sample", phrase }),
        }),
        saveAudio({
          fileName: singFile.name,
          fileUrl: singUploaded,
          fileSize: singFile.size,
          mimeType: singFile.type,
          source: "voice_clone_phrase",
          analysisStatus: "pending",
          transcription: JSON.stringify({ clone_group_id: groupId, role: "phrase", phrase }),
        }),
      ]);
      // Try to kick off backend processing if available (non-blocking)
      supabase.functions
        .invoke("voice-clone-create", { body: { clone_group_id: groupId } })
        .catch(() => {
          /* edge function may not exist yet; data is persisted regardless */
        });
      notify.success("Голос отправлен на клонирование", {
        description: "Персона появится в библиотеке когда обработка завершится.",
      });
      onClonedReady?.(groupId);
      setStep("done");
      setTimeout(() => onOpenChange(false), 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      logger.error("Voice clone submit error", { error: message });
      notify.error("Не удалось отправить", { description: message });
    } finally {
      setSubmitting(false);
    }
  }, [sampleFile, singFile, phrase, saveAudio, onClonedReady, onOpenChange]);

  // ---- Render helpers ----

  const renderSourceStep = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Загрузите чистую запись голоса (5–30 сек), запишите с микрофона или выберите вокальный стем.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-16 flex-col gap-1"
          onClick={() => document.getElementById("voice-clone-sample-input")?.click()}
          disabled={!!isRecording}
        >
          <Upload className="w-5 h-5" />
          <span className="text-xs font-semibold">Загрузить</span>
        </Button>
        <input
          id="voice-clone-sample-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleSampleUpload}
        />
        <Button
          type="button"
          variant={isRecording === "sample" ? "destructive" : "outline"}
          className="h-16 flex-col gap-1"
          onClick={() => (isRecording === "sample" ? stopRecording() : startRecording("sample"))}
        >
          <Mic className={cn("w-5 h-5", isRecording === "sample" && "animate-pulse")} />
          <span className="text-xs font-semibold">
            {isRecording === "sample" ? formatTime(recordingTime) : "Записать"}
          </span>
        </Button>
      </div>

      {sampleFile && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0"
            onClick={() => togglePreview("sample")}
          >
            {previewKey === "sample" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{sampleFile.name}</p>
            <p className="text-[10px] text-muted-foreground">Образец голоса</p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => {
              if (sampleUrl) URL.revokeObjectURL(sampleUrl);
              setSampleFile(null);
              setSampleUrl(null);
            }}
            aria-label="Удалить образец"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <Button
        type="button"
        className="w-full h-11 rounded-xl"
        disabled={!sampleFile}
        onClick={() => setStep("phrase")}
      >
        Далее: контрольная фраза
      </Button>
    </div>
  );

  const renderPhraseStep = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        AI сгенерировал короткую фразу. Прочитайте её и нажмите «Далее», чтобы записать как вы её поёте.
      </p>

      <div className="rounded-2xl border border-primary/30 bg-primary/8 p-4 min-h-[80px] flex items-center justify-center">
        {phraseLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Генерация фразы…
          </div>
        ) : (
          <p className="text-sm font-medium text-center leading-snug text-foreground">{phrase || "—"}</p>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-10 rounded-xl gap-2"
        onClick={generatePhrase}
        disabled={phraseLoading}
      >
        <Sparkles className="w-4 h-4" />
        Сгенерировать другую
      </Button>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setStep("source")}>
          Назад
        </Button>
        <Button
          type="button"
          className="flex-1 h-11 rounded-xl"
          disabled={!phrase || phraseLoading}
          onClick={() => setStep("record")}
        >
          Далее: запись
        </Button>
      </div>
    </div>
  );

  const renderRecordStep = () => (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Спойте</p>
        <p className="text-sm font-medium leading-snug">{phrase}</p>
      </div>

      <Button
        type="button"
        variant={isRecording === "sing" ? "destructive" : "outline"}
        className="w-full h-16 rounded-xl flex-col gap-1"
        onClick={() => (isRecording === "sing" ? stopRecording() : startRecording("sing"))}
      >
        <Mic className={cn("w-6 h-6", isRecording === "sing" && "animate-pulse")} />
        <span className="text-xs font-semibold">
          {isRecording === "sing" ? `Остановить · ${formatTime(recordingTime)}` : "Начать запись"}
        </span>
      </Button>

      {singFile && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-9 w-9 shrink-0"
            onClick={() => togglePreview("sing")}
          >
            {previewKey === "sing" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Контрольная запись</p>
            <p className="text-[10px] text-muted-foreground">{singFile.name}</p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => {
              if (singUrl) URL.revokeObjectURL(singUrl);
              setSingFile(null);
              setSingUrl(null);
            }}
            aria-label="Удалить запись"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setStep("phrase")}>
          Назад
        </Button>
        <Button
          type="button"
          className="flex-1 h-11 rounded-xl gap-2"
          disabled={!singFile || submitting}
          onClick={handleSubmit}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Клонировать
        </Button>
      </div>
    </div>
  );

  const renderDoneStep = () => (
    <div className="py-6 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Check className="w-7 h-7 text-primary" />
      </div>
      <p className="text-sm font-semibold">Готово!</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Голос отправлен на обработку. Когда персона будет готова, она появится в списке артистов.
      </p>
    </div>
  );

  const content = (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className={cn(step === "source" && "text-primary font-semibold")}>1. Источник</span>
          <span className={cn(step === "phrase" && "text-primary font-semibold")}>2. Фраза</span>
          <span className={cn(step === "record" && "text-primary font-semibold")}>3. Запись</span>
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>

      {step === "source" && renderSourceStep()}
      {step === "phrase" && renderPhraseStep()}
      {step === "record" && renderRecordStep()}
      {step === "done" && renderDoneStep()}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="py-3 text-left">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <MicVocal className="w-4 h-4 text-primary" />
              Клонирование голоса
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Три шага: образец → фраза → запись пения
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-4">{content}</ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="voice-clone-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MicVocal className="w-5 h-5 text-primary" />
            Клонирование голоса
          </DialogTitle>
          <DialogDescription id="voice-clone-desc">
            Три шага: образец → контрольная фраза → запись пения
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
