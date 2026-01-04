import { useCallback } from 'react';
import { motion } from '@/lib/motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Mic, Music2, Palette, Copy, X } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { SectionLabel, SECTION_HINTS } from './SectionLabel';
import { SmartPromptSuggestions } from './SmartPromptSuggestions';
import { FormSection, FormDivider } from './FormSection';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notifications';

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
  const handleCopy = useCallback(async () => {
    if (description) {
      await navigator.clipboard.writeText(description);
      notify.success('Скопировано');
    }
  }, [description]);
  
  const handleClear = useCallback(() => {
    onDescriptionChange('');
  }, [onDescriptionChange]);

  return (
    <motion.div
      key="simple"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-4 w-full max-w-full min-w-0 overflow-x-hidden"
    >
      {/* ========== TRACK TYPE SECTION ========== */}
      <FormSection>
        <div className="space-y-2">
          <SectionLabel 
            label="Тип трека"
            hint={SECTION_HINTS.trackType}
          />
          <div className="flex p-1 bg-muted/50 rounded-xl" role="group" aria-label="Тип трека">
            <button
              type="button"
              onClick={() => onHasVocalsChange(true)}
              aria-pressed={hasVocals}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                hasVocals 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Mic className="w-4 h-4" aria-hidden="true" />
              <span>Вокал</span>
            </button>
            <button
              type="button"
              onClick={() => onHasVocalsChange(false)}
              aria-pressed={!hasVocals}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                !hasVocals 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Music2 className="w-4 h-4" aria-hidden="true" />
              <span>Инструментал</span>
            </button>
          </div>
        </div>
      </FormSection>

      <FormDivider />

      {/* ========== DESCRIPTION SECTION ========== */}
      <FormSection>
        <div className="space-y-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <SectionLabel 
              label={hasVocals ? 'Опишите песню' : 'Опишите музыку'}
              hint={SECTION_HINTS.description}
            />
            <div className="flex items-center gap-1">
              {onOpenStyles && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 min-w-[28px] p-0 text-primary hover:text-primary/80"
                  onClick={onOpenStyles}
                  aria-label="Выбрать стиль музыки"
                >
                  <Palette className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBoostStyle}
                disabled={boostLoading || !description}
                className="h-7 px-2 gap-1 text-primary hover:text-primary/80"
                aria-label="Улучшить описание с помощью AI"
              >
                {boostLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="text-xs">AI</span>
              </Button>
            </div>
          </div>
          
          {/* Textarea with bottom toolbar */}
          <div className="relative">
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
                "resize-none text-sm pb-10 rounded-xl bg-muted/30 border-muted-foreground/20",
                "focus:border-primary/50 focus:ring-primary/20 transition-colors",
                description.length > 500 && "border-destructive focus-visible:ring-destructive"
              )}
            />
            
            {/* Bottom toolbar */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              {/* Character count */}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md bg-background/60 backdrop-blur-sm",
                description.length > 500 ? 'text-destructive font-medium' : 
                description.length > 400 ? 'text-yellow-500' : 'text-muted-foreground'
              )}>
                {description.length}/500
              </span>
              
              {/* Action buttons */}
              <div className="flex items-center gap-0.5 bg-background/60 backdrop-blur-sm rounded-md px-1">
                {description && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 min-w-[28px] p-0 text-muted-foreground hover:text-foreground"
                      onClick={handleCopy}
                      aria-label="Копировать описание"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 min-w-[28px] p-0 text-muted-foreground hover:text-destructive"
                      onClick={handleClear}
                      aria-label="Очистить описание"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <VoiceInputButton
                  onResult={onDescriptionChange}
                  context="description"
                  currentValue={description}
                  appendMode
                  className="h-6 w-6 p-0"
                />
              </div>
            </div>
          </div>

          {/* Smart Prompt Suggestions */}
          {!description && (
            <SmartPromptSuggestions
              onSelectPrompt={onDescriptionChange}
              currentPrompt={description}
              compact={true}
            />
          )}
          
          {description.length > 500 && (
            <p className="text-[10px] text-destructive">
              Сократите описание или переключитесь в Полный режим
            </p>
          )}
        </div>
      </FormSection>

      <FormDivider />

      {/* ========== TITLE SECTION ========== */}
      <FormSection>
        <div className="space-y-2">
          <SectionLabel 
            label="Название"
            htmlFor="simple-title"
            hint={SECTION_HINTS.title}
            suffix="(опционально)"
          />
          <Input
            id="simple-title"
            placeholder="Автогенерация если пусто"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="h-10 text-sm rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
      </FormSection>
    </motion.div>
  );
}
