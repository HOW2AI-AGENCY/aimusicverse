import { memo, useCallback } from "react";
import { Music, MicVocal, FolderOpen, AudioLines } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useGenerationStrings } from "@/hooks/useGenerationStrings";

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
        "group relative flex flex-col items-center justify-center gap-1 min-h-[56px] sm:min-h-[60px] px-1.5 sm:px-2 rounded-xl",
        "border transition-all duration-200 touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "hover:shadow-sm",
        accent
          ? "bg-primary/10 border-primary/30 hover:bg-primary/15 hover:border-primary/50"
          : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border",
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
          "text-[0.6875rem] leading-none font-semibold truncate max-w-full transition-colors",
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
  const g = useGenerationStrings();
  const log = useCallback((label: string, fn: () => void) => {
    logger.info("[GenerateFormActions] chip clicked", { label });
    fn();
  }, []);
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2" role="group" aria-label={g.actions.groupLabel}>
      <ActionChip
        icon={AudioLines}
        label={g.actions.audio}
        onClick={() => log("audio", onOpenAudioDialog)}
        ariaLabel={g.actions.addAudioReference}
      />
      <ActionChip
        icon={MicVocal}
        label={g.actions.voice}
        onClick={() => log("voice", onOpenVoiceClone)}
        ariaLabel={g.actions.cloneVoice}
      />
      <ActionChip
        icon={Music}
        label={g.actions.persona}
        onClick={() => log("artist", onOpenArtistDialog)}
        ariaLabel={g.actions.selectAiPersona}
      />
      <ActionChip
        icon={FolderOpen}
        label={g.actions.project}
        onClick={() => log("project", onOpenProjectDialog)}
        ariaLabel={g.actions.selectProject}
      />
    </div>
  );
}
