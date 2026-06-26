import { memo } from "react";
import { Music, MicVocal, FolderOpen, AudioLines } from "@/lib/icons";
import { cn } from "@/lib/utils";

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
        "group flex flex-col items-center justify-center gap-1 min-h-[56px] px-2 rounded-xl",
        "border transition-all duration-200 active:scale-[0.97] touch-manipulation",
        accent
          ? "bg-primary/8 border-primary/25 hover:bg-primary/12 hover:border-primary/40"
          : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border",
      )}
    >
      <Icon
        className={cn(
          "w-[18px] h-[18px] transition-transform group-hover:scale-110",
          accent ? "text-primary" : "text-muted-foreground",
        )}
        aria-hidden="true"
      />
      <span className="text-[11px] leading-none font-semibold text-foreground/90 truncate max-w-full">{label}</span>
    </button>
  );
});

export function GenerateFormActions({
  onOpenAudioDialog,
  onOpenProjectDialog,
  onOpenArtistDialog,
  onOpenVoiceClone,
}: GenerateFormActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Источники и референсы">
      <ActionChip icon={AudioLines} label="Аудио" onClick={onOpenAudioDialog} ariaLabel="Добавить аудио референс" />
      <ActionChip icon={MicVocal} label="Голос" onClick={onOpenVoiceClone} ariaLabel="Клонировать голос" accent />
      <ActionChip icon={Music} label="Персона" onClick={onOpenArtistDialog} ariaLabel="Выбрать AI персону" />
      <ActionChip icon={FolderOpen} label="Проект" onClick={onOpenProjectDialog} ariaLabel="Выбрать проект" />
    </div>
  );
}
