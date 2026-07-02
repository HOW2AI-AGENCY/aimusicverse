/**
 * AudioDetailPanel - Sheet panel showing audio details and actions
 */

import { useState } from "react";
import { format, ru } from "@/lib/date-utils";
import {
  Play,
  Pause,
  Trash2,
  Edit,
  Check,
  X,
  Loader2,
  Sparkles,
  FileText,
  Mic,
  Music,
  Disc,
  ArrowRight,
  Mic2,
  Guitar,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AddVocalsToReferenceDialog } from "@/components/audio-reference/AddVocalsToReferenceDialog";
import { useReferenceAudio, type ReferenceAudio } from "@/hooks/useReferenceAudio";
import { invokeAnalyzeAudio, invokeTranscribeLyrics } from "@/services/audio-reference/cloud-audio.service";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface AudioDetailPanelProps {
  audio: ReferenceAudio;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onPlay: (audio: ReferenceAudio) => void;
  isPlaying: boolean;
  onUseForGeneration: (audio: ReferenceAudio, mode: "cover" | "extend") => void;
}

export function AudioDetailPanel({
  audio,
  open,
  onOpenChange,
  onDelete,
  onPlay,
  isPlaying,
  onUseForGeneration,
}: AudioDetailPanelProps) {
  const { updateAnalysis } = useReferenceAudio();
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState(audio.transcription || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [addVocalsDialogOpen, setAddVocalsDialogOpen] = useState(false);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSaveLyrics = async () => {
    setIsSaving(true);
    try {
      await updateAnalysis({
        id: audio.id,
        transcription: editedLyrics,
      });
      setIsEditingLyrics(false);
      toast.success("Текст сохранен");
    } catch (error) {
      toast.error("Ошибка сохранения");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const { data, error } = await invokeAnalyzeAudio({
        audioUrl: audio.file_url,
        referenceId: audio.id,
      });

      if (error) throw error;

      const parsed = data?.parsed || {};

      await updateAnalysis({
        id: audio.id,
        genre: parsed.genre,
        mood: parsed.mood,
        styleDescription: parsed.style_description,
        tempo: parsed.tempo,
        energy: parsed.energy,
        bpm: parsed.bpm ? Number(parsed.bpm) : undefined,
        vocalStyle: parsed.vocal_style,
        instruments: parsed.instruments,
        hasVocals: parsed.has_vocals ?? true,
        analysisStatus: "completed",
      });

      setAnalysisProgress(100);
      toast.success("Анализ завершен");
    } catch (error) {
      logger.error("Analysis error", error);
      toast.error("Ошибка анализа");
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleExtractLyrics = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(prev + 8, 85));
    }, 600);

    try {
      const { data, error } = await invokeTranscribeLyrics({
        audioUrl: audio.file_url,
      });

      if (error) throw error;

      const lyrics = data.transcription || data.lyrics || "";
      setEditedLyrics(lyrics);

      await updateAnalysis({
        id: audio.id,
        transcription: lyrics,
        hasVocals: true,
        analysisStatus: "completed",
      });

      setAnalysisProgress(100);
      toast.success("Текст извлечен");
    } catch (error) {
      logger.error("Lyrics extraction error", error);
      toast.error("Ошибка извлечения текста");
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {audio.source === "recording" ? <Mic className="w-4 h-4 text-primary" /> : <Music className="w-4 h-4" />}
            <span className="truncate">{audio.file_name}</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full mt-4 pr-4">
          <div className="space-y-4 pb-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => onUseForGeneration(audio, "cover")} className="h-14 gap-2">
                <Disc className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">Кавер</div>
                  <div className="text-[10px] opacity-70">Создать в этом стиле</div>
                </div>
              </Button>
              <Button variant="outline" onClick={() => onUseForGeneration(audio, "extend")} className="h-14 gap-2">
                <ArrowRight className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">Расширить</div>
                  <div className="text-[10px] opacity-70">Продолжить трек</div>
                </div>
              </Button>
            </div>

            {/* Add Vocals / Instrumental */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setAddVocalsDialogOpen(true)} className="h-12 gap-2">
                <Mic2 className="w-4 h-4" />
                <span className="text-sm">Добавить вокал</span>
              </Button>
              <Button variant="secondary" onClick={() => setAddVocalsDialogOpen(true)} className="h-12 gap-2">
                <Guitar className="w-4 h-4" />
                <span className="text-sm">Новая аранжировка</span>
              </Button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="text-muted-foreground text-xs">Длительность</p>
                <p className="font-medium">{formatDuration(audio.duration_seconds)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Дата</p>
                <p className="font-medium">{format(new Date(audio.created_at), "d MMM yyyy", { locale: ru })}</p>
              </div>
              {audio.bpm && (
                <div>
                  <p className="text-muted-foreground text-xs">BPM</p>
                  <p className="font-medium">{audio.bpm}</p>
                </div>
              )}
              {audio.genre && (
                <div>
                  <p className="text-muted-foreground text-xs">Жанр</p>
                  <p className="font-medium">{audio.genre}</p>
                </div>
              )}
              {audio.mood && (
                <div>
                  <p className="text-muted-foreground text-xs">Настроение</p>
                  <p className="font-medium">{audio.mood}</p>
                </div>
              )}
              {audio.energy && (
                <div>
                  <p className="text-muted-foreground text-xs">Энергия</p>
                  <p className="font-medium capitalize">{audio.energy}</p>
                </div>
              )}
              {audio.tempo && (
                <div>
                  <p className="text-muted-foreground text-xs">Темп</p>
                  <p className="font-medium capitalize">{audio.tempo}</p>
                </div>
              )}
              {audio.detected_language && (
                <div>
                  <p className="text-muted-foreground text-xs">Язык</p>
                  <p className="font-medium uppercase">{audio.detected_language}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">Тип</p>
                <p className="font-medium">
                  {audio.has_vocals && audio.has_instrumentals
                    ? "🎤 + 🎸"
                    : audio.has_vocals
                      ? "🎤 Вокал"
                      : "🎸 Инструментал"}
                </p>
              </div>
              {audio.vocal_style && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Стиль вокала</p>
                  <p className="font-medium">{audio.vocal_style}</p>
                </div>
              )}
            </div>

            {/* Instruments */}
            {audio.instruments && audio.instruments.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs mb-2">Инструменты</p>
                <div className="flex flex-wrap gap-1.5">
                  {audio.instruments.map((instrument, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {instrument}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Style Description */}
            {audio.style_description && (
              <div>
                <p className="text-muted-foreground text-xs mb-2">Описание стиля</p>
                <div className="text-sm bg-primary/5 border border-primary/20 p-3 rounded-lg">
                  {audio.style_description}
                </div>
              </div>
            )}

            {/* Analysis Actions */}
            {audio.analysis_status !== "completed" && (
              <div className="space-y-2">
                {isAnalyzing && (
                  <div className="space-y-2">
                    <Progress value={analysisProgress} className="h-1" />
                    <p className="text-xs text-muted-foreground text-center">Анализируем аудио...</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Анализ стиля
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExtractLyrics}
                    disabled={isAnalyzing}
                    className="flex-1 gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Извлечь текст
                  </Button>
                </div>
              </div>
            )}

            {/* Lyrics / Transcription */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground text-xs">Текст / Транскрипция</p>
                {!isEditingLyrics ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingLyrics(true)}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Редактировать
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditingLyrics(false);
                        setEditedLyrics(audio.transcription || "");
                      }}
                      className="h-6 px-2 text-xs"
                      disabled={isSaving}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveLyrics}
                      className="h-6 px-2 text-xs text-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                  </div>
                )}
              </div>

              {isEditingLyrics ? (
                <Textarea
                  value={editedLyrics}
                  onChange={(e) => setEditedLyrics(e.target.value)}
                  placeholder="Введите текст песни..."
                  className="min-h-[200px] text-sm"
                />
              ) : audio.transcription ? (
                <pre className="whitespace-pre-wrap text-sm font-sans bg-secondary/50 p-3 rounded-lg max-h-[200px] overflow-auto">
                  {audio.transcription}
                </pre>
              ) : (
                <div className="text-center py-6 bg-secondary/30 rounded-lg">
                  <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Текст не извлечен</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleExtractLyrics}
                    disabled={isAnalyzing}
                    className="mt-1 text-xs"
                  >
                    Извлечь автоматически
                  </Button>
                </div>
              )}
            </div>

            {/* Playback & Delete */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => onPlay(audio)}>
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Воспроизвести
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  onDelete(audio.id);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>

      {/* Add Vocals/Instrumental Dialog */}
      <AddVocalsToReferenceDialog open={addVocalsDialogOpen} onOpenChange={setAddVocalsDialogOpen} audio={audio} />
    </Sheet>
  );
}
