import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2, Mic, Music, HelpCircle } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { GenerateFormHint, FORM_HINTS } from './GenerateFormHint';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GenerateFormSimpleProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onBoostStyle: () => void;
  boostLoading: boolean;
}

const QUICK_TAGS = [
  'Поп хит 🎤', 
  'Рок драйв 🎸', 
  'Lo-fi 🎧', 
  'Электро 🎹', 
  'Джаз 🎷', 
  'R&B 💜', 
  'Хип-хоп 🎤', 
  'Фолк 🪕', 
  'Инди 🎵'
];

export function GenerateFormSimple({
  description,
  onDescriptionChange,
  title,
  onTitleChange,
  hasVocals,
  onHasVocalsChange,
  onBoostStyle,
  boostLoading,
}: GenerateFormSimpleProps) {
  const [showHint, setShowHint] = useState(true);

  return (
    <div className="space-y-3">
      {/* Description Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Описание музыки
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    type="button" 
                    className="text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                    onClick={() => setShowHint(!showHint)}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {FORM_HINTS.description.tip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] tabular-nums ${
              description.length > 500 
                ? 'text-destructive font-medium' 
                : description.length > 400 
                  ? 'text-yellow-500' 
                  : 'text-muted-foreground'
            }`}>
              {description.length}/500
            </span>
            <VoiceInputButton
              onResult={onDescriptionChange}
              context="description"
              currentValue={description}
              appendMode
              className="h-6 w-6 p-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBoostStyle}
              disabled={boostLoading || !description}
              className="h-6 px-1.5 gap-0.5 text-primary hover:text-primary/80"
            >
              {boostLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="text-[11px]">AI</span>
            </Button>
          </div>
        </div>
        
        {/* Contextual hint */}
        <GenerateFormHint type="tip" show={showHint && !description}>
          {FORM_HINTS.description.empty}
        </GenerateFormHint>
        
        <Textarea
          id="description"
          placeholder="Энергичный рок с мощными гитарами..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className={`resize-none text-sm min-h-[68px] ${
            description.length > 500 ? 'border-destructive focus-visible:ring-destructive' : ''
          }`}
        />

        {description.length > 500 && (
          <p className="text-[11px] text-destructive mt-1">
            Сократите описание или переключитесь в Custom режим
          </p>
        )}

        {/* Quick style suggestions - horizontal scroll with proper mobile support */}
        {!description && (
          <div className="mt-2.5 -mx-3 px-3">
            <div 
              className="flex gap-1.5 pb-1 overflow-x-auto scrollbar-hide touch-pan-x"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory'
              }}
            >
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onDescriptionChange(tag.split(' ')[0])}
                  className="px-2.5 py-1 rounded-full text-[11px] bg-muted/60 hover:bg-primary/10 hover:text-primary active:bg-primary/20 transition-colors whitespace-nowrap shrink-0 touch-manipulation scroll-snap-align-start"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Title Field */}
      <div>
        <Label htmlFor="simple-title" className="text-xs font-medium mb-1.5 block">
          Название <span className="text-muted-foreground font-normal">(опционально)</span>
        </Label>
        <Input
          id="simple-title"
          placeholder="Автогенерация если пусто"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Vocals Toggle - Compact mobile-friendly design */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onHasVocalsChange(!hasVocals)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50 active:bg-muted/60 transition-all touch-manipulation"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  hasVocals 
                    ? 'bg-primary/15 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {hasVocals ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <Music className="w-4 h-4" />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <span className="text-sm font-medium block">
                    {hasVocals ? 'С вокалом' : 'Инструментал'}
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {hasVocals ? 'AI голос и текст' : 'Только музыка'}
                  </span>
                </div>
              </div>
              <Switch
                checked={hasVocals}
                onCheckedChange={onHasVocalsChange}
                className="shrink-0 pointer-events-none"
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px] text-xs">
            {hasVocals 
              ? 'Трек с AI-вокалом. Добавьте текст или он создастся автоматически.' 
              : 'Инструментальный трек — идеально для фоновой музыки.'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
