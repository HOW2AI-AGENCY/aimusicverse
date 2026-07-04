import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, X, Check, Loader2, FileText, Rocket } from "@/lib/icons";
import { formatTime } from "@/lib/player-utils";
import type { AudioMode } from "./AudioActionModeTabsSection";

interface AnalysisResult {
  style?: string;
  genre?: string;
  mood?: string;
}

interface AudioActionPreviewSectionProps {
  mode: AudioMode;
  audioFile: File;
  audioUrl: string | null;
  audioDuration: number | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onRemove: () => void;
  onEnded: () => void;
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  extractedLyrics: string | null;
  hasVocals: boolean | null;
  isExtractingLyrics: boolean;
  onExtractLyrics: () => void;
  onOpenCoverDialog?: (file: File, mode: AudioMode) => void;
  onDirectGenerate: () => void;
  onConfirm: () => void;
}

/** Player + analysis result + lyrics extraction + confirm/cancel actions for the selected reference audio. */
export function AudioActionPreviewSection({
  mode,
  audioFile,
  audioUrl,
  audioDuration,
  audioRef,
  isPlaying,
  onTogglePlayback,
  onRemove,
  onEnded,
  isAnalyzing,
  analysisResult,
  extractedLyrics,
  hasVocals,
  isExtractingLyrics,
  onExtractLyrics,
  onOpenCoverDialog,
  onDirectGenerate,
  onConfirm,
}: AudioActionPreviewSectionProps) {
  return (
    <div className="space-y-3">
      {/* Audio Player - Compact */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
        <Button type="button" size="icon" variant="ghost" onClick={onTogglePlayback} className="h-11 w-11 shrink-0">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{audioFile.name}</p>
          {audioDuration && (
            <p className="text-[10px] text-muted-foreground">{formatTime(Math.floor(audioDuration))}</p>
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="h-7 w-7 min-h-[44px] min-w-[44px] shrink-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={onEnded} className="hidden" />}

      {/* Analysis Result - Compact */}
      {analysisResult && (
        <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium">Анализ завершён</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {analysisResult.genre && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {analysisResult.genre}
              </Badge>
            )}
            {analysisResult.mood && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {analysisResult.mood}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Waiting for analysis */}
      {!analysisResult && !isAnalyzing && (
        <div className="p-2 rounded-lg bg-muted/50 border space-y-1.5 text-center">
          <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Ожидание анализа...</span>
        </div>
      )}

      {/* Lyrics Extraction - Compact */}
      {mode !== "extend" && (
        <div className="space-y-2">
          {!extractedLyrics && hasVocals !== false && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-11 gap-2 text-xs"
              onClick={onExtractLyrics}
              disabled={isExtractingLyrics}
            >
              {isExtractingLyrics ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Извлекаем текст...
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3" />
                  Извлечь текст
                </>
              )}
            </Button>
          )}

          {hasVocals === false && (
            <p className="text-[10px] text-muted-foreground text-center">Инструментальный трек</p>
          )}

          {extractedLyrics && (
            <div className="p-2 rounded-lg bg-muted/50 border max-h-24 overflow-y-auto">
              <p className="text-[10px] font-mono whitespace-pre-wrap line-clamp-6">{extractedLyrics}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions - Compact */}
      <div className="space-y-2 pt-1">
        {/* Direct generation button - primary action - only show after analysis */}
        {onOpenCoverDialog && analysisResult && (
          <Button
            type="button"
            size="sm"
            onClick={onDirectGenerate}
            className="w-full h-10 gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            <Rocket className="w-4 h-4" />
            {mode === "cover" ? "Создать кавер" : "Расширить трек"}
          </Button>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onRemove} className="flex-1 h-11">
            Отменить
          </Button>
          {analysisResult && (
            <Button type="button" variant="secondary" size="sm" onClick={onConfirm} className="flex-1 h-11">
              В форму генерации
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
