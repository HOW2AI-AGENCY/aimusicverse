/**
 * GuitarStudio - Professional guitar recording, analysis, and transcription interface
 * Integration with klang.io provider for:
 * - Recording guitar tracks
 * - Beat tracking and tempo detection
 * - Chord recognition
 * - Transcription to MIDI, GP5, MusicXML, PDF with notes and tablature
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Mic,
  Play,
  Square,
  Pause,
  Music,
  Sparkles,
  FileMusic,
  Download,
  Zap,
  Guitar as GuitarIcon,
  Activity,
  Clock,
  Save,
  FolderOpen,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProBadge } from "@/components/ui/pro-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useGuitarAnalysis } from "@/hooks/useGuitarAnalysis";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { useGuitarRecordings } from "@/hooks/useGuitarRecordings";
import { WorkflowVisualizer } from "@/components/professional/WorkflowVisualizer";
import { GuitarAnalysisReport } from "@/components/guitar/GuitarAnalysisReportSimplified";
import { SavedRecordingsList } from "@/components/guitar/SavedRecordingsList";
import { AudioLevelMeter } from "@/components/guitar/AudioLevelMeter";
import { Metronome } from "@/components/guitar/Metronome";
import { GuitarTuner } from "@/components/guitar/GuitarTuner";
import { GuitarRecordingPanel } from "@/components/guitar/GuitarRecordingPanel";
import { LinkToTrackDialog } from "@/components/guitar/LinkToTrackDialog";
import { AnalysisProgressStages, type AnalysisStage } from "@/components/guitar/AnalysisProgressStages";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";

type WorkflowStatus = "pending" | "active" | "completed";

const workflowSteps: Array<{
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Mic;
  description: string;
  status: WorkflowStatus;
}> = [
  {
    id: "record",
    title: "Запись",
    subtitle: "Гитарный трек",
    icon: Mic,
    description: "Запишите гитарный трек",
    status: "pending",
  },
  {
    id: "analyze",
    title: "Анализ",
    subtitle: "Обработка klang.io",
    icon: Activity,
    description: "Обработка через klang.io",
    status: "pending",
  },
  {
    id: "transcribe",
    title: "Транскрипция",
    subtitle: "Конвертация в ноты",
    icon: FileMusic,
    description: "Конвертация в ноты",
    status: "pending",
  },
  {
    id: "export",
    title: "Экспорт",
    subtitle: "Загрузка файлов",
    icon: Download,
    description: "Загрузка файлов",
    status: "pending",
  },
];

export default function GuitarStudio() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("record");
  const [recordingTime, setRecordingTime] = useState(0);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const {
    isAnalyzing,
    isRecording,
    analysisResult,
    recordedAudioUrl,
    progress,
    progressPercent,
    mediaStream,
    startRecording,
    stopRecording,
    analyzeGuitarRecording,
    clearRecording,
  } = useGuitarAnalysis();

  // Real-time audio level monitoring
  const audioLevel = useAudioLevel(mediaStream, isRecording);

  // Save recordings hook
  const { saveRecording } = useGuitarRecordings();

  // Recording timer: only runs while recording; reset is handled in handlers
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Workflow and current step are derived purely from recording/analysis state.
  const { workflow, currentStep } = useMemo(() => {
    const newWorkflow = workflowSteps.map((step) => ({ ...step }));

    let step = 0;
    if (recordedAudioUrl) {
      newWorkflow[0].status = "completed";
      step = 1;
    }
    if (isAnalyzing) {
      newWorkflow[1].status = "active";
      newWorkflow[2].status = "active";
      step = 1;
    }
    if (analysisResult) {
      newWorkflow[1].status = "completed";
      newWorkflow[2].status = "completed";
      newWorkflow[3].status = "active";
      step = 3;
    }
    return { workflow: newWorkflow, currentStep: step };
  }, [recordedAudioUrl, isAnalyzing, analysisResult]);

  // Analysis stage/error are derived from analysis state + progress text.
  const { analysisStage, analysisError } = useMemo<{
    analysisStage: AnalysisStage;
    analysisError: string | undefined;
  }>(() => {
    if (!isAnalyzing) {
      return {
        analysisStage: analysisResult ? "complete" : "idle",
        analysisError: undefined,
      };
    }
    const progressLower = progress.toLowerCase();
    if (progressLower.includes("загрузка")) {
      return { analysisStage: "uploading", analysisError: undefined };
    }
    if (progressLower.includes("ритм") || progressLower.includes("биты")) {
      return { analysisStage: "beat-tracking", analysisError: undefined };
    }
    if (progressLower.includes("аккорд")) {
      return { analysisStage: "chord-recognition", analysisError: undefined };
    }
    if (progressLower.includes("транскрипц") || progressLower.includes("ноты")) {
      return { analysisStage: "transcription", analysisError: undefined };
    }
    if (progressLower.includes("обрабатываем")) {
      return { analysisStage: "processing", analysisError: undefined };
    }
    return { analysisStage: "processing", analysisError: undefined };
  }, [isAnalyzing, progress, analysisResult]);

  const handleStartRecording = async () => {
    setRecordingTime(0);
    await startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
    setRecordingTime(0);
    toast.success("Запись остановлена. Готово к анализу!");
  };

  const handleAnalyze = async () => {
    setActiveTab("analysis");
    const result = await analyzeGuitarRecording();
    if (result) {
      setActiveTab("results");
    }
  };

  const handleClear = () => {
    clearRecording();
    setRecordingTime(0);
    setActiveTab("record");
  };

  const handleSaveRecording = async () => {
    if (!analysisResult || !recordedAudioUrl) {
      toast.error("Нет данных для сохранения");
      return;
    }

    const loadingToast = toast.loading("Сохраняем запись...");

    try {
      await saveRecording.mutateAsync({
        analysis: analysisResult,
        audioUrl: recordedAudioUrl,
        durationSeconds: analysisResult.totalDuration,
      });

      toast.success("Запись сохранена!", {
        id: loadingToast,
        description: 'Теперь доступна во вкладке "Библиотека"',
      });

      // Switch to library tab to show saved recording
      setActiveTab("library");
    } catch (error) {
      toast.error("Ошибка сохранения", {
        id: loadingToast,
        description: error instanceof Error ? error.message : "Попробуйте снова",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5 pb-24">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 via-red-500/10 to-pink-500/10 border-2 border-orange-500/20">
                <GuitarIcon className="h-7 w-7 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">Guitar Studio</h1>
                  <ProBadge size="md" showIcon />
                </div>
                <p className="text-sm text-muted-foreground">
                  Запись, анализ и транскрипция гитарных треков с klang.io
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Progress */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <WorkflowVisualizer
              title="Процесс обработки"
              steps={workflow}
              currentStep={currentStep}
              totalProgress={(workflow.filter((s) => s.status === "completed").length / workflow.length) * 100}
              variant="horizontal"
              showTimeline={true}
            />
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="record" className="text-xs sm:text-sm">
                <Mic className="w-4 h-4 mr-2" />
                Запись
              </TabsTrigger>
              <TabsTrigger value="analysis" className="text-xs sm:text-sm" disabled={!recordedAudioUrl}>
                <Activity className="w-4 h-4 mr-2" />
                Анализ
              </TabsTrigger>
              <TabsTrigger value="results" className="text-xs sm:text-sm" disabled={!analysisResult}>
                <Music className="w-4 h-4 mr-2" />
                Результаты
              </TabsTrigger>
              <TabsTrigger value="library" className="text-xs sm:text-sm">
                <FolderOpen className="w-4 h-4 mr-2" />
                Библиотека
              </TabsTrigger>
            </TabsList>

            {/* Recording Tab */}
            <TabsContent value="record" className="mt-0 space-y-6">
              {/* Mobile-Optimized Recording Panel */}
              <GuitarRecordingPanel
                isRecording={isRecording}
                recordingTime={recordingTime}
                recordedAudioUrl={recordedAudioUrl}
                audioLevel={audioLevel}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onAnalyze={handleAnalyze}
                onClear={handleClear}
                isAnalyzing={isAnalyzing}
              />

              {/* Original Recording Status (Desktop fallback) */}
              <Card className="hidden lg:block p-6 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Recording Status */}
                  <AnimatePresence mode="wait">
                    {isRecording ? (
                      <motion.div
                        key="recording"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="text-center space-y-4"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/50"
                        >
                          <Mic className="w-16 h-16 text-white" />
                        </motion.div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <Badge variant="destructive" className="text-sm px-3 py-1">
                              <Activity className="w-3 h-3 mr-1" />
                              ЗАПИСЬ
                            </Badge>
                          </div>
                          <div className="text-3xl font-mono font-bold text-red-500">{formatTime(recordingTime)}</div>
                          <p className="text-sm text-muted-foreground">Играйте на гитаре...</p>
                        </div>
                      </motion.div>
                    ) : recordedAudioUrl ? (
                      <motion.div
                        key="recorded"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="text-center space-y-4 w-full"
                      >
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                          <Music className="w-16 h-16 text-white" />
                        </div>
                        <div className="space-y-2">
                          <Badge variant="default" className="text-sm px-3 py-1 bg-green-500">
                            <Sparkles className="w-3 h-3 mr-1" />
                            ГОТОВО
                          </Badge>
                          <p className="text-sm text-muted-foreground">Запись завершена</p>
                        </div>

                        {/* Audio Preview */}
                        <div className="mt-4 w-full max-w-md mx-auto">
                          <audio src={recordedAudioUrl} controls className="w-full" style={{ height: "40px" }} />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ready"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="text-center space-y-4"
                      >
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/10 to-orange-500/10 flex items-center justify-center border-2 border-orange-500/20">
                          <GuitarIcon className="w-16 h-16 text-orange-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Готово к записи</h3>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Нажмите кнопку ниже, чтобы начать запись гитарного трека
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Recording Controls */}
                  <div className="flex items-center gap-3">
                    {!isRecording && !recordedAudioUrl && (
                      <Button
                        size="lg"
                        onClick={handleStartRecording}
                        className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
                      >
                        <Mic className="w-5 h-5 mr-2" />
                        Начать запись
                      </Button>
                    )}

                    {isRecording && (
                      <Button size="lg" variant="destructive" onClick={handleStopRecording} className="shadow-lg">
                        <Square className="w-5 h-5 mr-2" />
                        Остановить
                      </Button>
                    )}

                    {recordedAudioUrl && !isAnalyzing && (
                      <>
                        <Button
                          size="lg"
                          onClick={handleAnalyze}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg"
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          Анализировать
                        </Button>
                        <Button size="lg" variant="outline" onClick={handleClear}>
                          Новая запись
                        </Button>
                        <Button size="lg" variant="outline" onClick={handleSaveRecording}>
                          <Save className="w-5 h-5 mr-2" />
                          Сохранить
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Audio Level Meter - shows during recording */}
              {isRecording && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <AudioLevelMeter isActive={isRecording} mediaStream={mediaStream} />
                </motion.div>
              )}

              {/* Professional Tools Grid - shows when not recording */}
              {!isRecording && !recordedAudioUrl && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Metronome defaultBpm={120} />
                  <GuitarTuner />
                </div>
              )}

              {/* Recording Tips */}
              <Card className="p-4 bg-muted/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-2">💡 Советы для лучшего результата</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Используйте наушники для предотвращения обратной связи</li>
                      <li>• Играйте чётко и ровно для лучшего распознавания</li>
                      <li>• Оптимальная длительность записи: 30-120 секунд</li>
                      <li>• Убедитесь в хорошем уровне сигнала (не слишком тихо/громко)</li>
                      <li>• Минимизируйте фоновый шум для точной транскрипции</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="mt-0 space-y-6">
              {isAnalyzing || analysisResult ? (
                <AnalysisProgressStages currentStage={analysisStage} progress={progressPercent} error={analysisError} />
              ) : (
                <Card className="p-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Нажмите "Анализировать" на вкладке записи</p>
                </Card>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="mt-0">
              {analysisResult ? (
                <GuitarAnalysisReport
                  analysis={analysisResult}
                  audioUrl={recordedAudioUrl || ""}
                  onSave={handleSaveRecording}
                />
              ) : (
                <Card className="p-12 text-center">
                  <Music className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Завершите анализ, чтобы увидеть результаты</p>
                </Card>
              )}
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library" className="mt-0">
              <SavedRecordingsList />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <Card className="p-4 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
            <GuitarIcon className="w-8 h-8 text-orange-400 mb-2" />
            <h4 className="font-semibold text-sm mb-1">Профессиональная запись</h4>
            <p className="text-xs text-muted-foreground">Высокое качество 44.1kHz</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
            <Activity className="w-8 h-8 text-blue-400 mb-2" />
            <h4 className="font-semibold text-sm mb-1">Интеграция klang.io</h4>
            <p className="text-xs text-muted-foreground">AI анализ и транскрипция</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
            <FileMusic className="w-8 h-8 text-purple-400 mb-2" />
            <h4 className="font-semibold text-sm mb-1">Множество форматов</h4>
            <p className="text-xs text-muted-foreground">MIDI, GP5, XML, PDF</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
            <Sparkles className="w-8 h-8 text-green-400 mb-2" />
            <h4 className="font-semibold text-sm mb-1">Умный анализ</h4>
            <p className="text-xs text-muted-foreground">BPM, аккорды, тональность</p>
          </Card>
        </motion.div>
      </div>

      {/* Link to Track Dialog */}
      <LinkToTrackDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} analysisResult={analysisResult} />
    </div>
  );
}
