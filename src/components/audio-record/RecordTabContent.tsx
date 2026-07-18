/**
 * RecordTabContent — Recording UI with animated microphone
 *
 * Extracted from AudioRecordDialog to reduce the 715-line component.
 */
import { Mic, Square, Play, Pause, Trash2, Cloud, Loader2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import type { RecordingState } from "./useAudioRecordDialog";

interface RecordTabContentProps {
  state: RecordingState;
  duration: number;
  audioUrl: string | null;
  isPlaying: boolean;
  isAutoSaving: boolean;
  autoSavedUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  formatTime: (seconds: number) => string;
  onStart: () => void;
  onStop: () => void;
  onTogglePlayback: () => void;
  onReset: () => void;
  onPlaybackEnded: () => void;
}

export function RecordTabContent({
  state,
  duration,
  audioUrl,
  isPlaying,
  isAutoSaving,
  autoSavedUrl,
  audioRef,
  formatTime,
  onStart,
  onStop,
  onTogglePlayback,
  onReset,
  onPlaybackEnded,
}: RecordTabContentProps) {
  return (
    <div className="space-y-6">
      {/* Recording visualization */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className={cn(
            "relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center",
            state === "recording" && "bg-destructive/10",
            state === "recorded" && "bg-primary/10",
            state === "idle" && "bg-muted",
          )}
          animate={state === "recording" ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          {state === "recording" && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-destructive/20"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-destructive/20"
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
              />
            </>
          )}

          <Mic
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12",
              state === "recording" && "text-destructive",
              state === "recorded" && "text-primary",
              state === "idle" && "text-muted-foreground",
            )}
          />
        </motion.div>

        <div className="text-xl sm:text-2xl font-mono font-bold">{formatTime(duration)}</div>

        {/* Auto-save indicator */}
        {state === "recorded" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isAutoSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Сохранение в облако...</span>
              </>
            ) : autoSavedUrl ? (
              <>
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600">Сохранено в облако</span>
              </>
            ) : null}
          </div>
        )}

        {state === "recorded" && audioUrl && (
          <audio ref={audioRef} src={audioUrl} onEnded={onPlaybackEnded} className="hidden" />
        )}
      </div>

      {/* Controls - touch-friendly 48px+ targets */}
      <div className="flex justify-center gap-3">
        {state === "idle" && (
          <Button size="lg" onClick={onStart} className="gap-2 h-12 sm:h-11 px-6 text-sm sm:text-base">
            <Mic className="w-5 h-5" />
            Начать запись
          </Button>
        )}

        {state === "recording" && (
          <Button
            size="lg"
            variant="destructive"
            onClick={onStop}
            className="gap-2 h-12 sm:h-11 px-6 text-sm sm:text-base"
          >
            <Square className="w-5 h-5" />
            Остановить
          </Button>
        )}

        {state === "recorded" && (
          <>
            <Button
              size="icon"
              variant="outline"
              onClick={onTogglePlayback}
              className="w-12 h-12 sm:w-11 sm:h-11"
              aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={onReset}
              className="w-12 h-12 sm:w-11 sm:h-11"
              aria-label="Удалить запись"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </>
        )}
      </div>

      {/* First-time hint */}
      {state === "idle" && (
        <p className="text-center text-xs text-muted-foreground/80 px-4">
          💡 Запишите вокал или мелодию, а AI создаст профессиональный аккомпанемент
        </p>
      )}
    </div>
  );
}
