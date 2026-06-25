/**
 * GuitarRecordingPanel - Mobile-optimized guitar recording interface
 * Compact panel with touch-friendly controls, real-time level meter, and recording status
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Mic, Square, Play, Pause, RotateCcw, Zap, Clock, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/player-utils";

interface GuitarRecordingPanelProps {
  isRecording: boolean;
  recordingTime: number;
  recordedAudioUrl: string | null;
  audioLevel: number; // 0-100
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnalyze: () => void;
  onClear: () => void;
  isAnalyzing?: boolean;
  className?: string;
}

export function GuitarRecordingPanel({
  isRecording,
  recordingTime,
  recordedAudioUrl,
  audioLevel,
  onStartRecording,
  onStopRecording,
  onAnalyze,
  onClear,
  isAnalyzing = false,
  className,
}: GuitarRecordingPanelProps) {
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);

  // Recording state
  const hasRecording = !!recordedAudioUrl;
  const canRecord = !isRecording && !hasRecording && !isAnalyzing;
  const canAnalyze = hasRecording && !isAnalyzing;

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-br from-orange-500/5 via-red-500/5 to-pink-500/5",
        "border-orange-500/20",
        className,
      )}
    >
      {/* Recording pulse effect */}
      {isRecording && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <div className="relative p-4 space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className={cn("w-5 h-5", isRecording ? "text-red-500" : "text-orange-400")} />
            </motion.div>
            <div>
              <h3 className="text-sm font-semibold">
                {isRecording ? "Запись..." : hasRecording ? "Готово" : "Гитара"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRecording ? "Играйте" : hasRecording ? "Записано" : "Готов к записи"}
              </p>
            </div>
          </div>

          {/* Timer or Status Badge */}
          {isRecording && (
            <Badge variant="destructive" className="font-mono tabular-nums">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(recordingTime)}
            </Badge>
          )}
          {hasRecording && !isRecording && (
            <Badge className="bg-green-500">
              <Activity className="w-3 h-3 mr-1" />
              {formatTime(recordingTime)}
            </Badge>
          )}
        </div>

        {/* Audio Level Meter (when recording) */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Уровень входа</span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    audioLevel > 80 ? "text-red-500" : audioLevel > 50 ? "text-green-500" : "text-muted-foreground",
                  )}
                >
                  {audioLevel}%
                </span>
              </div>
              <Progress
                value={audioLevel}
                className={cn(
                  "h-2",
                  audioLevel > 90 ? "[&>*]:bg-red-500" : audioLevel > 80 ? "[&>*]:bg-orange-500" : "[&>*]:bg-green-500",
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio Preview (when has recording) */}
        <AnimatePresence>
          {hasRecording && !isRecording && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <audio
                src={recordedAudioUrl}
                controls
                className="w-full h-10 rounded-md"
                onPlay={() => setAudioPreviewPlaying(true)}
                onPause={() => setAudioPreviewPlaying(false)}
                onEnded={() => setAudioPreviewPlaying(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {canRecord && (
            <Button
              size="lg"
              onClick={onStartRecording}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg touch-manipulation"
            >
              <Mic className="w-4 h-4 mr-2" />
              Записать
            </Button>
          )}

          {isRecording && (
            <Button
              size="lg"
              variant="destructive"
              onClick={onStopRecording}
              className="flex-1 shadow-lg touch-manipulation"
            >
              <Square className="w-4 h-4 mr-2" />
              Стоп
            </Button>
          )}

          {canAnalyze && (
            <>
              <Button
                size="lg"
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg touch-manipulation"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                    </motion.div>
                    Анализ...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Анализ
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onClear}
                disabled={isAnalyzing}
                className="touch-manipulation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Recording Tips */}
        {!hasRecording && !isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 space-y-1"
          >
            <p className="font-medium">💡 Советы:</p>
            <ul className="space-y-0.5 ml-4 list-disc">
              <li>Используйте наушники</li>
              <li>Держите уровень 50-80%</li>
              <li>Минимум фонового шума</li>
            </ul>
          </motion.div>
        )}
      </div>
    </Card>
  );
}
