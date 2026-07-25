/**
 * RealtimeChordVisualizer - Real-time chord detection visualization
 * Shows detected chord, chromagram, and chord history
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Mic, MicOff, Trash2, Copy, Volume2, Music2, Guitar, Lightbulb, VolumeX, ClipboardCopy } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRealtimeChordDetection } from "@/hooks/useRealtimeChordDetection";
import { getChordColor, getChordNotes } from "@/lib/chord-detection";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RealtimeChordVisualizerProps {
  onProgressionExport?: (progression: string) => void;
  className?: string;
}

const NOTE_LABELS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const RealtimeChordVisualizer = memo(function RealtimeChordVisualizer({
  onProgressionExport,
  className,
}: RealtimeChordVisualizerProps) {
  const haptic = useHapticFeedback();
  const [showGuide, setShowGuide] = useState(false);

  const {
    currentChord,
    chordHistory,
    chromagram,
    isListening,
    isInitializing,
    error,
    volume,
    startListening,
    stopListening,
    clearHistory,
    exportProgression,
  } = useRealtimeChordDetection({
    onChordChange: () => {
      // Chord changed - haptic already handled in hook
    },
  });

  const handleToggleListening = () => {
    haptic.tap();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleCopyProgression = () => {
    const progression = exportProgression();
    if (progression) {
      navigator.clipboard.writeText(progression);
      toast.success("Прогрессия скопирована");
      haptic.success();
      onProgressionExport?.(progression);
    } else {
      toast.error("Нет аккордов для копирования");
    }
  };

  const chordNotes = currentChord ? getChordNotes(currentChord.name) : [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="lg"
          className="gap-2 flex-1"
          onClick={handleToggleListening}
          disabled={isInitializing}
        >
          {isInitializing ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Подключение...
            </>
          ) : isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              Остановить
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              Слушать
            </>
          )}
        </Button>

        {chordHistory.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleCopyProgression}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                clearHistory();
                haptic.tap();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Volume indicator */}
      {isListening && (
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Progress value={volume * 100} className="h-2 flex-1" />
        </div>
      )}

      {/* Main chord display */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {currentChord && currentChord.name !== "N/C" ? (
              <motion.div
                key={currentChord.name}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="text-center"
              >
                {/* Chord name */}
                <div
                  className="text-6xl sm:text-7xl font-bold mb-2"
                  style={{ color: getChordColor(currentChord.quality) }}
                >
                  {currentChord.name}
                </div>

                {/* Confidence dots */}
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: 1,
                        opacity: i < Math.floor(currentChord.confidence * 5) ? 1 : 0.2,
                      }}
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getChordColor(currentChord.quality),
                      }}
                    />
                  ))}
                </div>

                {/* Chord notes */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {chordNotes.map((note) => (
                    <Badge key={note} variant="outline" className="text-sm">
                      {note}
                    </Badge>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  {currentChord.quality === "major" && "Мажор"}
                  {currentChord.quality === "minor" && "Минор"}
                  {currentChord.quality === "7" && "Септаккорд"}
                  {currentChord.quality === "sus4" && "Sus4"}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                {isListening ? (
                  <Mic className="w-10 h-10 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
                ) : (
                  <Guitar className="w-10 h-10 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
                )}
                <p className="text-muted-foreground">
                  {isListening ? "Сыграйте аккорд..." : 'Нажмите "Слушать" для начала'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Chromagram visualization */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium">Хромаграмма</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex justify-between gap-1 h-24">
            {chromagram.map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="flex-1 w-full flex items-end">
                  <motion.div
                    className="w-full rounded-t-sm"
                    animate={{
                      height: `${value * 100}%`,
                      backgroundColor: chordNotes.includes(NOTE_LABELS[index])
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground) / 0.3)",
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[0.625rem] mt-1",
                    chordNotes.includes(NOTE_LABELS[index]) ? "text-primary font-bold" : "text-muted-foreground",
                  )}
                >
                  {NOTE_LABELS[index]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chord history */}
      {chordHistory.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              История аккордов
              <Badge variant="secondary" className="text-xs">
                {chordHistory.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              {chordHistory.map((chord, index) => (
                <motion.div
                  key={`${chord.name}-${index}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant="outline"
                    className="text-sm py-1 px-3"
                    style={{
                      borderColor: getChordColor(chord.quality),
                      color: getChordColor(chord.quality),
                    }}
                  >
                    {chord.name}
                  </Badge>
                </motion.div>
              ))}
            </div>

            {/* Progression string */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Прогрессия:</p>
              <p className="text-sm font-mono">
                {chordHistory
                  .slice()
                  .reverse()
                  .map((c) => c.name)
                  .join(" → ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <button
        className="w-full text-xs text-muted-foreground text-center py-2"
        onClick={() => setShowGuide(!showGuide)}
      >
        {showGuide ? "Скрыть советы ▲" : "Показать советы ▼"}
      </button>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <Card className="bg-muted/30">
              <CardContent className="py-4 text-sm text-muted-foreground space-y-2">
                <p className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Играйте аккорды чётко и держите их 1-2 секунды
                </p>
                <p className="flex items-center gap-2">
                  <Guitar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Лучше всего работает с акустической гитарой
                </p>
                <p className="flex items-center gap-2">
                  <VolumeX className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Минимизируйте фоновый шум для точности
                </p>
                <p className="flex items-center gap-2">
                  <ClipboardCopy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Нажмите копировать для сохранения прогрессии
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
