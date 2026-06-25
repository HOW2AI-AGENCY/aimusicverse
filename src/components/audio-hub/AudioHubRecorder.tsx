/**
 * AudioHubRecorder - Recording section with mode selection and visualization
 */

import React, { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Mic, Settings2, Sparkles, Loader2 } from "@/lib/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { RecordingTypeSelector } from "@/components/recording/RecordingTypeSelector";
import { RecordingControls } from "@/components/recording/RecordingControls";
import { RecordingVisualizer } from "@/components/recording/RecordingVisualizer";
import { RecordingPreview } from "@/components/recording/RecordingPreview";
import { useUnifiedRecording, RecordingMode } from "@/hooks/audio/useUnifiedRecording";
import { UnifiedAnalysisCard } from "@/components/analysis/UnifiedAnalysisCard";
import { UnifiedAnalysisResult } from "@/services/unified-analysis/types";
import { useUnifiedAnalysis } from "@/hooks/useUnifiedAnalysis";
import { toast } from "sonner";

export const AudioHubRecorder = memo(function AudioHubRecorder() {
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("vocal");
  const [analysisResult, setAnalysisResult] = useState<UnifiedAnalysisResult | null>(null);

  const {
    isRecording,
    isPaused,
    audioUrl,
    audioBlob,
    duration,
    audioLevel,
    waveformData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useUnifiedRecording({ mode: recordingMode });

  const { analyze, isAnalyzing } = useUnifiedAnalysis();

  const handleStart = useCallback(async () => {
    try {
      await startRecording();
    } catch (error) {
      toast.error("Не удалось начать запись. Проверьте доступ к микрофону.");
    }
  }, [startRecording]);

  const handleStop = useCallback(() => {
    stopRecording();
    setAnalysisResult(null);
  }, [stopRecording]);

  const handleReset = useCallback(() => {
    resetRecording();
    setAnalysisResult(null);
  }, [resetRecording]);

  const handleAnalyze = useCallback(async () => {
    if (!audioUrl) return;

    try {
      const result = await analyze({
        audioUrl,
        analysisTypes: ["full"],
      });
      setAnalysisResult(result);
      toast.success("Анализ завершён");
    } catch (error) {
      toast.error("Ошибка анализа");
    }
  }, [audioUrl, analyze]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Режим записи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecordingTypeSelector value={recordingMode} onChange={setRecordingMode} disabled={isRecording} />
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Visualizer */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center min-h-[120px] rounded-xl bg-muted/30">
              {isRecording ? (
                <RecordingVisualizer
                  audioLevel={audioLevel}
                  waveformData={waveformData}
                  isRecording={isRecording}
                  isPaused={isPaused}
                  variant="combined"
                  height={100}
                />
              ) : audioUrl ? (
                <div className="text-center space-y-2">
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {formatDuration(duration)}
                  </Badge>
                  <p className="text-sm text-muted-foreground">Запись готова</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="p-4 rounded-full bg-muted/50 mx-auto w-fit">
                    <Mic className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Нажмите для начала записи</p>
                </div>
              )}
            </div>

            {/* Duration overlay when recording */}
            {isRecording && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-3 right-3">
                <Badge variant={isPaused ? "secondary" : "destructive"} className="font-mono">
                  {isPaused ? "ПАУЗА" : "REC"} {formatDuration(duration)}
                </Badge>
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <RecordingControls
            isRecording={isRecording}
            isPaused={isPaused}
            hasRecording={!!audioUrl}
            onStart={handleStart}
            onStop={handleStop}
            onPause={pauseRecording}
            onResume={resumeRecording}
            onReset={handleReset}
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Preview & Analysis */}
      <AnimatePresence>
        {audioUrl && audioBlob && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <RecordingPreview
              audioUrl={audioUrl}
              audioBlob={audioBlob}
              duration={duration}
              waveformData={waveformData}
              onReset={handleReset}
              showDownload
            />

            {/* Analysis Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Анализ
                  </CardTitle>
                  <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Анализ...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Анализ
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {analysisResult ? (
                  <UnifiedAnalysisCard analysis={analysisResult} />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.div>
                        <span>Анализируем...</span>
                      </div>
                    ) : (
                      <p>Нажмите "Анализ" для определения BPM, тональности и стиля</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AudioHubRecorder;
