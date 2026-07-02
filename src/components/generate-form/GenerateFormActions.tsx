import { memo, useCallback } from "react";
import { Music, MicVocal, FolderOpen, AudioLines } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface GenerateFormActionsProps {
  onOpenAudioDialog: () => void;
  onOpenProjectDialog: () => void;
  onOpenArtistDialog: () => void;
  onOpenVoiceClone: () => void;
}

interface ChipProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  ariaLabel: string;
  accent?: boolean;
}

const ActionChip = memo(function ActionChip({ icon: Icon, label, onClick, ariaLabel, accent }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-1 min-h-[60px] px-2 rounded-xl",
        "border transition-all duration-200 active:scale-[0.96] touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-8px_hsl(var(--primary)/0.35)]",
        accent
          ? "bg-primary/10 border-primary/30 hover:bg-primary/15 hover:border-primary/50"
          : "bg-muted/30 border-border/50 hover:bg-primary/8 hover:border-primary/40",
      )}
    >
      <Icon
        className={cn(
          "w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110 group-active:scale-95",
          accent ? "text-primary" : "text-muted-foreground group-hover:text-primary",
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          "text-[11px] leading-none font-semibold truncate max-w-full transition-colors",
          accent ? "text-foreground" : "text-foreground/90 group-hover:text-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
});

export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenProjectDialog,
  onOpenArtistDialog,
  onOpenVoiceClone,
}: GenerateFormActionsProps) {
  const log = useCallback((label: string, fn: () => void) => {
    logger.info("[GenerateFormActions] chip clicked", { label });
    fn();
  }, []);
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Источники и референсы">
      <ActionChip
        icon={AudioLines}
        label="Аудио"
        onClick={() => log("audio", onOpenAudioDialog)}
        ariaLabel="Добавить аудио референс"
      />
      <ActionChip
        icon={MicVocal}
        label="Голос"
        onClick={() => log("voice", onOpenVoiceClone)}
        ariaLabel="Клонировать голос"
      />
      <ActionChip
        icon={Music}
        label="Персона"
        onClick={() => log("artist", onOpenArtistDialog)}
        ariaLabel="Выбрать AI персону"
      />
      <ActionChip
        icon={FolderOpen}
        label="Проект"
        onClick={() => log("project", onOpenProjectDialog)}
        ariaLabel="Выбрать проект"
      />
    </div>
  );
}
