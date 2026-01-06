import { memo } from 'react';
import { Mic, Music2 } from 'lucide-react';
import { SectionLabel, SECTION_HINTS } from '../SectionLabel';
import { cn } from '@/lib/utils';

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
  const handleChange = (value: boolean) => {
    onHasVocalsChange(value);
    if (!value) {
      onLyricsChange('');
    }
  };

  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      <SectionLabel 
        label="Тип трека"
        hint={SECTION_HINTS.trackType}
      />
      
      {/* Segmented control */}
      <div className="flex p-1 bg-muted/50 rounded-xl">
        <button
          type="button"
          onClick={() => handleChange(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] px-3",
            hasVocals 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Mic className="w-4 h-4" />
          <span>Вокал</span>
        </button>
        <button
          type="button"
          onClick={() => handleChange(false)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] px-3",
            !hasVocals 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Music2 className="w-4 h-4" />
          <span>Инструментал</span>
        </button>
      </div>
      
      {/* Contextual hint - only in non-compact mode */}
      {!compact && (
        <p className="text-[10px] text-muted-foreground text-center">
          {hasVocals 
            ? 'AI сгенерирует вокал по тексту песни' 
            : 'Чистая музыка без голоса'
          }
        </p>
      )}
    </div>
  );
});