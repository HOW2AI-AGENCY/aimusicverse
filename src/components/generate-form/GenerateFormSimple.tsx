import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2, Mic, HelpCircle } from 'lucide-react';
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
                    className="text-muted-foreground hover:text-foreground transition-colors"
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
          <div className="flex items-center gap-2">
            <span className={`text-xs ${description.length > 500 ? 'text-destructive font-medium' : description.length > 400 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
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
              className="h-6 px-2 gap-1 text-primary hover:text-primary/80"
            >
              {boostLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span className="text-xs">AI Boost</span>
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
          rows={4}
          className={`resize-none text-sm mt-2 ${description.length > 500 ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />

        {description.length > 500 && (
          <p className="text-xs text-destructive mt-1">
            Сократите описание или переключитесь в Custom режим
          </p>
        )}

        {/* Quick style suggestions - horizontal scroll */}
        {!description && (
          <div className="mt-2 -mx-4 px-4">
            <div 
              className="flex gap-2 pb-2 overflow-x-auto"
              style={{ 
                scrollbarWidth: 'none', 
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {['Поп хит 🎤', 'Рок драйв 🎸', 'Lo-fi chill 🎧', 'Электро 🎹', 'Джаз 🎷', 'R&B 💜', 'Хип-хоп 🎤', 'Фолк 🪕', 'Инди 🎵'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onDescriptionChange(tag.split(' ')[0])}
                  className="px-3 py-1.5 rounded-full text-xs bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors whitespace-nowrap shrink-0"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="simple-title" className="text-xs font-medium mb-1.5 block">
          Название <span className="text-muted-foreground">(опционально)</span>
        </Label>
        <Input
          id="simple-title"
          placeholder="Автогенерация если пусто"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Vocals Toggle for Simple Mode */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <Label htmlFor="simple-vocals-toggle" className="cursor-pointer text-sm font-medium">
              С вокалом
            </Label>
            <p className="text-xs text-muted-foreground truncate">
              {hasVocals ? 'AI сгенерирует голос' : 'Инструментал без вокала'}
            </p>
          </div>
        </div>
        <Switch
          id="simple-vocals-toggle"
          checked={hasVocals}
          onCheckedChange={onHasVocalsChange}
        />
      </div>
    </div>
  );
}