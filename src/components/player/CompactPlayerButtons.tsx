/**
 * CompactPlayerButtons — reusable button atoms for CompactPlayer.
 *
 * Extracted to keep CompactPlayer under the 500-LOC convention and make
 * the three layout variants (mobile/mid/desktop) easier to read.
 *
 * Pure presentation: all behaviour comes from props/handlers.
 */
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronUp,
  X,
  Heart,
  Volume2,
  VolumeX,
  Volume1,
  Loader2,
  AlertCircle,
} from "@/lib/icons";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type CompactVariant = "mobile" | "mid" | "desktop";

const TOUCH = "min-h-[44px] min-w-[44px]";
const ROUND = "rounded-full hover:bg-muted/50 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100";

interface PlayProps {
  variant: CompactVariant;
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  playbackError?: string | null;
  onClick: (e: React.MouseEvent) => void;
}

export const PlayBtn = memo(function PlayBtn({
  variant,
  isPlaying,
  isLoading,
  hasError,
  playbackError,
  onClick,
}: PlayProps) {
  const iconSize = variant === "desktop" ? "h-6 w-6" : "h-5 w-5";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "rounded-full bg-primary/10 hover:bg-primary/20 hover:scale-105 active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:scale-100",
        variant === "desktop" ? "h-12 w-12" : "h-11 w-11",
        TOUCH,
        hasError && "bg-destructive/15 hover:bg-destructive/25",
      )}
      aria-label={
        hasError
          ? `Ошибка: ${playbackError || "не удалось загрузить"}`
          : isLoading
            ? "Загрузка трека"
            : isPlaying
              ? "Пауза"
              : "Воспроизвести"
      }
      aria-busy={isLoading}
      aria-pressed={isPlaying}
      title={hasError ? playbackError || "Ошибка воспроизведения" : undefined}
      data-testid="compact-player-play"
    >
      {hasError ? (
        <AlertCircle className={cn("text-destructive", iconSize)} aria-hidden="true" />
      ) : isLoading ? (
        <Loader2 className={cn("animate-spin motion-reduce:animate-none", iconSize)} aria-hidden="true" />
      ) : isPlaying ? (
        <Pause className={iconSize} fill="currentColor" aria-hidden="true" />
      ) : (
        <Play className={cn("ml-0.5", iconSize)} fill="currentColor" aria-hidden="true" />
      )}
    </Button>
  );
});

interface NavProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export const NextBtn = memo(function NextBtn({ onClick, disabled }: NavProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-10 w-10", TOUCH, ROUND, "hover:scale-105 motion-reduce:hover:scale-100", disabled && "opacity-40")}
      aria-label="Следующий трек"
    >
      <SkipForward className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
});

export const PrevBtn = memo(function PrevBtn({ onClick }: NavProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("h-10 w-10", TOUCH, ROUND, "hover:scale-105 motion-reduce:hover:scale-100")}
      aria-label="Предыдущий трек"
    >
      <SkipBack className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
});

export const CloseBtn = memo(function CloseBtn({ onClick }: NavProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-10 w-10 rounded-full hover:bg-destructive/15 hover:text-destructive active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100",
        TOUCH,
      )}
      aria-label="Закрыть плеер"
      data-testid="compact-player-close"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
});

interface LikeProps extends NavProps {
  isLiked: boolean;
}

export const LikeBtn = memo(function LikeBtn({ onClick, isLiked }: LikeProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("h-10 w-10", TOUCH, ROUND)}
      aria-label={isLiked ? "Убрать из избранного" : "В избранное"}
      aria-pressed={isLiked}
    >
      <Heart className={cn("h-4 w-4", isLiked && "fill-primary text-primary")} aria-hidden="true" />
    </Button>
  );
});

export const ExpandBtn = memo(function ExpandBtn({ onClick }: NavProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("h-10 w-10", TOUCH, ROUND)}
      aria-label="Развернуть плеер"
    >
      <ChevronUp className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
});

interface VolumeProps {
  volume: number;
  setVolume: (v: number) => void;
}

export const VolumeControl = memo(function VolumeControl({ volume, setVolume }: VolumeProps) {
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          className={cn("h-10 w-10 rounded-full hover:bg-muted/50 transition-all motion-reduce:transition-none", TOUCH)}
          aria-label={`Громкость ${Math.round(volume * 100)}%`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-44 p-3" onClick={(e) => e.stopPropagation()}>
        <Slider
          value={[Math.round(volume * 100)]}
          onValueChange={(v) => setVolume(v[0] / 100)}
          min={0}
          max={100}
          step={1}
          aria-label="Уровень громкости"
        />
        <div className="mt-2 text-center text-xs tabular-nums text-muted-foreground">{Math.round(volume * 100)}%</div>
      </PopoverContent>
    </Popover>
  );
});
