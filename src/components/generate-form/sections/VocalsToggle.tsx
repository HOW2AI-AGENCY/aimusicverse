import { memo } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mic, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VocalsToggleProps {
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onLyricsChange: (value: string) => void;
}

export const VocalsToggle = memo(function VocalsToggle({
  hasVocals,
  onHasVocalsChange,
  onLyricsChange,
}: VocalsToggleProps) {
  const Icon = hasVocals ? Mic : Music2;
  
  return (
    <div className={cn(
      "p-4 rounded-xl border-2 transition-all duration-300",
      hasVocals 
        ? "border-primary/50 bg-primary/5" 
        : "border-border bg-muted/30"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            hasVocals 
              ? "bg-primary/20 text-primary" 
              : "bg-muted text-muted-foreground"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <Label 
              htmlFor="vocals-toggle" 
              className="cursor-pointer text-base font-semibold block"
            >
              {hasVocals ? 'Вокальный трек' : 'Инструментальный трек'}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasVocals 
                ? 'AI сгенерирует вокал по вашему тексту'
                : 'Только музыка, без голоса'
              }
            </p>
          </div>
        </div>
        <Switch
          id="vocals-toggle"
          checked={hasVocals}
          onCheckedChange={(checked) => {
            onHasVocalsChange(checked);
            if (!checked) {
              onLyricsChange('');
            }
          }}
        />
      </div>
      
      {/* Visual hint */}
      <div className={cn(
        "flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg mt-2 transition-colors",
        hasVocals 
          ? "bg-primary/10 text-primary" 
          : "bg-muted text-muted-foreground"
      )}>
        {hasVocals ? (
          <>
            <Mic className="w-3 h-3" />
            <span>Напишите или сгенерируйте текст песни ниже</span>
          </>
        ) : (
          <>
            <Music2 className="w-3 h-3" />
            <span>Получите чистый инструментал без вокала</span>
          </>
        )}
      </div>
    </div>
  );
});
