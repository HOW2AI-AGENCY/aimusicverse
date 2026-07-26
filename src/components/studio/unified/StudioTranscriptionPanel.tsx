/**
 * StudioTranscriptionPanel
 * MIDI/Notes transcription panel with Basic Pitch and Klangio support
 */

import { memo, useState, useCallback, useMemo } from "react";
import { Music2, FileMusic, FileText, Loader2, Zap, Settings2, Check } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { StudioTrack } from "@/stores/useUnifiedStudioStore";
import { useSaveTranscription, type TranscriptionNote } from "@/hooks/useStemTranscription";
import { useStudioTrackStems } from "@/hooks/studio/useStudioTrackStems";
import { useLatestStemTranscription } from "@/hooks/studio/useLatestStemTranscription";
import { useReplicateMidiTranscription } from "@/hooks/studio/useReplicateMidiTranscription";
import { useKlangioAnalyze } from "@/hooks/studio/useKlangioAnalyze";
import { useStemSeparationTaskForTrack } from "@/hooks/studio/useStemSeparationTaskForTrack";
import { generateSunoMidi, getSunoMidiStatus } from "@/api/midi-suno.api";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import type { Database } from "@/integrations/supabase/types";

type StemTranscriptionRow = Database["public"]["Tables"]["stem_transcriptions"]["Row"];

interface StudioTranscriptionPanelProps {
  track: StudioTrack;
  audioUrl: string;
  trackId?: string;
  stemId?: string;
  stemType?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

type TranscriptionEngine = "suno" | "basic-pitch" | "klangio";
// Valid Klangio models from API: piano, guitar, bass, vocal, universal, lead, detect, drums, multi, wind, string, piano_arrangement
type KlangioModel =
  | "detect"
  | "universal"
  | "piano"
  | "piano_arrangement"
  | "guitar"
  | "bass"
  | "drums"
  | "vocal"
  | "lead"
  | "multi"
  | "wind"
  | "string";

/**
 * Map stem/track type to the most appropriate Klangio model
 */
function autoDetectKlangioModel(stemType?: string, trackType?: string): KlangioModel {
  const t = (stemType || trackType || "").toLowerCase();
  if (t.includes("vocal") || t.includes("voice") || t.includes("vocals")) return "vocal";
  if (t.includes("guitar")) return "guitar";
  if (t.includes("bass")) return "bass";
  if (t.includes("drum") || t.includes("percussion")) return "drums";
  if (t.includes("piano") || t.includes("keys") || t.includes("keyboard")) return "piano";
  if (t.includes("string") || t.includes("violin") || t.includes("cello")) return "string";
  if (t.includes("wind") || t.includes("flute") || t.includes("sax") || t.includes("trumpet")) return "wind";
  if (t.includes("lead") || t.includes("melody") || t.includes("solo")) return "lead";
  return "detect"; // Let Klangio auto-detect
}

interface TranscriptionResult {
  midi_url?: string;
  midi_quant_url?: string;
  musicxml_url?: string;
  pdf_url?: string;
  gp5_url?: string;
  bpm?: number;
  key?: string;
  notes_count?: number;
}

export const StudioTranscriptionPanel = memo(function StudioTranscriptionPanel({
  track,
  audioUrl,
  trackId,
  stemId: propStemId,
  stemType,
  onComplete,
  onClose,
}: StudioTranscriptionPanelProps) {
  const queryClient = useQueryClient();
  const { saveTranscription } = useSaveTranscription();
  const { mutateAsync: invokeReplicate } = useReplicateMidiTranscription();
  const { mutateAsync: invokeKlangio } = useKlangioAnalyze();

  const { user } = useAuth();
  const { data: separationTask } = useStemSeparationTaskForTrack(trackId);

  // Vocals / instrumental stems come from a Suno separation task, so SunoAPI
  // MIDI is the default (and cheapest/fastest) engine for them.
  const isSimpleStem = useMemo(() => {
    const t = (stemType || track.type || "").toLowerCase();
    return t.includes("vocal") || t.includes("instrumental") || t.includes("music");
  }, [stemType, track.type]);

  const canUseSuno = isSimpleStem && !!separationTask?.separation_task_id;

  const [engineOverride, setEngineOverride] = useState<TranscriptionEngine | null>(null);
  const engine: TranscriptionEngine = engineOverride ?? (canUseSuno ? "suno" : "klangio");
  const setEngine = setEngineOverride;
  // Auto-detect initial model based on stem/track type
  const detectedModel = autoDetectKlangioModel(stemType, track.type);
  const [klangioModel, setKlangioModel] = useState<KlangioModel>(detectedModel);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<TranscriptionResult | null>(null);

  // Normalize stem type for DB lookup - map StudioTrack.type to track_stems.stem_type
  const normalizedStemType = useMemo(() => {
    const t = (stemType || track.type || "").toLowerCase();
    if (t === "main" || t === "stem") return null; // Can't determine
    if (t.includes("vocal") && !t.includes("instrumental")) return "vocal";
    if (t.includes("instrumental") || t.includes("music")) return "instrumental";
    if (t.includes("drum")) return "drums";
    if (t.includes("bass")) return "bass";
    if (t.includes("other")) return "other";
    return t; // Return as-is for exact match attempt
  }, [stemType, track.type]);

  // Resolve stemId from trackId + stemType if not provided directly
  const { data: stemsList } = useStudioTrackStems(propStemId || normalizedStemType ? trackId : undefined);

  const resolvedStemData = useMemo(() => {
    const stems = stemsList ?? [];

    // If propStemId provided, find it via trackId stems list
    if (propStemId && trackId) {
      const found = stems.find((s) => s.id === propStemId);
      return found ? { stemId: found.id, stemType: found.stem_type } : null;
    }

    // Try to find stem by trackId + normalizedStemType (exact match)
    if (trackId && normalizedStemType) {
      const found = stems.find((s) => s.stem_type === normalizedStemType);
      if (found) {
        logger.debug("[StudioTranscriptionPanel] Resolved stem by type", { normalizedStemType, stemId: found.id });
        return { stemId: found.id, stemType: found.stem_type };
      }
    }

    // NO FALLBACK - if we can't find the correct stem, don't use a random one
    // This prevents saving transcriptions to wrong stems
    if (propStemId || (trackId && normalizedStemType)) {
      logger.warn("[StudioTranscriptionPanel] Could not resolve stem for", { trackId, normalizedStemType });
    }
    return null;
  }, [stemsList, propStemId, trackId, normalizedStemType]);

  const resolvedStemId = resolvedStemData?.stemId || propStemId;
  const resolvedStemType = resolvedStemData?.stemType || normalizedStemType;

  // Fetch existing transcription using resolved stemId
  const { data: existingTranscription, isLoading: loadingExisting } = useLatestStemTranscription({
    stemId: resolvedStemId,
    trackId,
  });

  // Basic Pitch transcription (Replicate)
  const runBasicPitch = useCallback(async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);
    setProgress(10);

    try {
      const progressInterval = window.setInterval(() => {
        setProgress((p) => Math.min(85, p + 5));
      }, 2500);

      const { data, error } = await invokeReplicate({
        audioUrl,
        trackId,
        stemId: resolvedStemId,
        model: "basic-pitch",
      });

      window.clearInterval(progressInterval);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Transcription failed");

      setProgress(100);
      const midiUrl = data?.files?.midi || data?.midiUrl || null;
      const notesCount = data?.notes_count || (Array.isArray(data?.notes) ? data.notes.length : undefined);

      setResult({
        midi_url: midiUrl ?? undefined,
        notes_count: notesCount,
      });

      // Persist result to database so icons/visualization appear across sessions
      try {
        const stemIdForSave = resolvedStemId;

        if (trackId && stemIdForSave && (midiUrl || notesCount)) {
          await saveTranscription({
            stemId: stemIdForSave,
            trackId,
            midiUrl,
            model: "basic-pitch",
            notes: (Array.isArray(data?.notes) ? data.notes : null) as TranscriptionNote[] | null,
            notesCount: typeof notesCount === "number" ? notesCount : null,
          });
        }
      } catch (e: unknown) {
        // Saving is required for the UI, but transcription itself succeeded
        logger.warn("Failed to persist transcription", { error: e });
      }

      toast.success("Транскрипция завершена");
      queryClient.invalidateQueries({ queryKey: ["transcription"] });
      queryClient.invalidateQueries({ queryKey: ["stem-type-transcription-status"] });
      queryClient.invalidateQueries({ queryKey: ["stem-transcriptions-full"] });
      if (resolvedStemId) queryClient.invalidateQueries({ queryKey: ["stem-transcriptions", resolvedStemId] });
      if (trackId) {
        queryClient.invalidateQueries({ queryKey: ["track-transcriptions", trackId] });
        queryClient.invalidateQueries({ queryKey: ["track-midi-status", trackId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tracks-midi-status"] });
      onComplete?.();
    } catch (err: unknown) {
      logger.error("Basic Pitch error", err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : "Ошибка транскрипции");
    } finally {
      setIsTranscribing(false);
    }
  }, [audioUrl, resolvedStemId, trackId, queryClient, saveTranscription, onComplete, invokeReplicate]);

  // Klangio transcription (klangio-analyze, server-side polling)
  const runKlangio = useCallback(async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);
    setProgress(10);

    try {
      const progressInterval = window.setInterval(() => {
        setProgress((p) => Math.min(90, p + 7));
      }, 3000);

      const { data, error } = await invokeKlangio({
        audio_url: audioUrl,
        mode: "transcription",
        model: klangioModel,
        outputs: ["midi", "midi_quant", "gp5", "pdf", "mxml"],
        title: track.name,
        stem_type: resolvedStemType || track.type,
        user_id: (track as { user_id?: string }).user_id,
      });

      window.clearInterval(progressInterval);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Transcription failed");

      setProgress(100);

      const normalized = {
        midiUrl: (data?.files?.midi || data?.files?.midi_url || data?.midi_url || null) as string | null,
        midiQuantUrl: (data?.files?.midi_quant || data?.files?.midi_quant_url || data?.midi_quant_url || null) as
          string | null,
        mxmlUrl: (data?.files?.mxml ||
          data?.files?.musicxml ||
          data?.files?.musicxml_url ||
          data?.musicxml_url ||
          null) as string | null,
        pdfUrl: (data?.files?.pdf || data?.files?.pdf_url || data?.pdf_url || null) as string | null,
        gp5Url: (data?.files?.gp5 || data?.files?.gp5_url || data?.gp5_url || null) as string | null,
        bpm: typeof data?.bpm === "number" ? data.bpm : null,
        keyDetected: (data?.key_detected || data?.key || null) as string | null,
        notesCount: typeof data?.notes_count === "number" ? data.notes_count : null,
      };

      // klangio-analyze returns files in multiple shapes; normalize to our UI shape
      setResult({
        midi_url: normalized.midiUrl ?? undefined,
        midi_quant_url: normalized.midiQuantUrl ?? undefined,
        musicxml_url: normalized.mxmlUrl ?? undefined,
        pdf_url: normalized.pdfUrl ?? undefined,
        gp5_url: normalized.gp5Url ?? undefined,
        bpm: normalized.bpm ?? undefined,
        key: normalized.keyDetected ?? undefined,
        notes_count: normalized.notesCount ?? undefined,
      });

      // Persist result to database so notation panel / icons can load it
      try {
        const stemIdForSave = resolvedStemId;

        const hasAny = !!(
          normalized.midiUrl ||
          normalized.midiQuantUrl ||
          normalized.mxmlUrl ||
          normalized.pdfUrl ||
          normalized.gp5Url ||
          normalized.notesCount
        );
        if (trackId && stemIdForSave && hasAny) {
          await saveTranscription({
            stemId: stemIdForSave,
            trackId,
            midiUrl: normalized.midiUrl,
            midiQuantUrl: normalized.midiQuantUrl,
            mxmlUrl: normalized.mxmlUrl,
            pdfUrl: normalized.pdfUrl,
            gp5Url: normalized.gp5Url,
            model: `klangio:${klangioModel}`,
            notes: (Array.isArray(data?.notes) ? data.notes : null) as TranscriptionNote[] | null,
            bpm: normalized.bpm,
            keyDetected: normalized.keyDetected,
            notesCount: normalized.notesCount,
          });
        }
      } catch (e: unknown) {
        logger.warn("Failed to persist transcription", { error: e });
      }

      toast.success("Транскрипция завершена");
      queryClient.invalidateQueries({ queryKey: ["transcription"] });
      queryClient.invalidateQueries({ queryKey: ["stem-type-transcription-status"] });
      queryClient.invalidateQueries({ queryKey: ["stem-transcriptions-full"] });
      if (resolvedStemId) queryClient.invalidateQueries({ queryKey: ["stem-transcriptions", resolvedStemId] });
      if (trackId) {
        queryClient.invalidateQueries({ queryKey: ["track-transcriptions", trackId] });
        queryClient.invalidateQueries({ queryKey: ["track-midi-status", trackId] });
      }
      queryClient.invalidateQueries({ queryKey: ["tracks-midi-status"] });
      onComplete?.();
    } catch (err: unknown) {
      logger.error("Klangio error", err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : "Ошибка транскрипции");
    } finally {
      setIsTranscribing(false);
    }
  }, [
    audioUrl,
    klangioModel,
    resolvedStemId,
    resolvedStemType,
    trackId,
    track.name,
    track.type,
    queryClient,
    saveTranscription,
    onComplete,
    invokeKlangio,
  ]);

  // SunoAPI MIDI (vocals / instrumental — uses the stem separation taskId)
  const runSuno = useCallback(async () => {
    const separationTaskId = separationTask?.separation_task_id;
    if (!separationTaskId || !user?.id) {
      toast.error("Нет данных разделения стемов для SunoAPI");
      return;
    }

    setIsTranscribing(true);
    setProgress(10);

    try {
      logger.info("[Transcription] Suno MIDI start", {
        trackId,
        stemId: resolvedStemId,
        stemType: resolvedStemType,
        separationTaskId,
      });

      const accepted = await generateSunoMidi({ taskId: separationTaskId, userId: user.id });
      logger.info("[Transcription] Suno MIDI accepted", { midiTaskId: accepted.taskId });

      const deadline = Date.now() + 120_000;
      let midiUrl: string | null = null;
      let notesCount: number | null = null;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 5000));
        setProgress((p) => Math.min(90, p + 7));

        const status = await getSunoMidiStatus(accepted.taskId);
        logger.debug("[Transcription] Suno MIDI poll", { midiTaskId: accepted.taskId, status: status.status });

        if (status.status === "SUCCESS") {
          midiUrl = status.midiUrl ?? null;
          notesCount = status.notesCount ?? null;
          break;
        }
        if (status.status === "FAILED") {
          throw new Error(status.error || "SunoAPI MIDI generation failed");
        }
      }

      if (!midiUrl) throw new Error("SunoAPI не вернул MIDI (таймаут)");

      setProgress(100);
      setResult({ midi_url: midiUrl, notes_count: notesCount ?? undefined });

      if (trackId && resolvedStemId) {
        try {
          await saveTranscription({
            stemId: resolvedStemId,
            trackId,
            midiUrl,
            model: "suno",
            notes: null,
            notesCount,
          });
        } catch (e: unknown) {
          logger.warn("[Transcription] Failed to persist Suno MIDI", { error: e });
        }
      }

      toast.success("MIDI готов (SunoAPI)");
      queryClient.invalidateQueries({ queryKey: ["transcription"] });
      queryClient.invalidateQueries({ queryKey: ["stem-type-transcription-status"] });
      queryClient.invalidateQueries({ queryKey: ["stem-transcriptions-full"] });
      if (resolvedStemId) queryClient.invalidateQueries({ queryKey: ["stem-transcriptions", resolvedStemId] });
      if (trackId) {
        queryClient.invalidateQueries({ queryKey: ["track-transcriptions", trackId] });
        queryClient.invalidateQueries({ queryKey: ["track-midi-status", trackId] });
      }
      onComplete?.();
    } catch (err: unknown) {
      logger.error("[Transcription] Suno MIDI error", err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : "Ошибка MIDI через SunoAPI");
    } finally {
      setIsTranscribing(false);
    }
  }, [
    separationTask?.separation_task_id,
    user?.id,
    trackId,
    resolvedStemId,
    resolvedStemType,
    saveTranscription,
    queryClient,
    onComplete,
  ]);

  // Start transcription
  const startTranscription = useCallback(() => {
    if (engine === "suno") {
      runSuno();
    } else if (engine === "basic-pitch") {
      runBasicPitch();
    } else {
      runKlangio();
    }
  }, [engine, runSuno, runBasicPitch, runKlangio]);

  // Download file
  const downloadFile = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success("Файл скачан");
    } catch (err) {
      toast.error("Ошибка скачивания");
    }
  }, []);

  // Merge existing transcription with new result
  // useLatestStemTranscription returns Record<string, unknown> (untyped API boundary),
  // so narrow to the real stem_transcriptions row shape before reading fields.
  const existingRow = existingTranscription as StemTranscriptionRow | null | undefined;
  const displayResult: TranscriptionResult | null =
    result ||
    (existingRow
      ? {
          midi_url: existingRow.midi_url ?? undefined,
          midi_quant_url: existingRow.midi_quant_url ?? undefined,
          musicxml_url: existingRow.mxml_url ?? undefined,
          pdf_url: existingRow.pdf_url ?? undefined,
          gp5_url: existingRow.gp5_url ?? undefined,
          bpm: existingRow.bpm ?? undefined,
          key: existingRow.key_detected ?? undefined,
          notes_count:
            existingRow.notes_count ?? (Array.isArray(existingRow.notes) ? existingRow.notes.length : undefined),
        }
      : null);

  const hasFiles =
    displayResult &&
    (displayResult.midi_url || displayResult.pdf_url || displayResult.gp5_url || displayResult.musicxml_url);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" />
          MIDI / Ноты
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Транскрипция "{track.name}"</p>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-6">
          {/* Engine selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Движок транскрипции</Label>
            <Tabs value={engine} onValueChange={(v) => setEngine(v as TranscriptionEngine)}>
              <TabsList className={cn("grid w-full", canUseSuno ? "grid-cols-3" : "grid-cols-2")}>
                {canUseSuno && (
                  <TabsTrigger value="suno" className="text-xs">
                    <Music2 className="w-3 h-3 mr-1.5" />
                    SunoAPI
                  </TabsTrigger>
                )}
                <TabsTrigger value="basic-pitch" className="text-xs">
                  <Zap className="w-3 h-3 mr-1.5" />
                  Basic Pitch
                </TabsTrigger>
                <TabsTrigger value="klangio" className="text-xs">
                  <Settings2 className="w-3 h-3 mr-1.5" />
                  Klangio Pro
                </TabsTrigger>
              </TabsList>

              {canUseSuno && (
                <TabsContent value="suno" className="mt-3">
                  <div className="p-3 rounded-lg bg-primary/10 text-sm">
                    <p className="font-medium mb-1">MIDI через SunoAPI (по умолчанию)</p>
                    <p className="text-muted-foreground text-xs">
                      Использует задачу разделения стемов — самый точный вариант для вокала и инструментала.
                    </p>
                  </div>
                </TabsContent>
              )}


              <TabsContent value="basic-pitch" className="mt-3">
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-1">Быстрая транскрипция</p>
                  <p className="text-muted-foreground text-xs">
                    ML-модель для быстрого извлечения MIDI. Лучше для мелодий и одиночных инструментов.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="klangio" className="mt-3 space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-1">Профессиональная транскрипция</p>
                  <p className="text-muted-foreground text-xs">Высокоточная модель с экспортом в GP5, PDF, MusicXML.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Модель инструмента</Label>
                  <Select value={klangioModel} onValueChange={(v) => setKlangioModel(v as KlangioModel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detect">🔍 Автоопределение</SelectItem>
                      <SelectItem value="universal">🎵 Универсальная</SelectItem>
                      <SelectItem value="vocal">🎤 Вокал</SelectItem>
                      <SelectItem value="piano">🎹 Пианино</SelectItem>
                      <SelectItem value="piano_arrangement">🎼 Пианино (аранжировка)</SelectItem>
                      <SelectItem value="guitar">🎸 Гитара</SelectItem>
                      <SelectItem value="bass">🎸 Бас</SelectItem>
                      <SelectItem value="drums">🥁 Ударные</SelectItem>
                      <SelectItem value="lead">🎶 Соло/Мелодия</SelectItem>
                      <SelectItem value="multi">🎻 Мульти-инструмент</SelectItem>
                      <SelectItem value="string">🎻 Струнные</SelectItem>
                      <SelectItem value="wind">🎺 Духовые</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          {/* Progress */}
          {isTranscribing && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Транскрипция...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {hasFiles && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Готовые файлы
              </Label>

              <div className="grid grid-cols-2 gap-2">
                {displayResult.midi_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.midi_url!, `${track.name}.mid`)}
                  >
                    <FileMusic className="w-4 h-4 mr-2 text-blue-500" />
                    MIDI
                  </Button>
                )}

                {displayResult.pdf_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.pdf_url!, `${track.name}.pdf`)}
                  >
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                    PDF
                  </Button>
                )}

                {displayResult.gp5_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.gp5_url!, `${track.name}.gp5`)}
                  >
                    <FileMusic className="w-4 h-4 mr-2 text-orange-500" />
                    Guitar Pro
                  </Button>
                )}

                {displayResult.musicxml_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => downloadFile(displayResult.musicxml_url!, `${track.name}.xml`)}
                  >
                    <FileText className="w-4 h-4 mr-2 text-purple-500" />
                    MusicXML
                  </Button>
                )}
              </div>

              {/* Metadata */}
              {(displayResult.bpm || displayResult.key || displayResult.notes_count) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {displayResult.bpm && <Badge variant="secondary">{displayResult.bpm} BPM</Badge>}
                  {displayResult.key && <Badge variant="secondary">{displayResult.key}</Badge>}
                  {displayResult.notes_count && <Badge variant="secondary">{displayResult.notes_count} нот</Badge>}
                </div>
              )}
            </div>
          )}

          {/* No files yet */}
          {!hasFiles && !isTranscribing && (
            <div className="text-center py-6 text-muted-foreground">
              <Music2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Транскрипция ещё не выполнена</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action button */}
      <div className="p-4 border-t border-border/50">
        <Button className="w-full" onClick={startTranscription} disabled={isTranscribing || !audioUrl}>
          {isTranscribing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Music2 className="w-4 h-4 mr-2" />}
          {hasFiles ? "Повторить транскрипцию" : "Начать транскрипцию"}
        </Button>
      </div>
    </div>
  );
});
