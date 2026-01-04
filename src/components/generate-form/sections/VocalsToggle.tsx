import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Mic, Music2 } from 'lucide-react';
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

  if (compact) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Тип трека</Label>
        <div className="flex p-1 bg-muted/50 rounded-xl">
          <button
            type="button"
            onClick={() => handleChange(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              hasVocals 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Mic className="w-4 h-4" />
            <span className="hidden xs:inline">Вокал</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              !hasVocals 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Music2 className="w-4 h-4" />
            <span className="hidden xs:inline">Инструментал</span>
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Тип трека</Label>
      <div className="flex p-1 bg-muted/50 rounded-xl">
        <button
          type="button"
          onClick={() => handleChange(true)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
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
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
            !hasVocals 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Music2 className="w-4 h-4" />
          <span>Инструментал</span>
        </button>
      </div>
      
      {/* Hint text */}
      <p className="text-[10px] text-muted-foreground text-center">
        {hasVocals 
          ? '🎤 AI сгенерирует вокал по тексту песни' 
          : '🎹 Чистая музыка без голоса'
        }
      </p>
    </div>
  );
});
