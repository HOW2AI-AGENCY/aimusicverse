import { useCallback, useEffect, useRef } from 'react';
import { motion } from '@/lib/motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Mic, Music2, Palette, Copy, X } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { SectionLabel, SECTION_HINTS } from './SectionLabel';
import { SmartPromptSuggestions } from './SmartPromptSuggestions';
import { FormSection, FormDivider } from './FormSection';
import { ValidationMessage, validation } from './ValidationMessage';
import { PromptValidationAlert } from './PromptValidationAlert';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/notifications';
import { useTelegram } from '@/contexts/TelegramContext';
import { useFeatureUsageTracking, FeatureEvents } from '@/hooks/analytics';

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
  const { hapticFeedback } = useTelegram();
  const { trackFeature, trackAction } = useFeatureUsageTracking();
  const hasTrackedView = useRef(false);

  // Track form view once on mount
  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackFeature({
        feature: 'generation_form',
        category: 'generation',
        action: 'view',
        metadata: { mode: 'simple' },
      });
    }
  }, [trackFeature]);

  const handleCopy = useCallback(async () => {
    if (description) {
      await navigator.clipboard.writeText(description);
      notify.success('Скопировано');
    }
  }, [description]);

  const handleClear = useCallback(() => {
    hapticFeedback('light');
    onDescriptionChange('');
  }, [hapticFeedback, onDescriptionChange]);

  // Haptic feedback for track type toggle (T045)
  const handleVocalsToggle = useCallback((value: boolean) => {
    hapticFeedback('light');
    onHasVocalsChange(value);
  }, [hapticFeedback, onHasVocalsChange]);

  // Haptic feedback for boost style (T045)
  const handleBoostStyle = useCallback(() => {
    hapticFeedback('medium');
    trackAction('ai_boost', 'generation', 'click', { hasDescription: !!description });
    onBoostStyle();
  }, [hapticFeedback, onBoostStyle, trackAction, description]);

  // Haptic feedback for open styles (T045)
  const handleOpenStyles = useCallback(() => {
    hapticFeedback('light');
    trackAction('style_selector', 'generation', 'click');
    onOpenStyles?.();
  }, [hapticFeedback, onOpenStyles, trackAction]);

  // Validation messages - now pass text for artist checking
  const descriptionValidation = validation.description.getMessage(description.length, description);
  const titleValidation = validation.title.getMessage(title.length);

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
              onClick={() => handleVocalsToggle(true)}
              aria-pressed={hasVocals}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg text-sm font-medium transition-all duration-200",
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
              onClick={() => handleVocalsToggle(false)}
              aria-pressed={!hasVocals}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg text-sm font-medium transition-all duration-200",
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
                  className="h-11 w-11 min-w-[44px] p-0 text-primary hover:text-primary/80"
                  onClick={handleOpenStyles}
                  aria-label="Выбрать стиль музыки"
                >
                  <Palette className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBoostStyle}
                disabled={boostLoading || !description}
                className="h-11 px-3 gap-1.5 text-primary hover:text-primary/80"
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
              aria-invalid={description.length > 500}
              aria-describedby={descriptionValidation ? "description-error" : undefined}
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
                      className="h-11 w-11 min-w-[44px] p-0 text-muted-foreground hover:text-foreground"
                      onClick={handleCopy}
                      aria-label="Копировать описание"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 min-w-[44px] p-0 text-muted-foreground hover:text-destructive"
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
                  className="h-11 w-11 min-w-[44px] p-0"
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
          
          {/* Artist name warning with replacement suggestions */}
          <PromptValidationAlert
            text={description}
            onApplyReplacement={onDescriptionChange}
          />
          
          {/* Validation message */}
          {descriptionValidation && (
            <ValidationMessage
              message={descriptionValidation.message}
              level={descriptionValidation.level}
              fieldId="description"
            />
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
            className="min-h-[44px] text-sm rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
            aria-invalid={title.length > validation.title.maxLength}
            aria-describedby={titleValidation ? "simple-title-error" : undefined}
          />
          
          {/* Validation message */}
          {titleValidation && (
            <ValidationMessage
              message={titleValidation.message}
              level={titleValidation.level}
              fieldId="simple-title"
            />
          )}
        </div>
      </FormSection>
    </motion.div>
  );
}
