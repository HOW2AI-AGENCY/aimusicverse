import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Mic, Music2, HelpCircle, Palette } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { GenerateFormHint, FORM_HINTS } from './GenerateFormHint';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SmartPromptSuggestions } from './SmartPromptSuggestions';
import { cn } from '@/lib/utils';

interface GenerateFormSimpleProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onBoostStyle: () => void;
  boostLoading: boolean;
  onOpenStyles?: () => void;
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
  onOpenStyles,
}: GenerateFormSimpleProps) {
  const [showHint, setShowHint] = useState(true);

  return (
    <motion.div
      key="simple"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-3"
    >
      {/* Vocals Toggle - Segmented control at top */}
      <div className="space-y-1">
        <Label className="text-xs font-medium">Тип трека</Label>
        <div className="flex p-1 bg-muted/50 rounded-xl">
          <button
            type="button"
            onClick={() => onHasVocalsChange(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
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
            onClick={() => onHasVocalsChange(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
              !hasVocals 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Music2 className="w-4 h-4" />
            <span>Инструментал</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              {hasVocals ? '🎤 Опишите песню' : '🎹 Опишите музыку'}
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
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-[10px]",
              description.length > 500 ? 'text-destructive font-medium' : 
              description.length > 400 ? 'text-yellow-500' : 'text-muted-foreground'
            )}>
              {description.length}/500
            </span>
            {onOpenStyles && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 text-primary hover:text-primary/80"
                onClick={onOpenStyles}
              >
                <Palette className="w-3.5 h-3.5" />
              </Button>
            )}
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
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span className="text-[10px]">AI</span>
            </Button>
          </div>
        </div>
        
        {/* Contextual hint */}
        <GenerateFormHint type="tip" show={showHint && !description}>
          {FORM_HINTS.description.empty}
        </GenerateFormHint>
        
        <Textarea
          id="description"
          placeholder={hasVocals 
            ? "Энергичный поп с запоминающимся припевом..." 
            : "Атмосферный эмбиент с синтезаторами..."
          }
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className={cn(
            "resize-none text-sm mt-1.5",
            description.length > 500 && "border-destructive focus-visible:ring-destructive"
          )}
        />

        {/* Smart Prompt Suggestions - horizontal scroll */}
        {!description && (
          <div className="mt-2 max-w-full">
            <SmartPromptSuggestions
              onSelectPrompt={onDescriptionChange}
              currentPrompt={description}
              compact={true}
            />
          </div>
        )}
        
        {description.length > 500 && (
          <p className="text-[10px] text-destructive mt-1">
            Сократите описание или переключитесь в Custom режим
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="simple-title" className="text-xs font-medium mb-1 block">
          Название <span className="text-muted-foreground text-[10px]">(опционально)</span>
        </Label>
        <Input
          id="simple-title"
          placeholder="Автогенерация если пусто"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
    </motion.div>
  );
}