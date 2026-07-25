import { memo } from "react";
import { Mic, Music2 } from "@/lib/icons";
import { SectionLabel, useSectionHints } from "../SectionLabel";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useGenerationStrings } from "@/hooks/useGenerationStrings";

interface VocalsToggleProps {
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onLyricsChange: (value: string) => void;
  compact?: boolean;
}

export const VocalsToggle = memo(function VocalsToggle({
  hasVocals,
  onHasVocalsChange,
  onLyricsChange,
  compact = false,
}: VocalsToggleProps) {
  const g = useGenerationStrings();
  const hints = useSectionHints();
  const haptic = useHapticFeedback();
  const handleChange = (value: boolean) => {
    if (value !== hasVocals) haptic.selectionChanged();
    onHasVocalsChange(value);
    if (!value) {
      onLyricsChange("");
    }
  };

  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      <SectionLabel label={g.form.trackType} hint={hints.trackType} />

      {/* Segmented control */}
      <div className="flex p-1 bg-muted/50 rounded-xl">
        <button
          type="button"
          onClick={() => handleChange(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] px-3",
            hasVocals
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <Mic className="w-4 h-4" />
          <span>{g.vocalToggle.vocalLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => handleChange(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] px-3",
            !hasVocals
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <Music2 className="w-4 h-4" />
          <span>{g.vocalToggle.instrumentalLabel}</span>
        </button>
      </div>

      {/* Contextual hint - only in non-compact mode */}
      {!compact && (
        <p className="text-[0.625rem] text-muted-foreground text-center">
          {hasVocals ? g.vocalToggle.withVocalsDesc : g.vocalToggle.instrumentalDesc}
        </p>
      )}
    </div>
  );
});
