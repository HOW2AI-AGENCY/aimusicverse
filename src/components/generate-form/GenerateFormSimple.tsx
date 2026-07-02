import { useCallback, useEffect, useRef } from "react";
import { motion } from "@/lib/motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Mic, Music2, Palette, Copy, X } from "@/lib/icons";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { SectionLabel, SECTION_HINTS } from "./SectionLabel";
import { SmartPromptSuggestions } from "./SmartPromptSuggestions";
import { FormSection, FormDivider } from "./FormSection";
import { ValidationMessage, validation } from "./ValidationMessage";
import { PromptValidationAlert } from "./PromptValidationAlert";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notifications";
import { useTelegram } from "@/contexts/TelegramContext";
import { useFeatureUsageTracking } from "@/hooks/analytics";
import { useExperiment } from "@/hooks/useExperiment";
import { EXPERIMENTS } from "@/lib/ab-testing";

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
  const { isControl: hidePromptSuggestions, trackConversion: trackSuggestionConversion } = useExperiment(
    EXPERIMENTS.PROMPT_SUGGESTIONS as unknown as Parameters<typeof useExperiment>[0],
  );

  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackFeature({
        feature: "generation_form",
        category: "generation",
        action: "view",
        metadata: { mode: "simple" },
      });
    }
  }, [trackFeature]);

  const handleCopy = useCallback(async () => {
    if (description) {
      await navigator.clipboard.writeText(description);
      notify.success("Скопировано");
    }
  }, [description]);

  const handleClear = useCallback(() => {
    hapticFeedback("light");
    onDescriptionChange("");
  }, [hapticFeedback, onDescriptionChange]);

  const handleVocalsToggle = useCallback(
    (value: boolean) => {
      hapticFeedback("light");
      onHasVocalsChange(value);
    },
    [hapticFeedback, onHasVocalsChange],
  );

  const handleBoostStyle = useCallback(() => {
    hapticFeedback("medium");
    trackAction("ai_boost", "generation", "click", { hasDescription: !!description });
    onBoostStyle();
  }, [hapticFeedback, onBoostStyle, trackAction, description]);

  const handleOpenStyles = useCallback(() => {
    hapticFeedback("light");
    trackAction("style_selector", "generation", "click");
    onOpenStyles?.();
  }, [hapticFeedback, onOpenStyles, trackAction]);

  const descriptionValidation = validation.description.getMessage(description.length, description);
  const titleValidation = validation.title.getMessage(title.length);
  const overLimit = description.length > 500;

  return (
    <motion.div
      key="simple"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-full min-w-0 overflow-x-hidden"
    >
      {/* ========== DESCRIPTION SECTION ========== */}
      <FormSection elevated>
        <div className="space-y-2">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <SectionLabel label={hasVocals ? "Опишите песню" : "Опишите музыку"} hint={SECTION_HINTS.description} />
            <div className="flex items-center gap-0.5 -mr-1">
              {onOpenStyles && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 min-w-9 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
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
                className="h-9 px-2.5 gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all disabled:opacity-40"
                aria-label="Улучшить описание с помощью AI"
                title={!description ? "Введите описание, чтобы использовать AI Boost" : undefined}
              >
                {boostLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="text-xs font-semibold">AI</span>
              </Button>
            </div>
          </div>

          {/* Textarea */}
          <Textarea
            id="description"
            placeholder={
              hasVocals ? "Энергичный поп с запоминающимся припевом..." : "Атмосферный эмбиент с синтезаторами..."
            }
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            className={cn(
              "resize-none text-[15px] leading-relaxed px-3.5 py-3 rounded-xl bg-muted/30 border-muted-foreground/20",
              "focus:border-primary/50 focus:ring-primary/20 transition-colors min-h-[112px]",
              overLimit && "border-destructive focus-visible:ring-destructive",
            )}
            aria-invalid={overLimit}
            aria-describedby={descriptionValidation ? "description-error" : undefined}
          />

          {/* Toolbar BELOW textarea — no overlap */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span
              className={cn(
                "text-[11px] tabular-nums transition-all duration-200",
                overLimit
                  ? "text-destructive font-bold"
                  : description.length > 400
                    ? "text-yellow-500 font-semibold"
                    : "text-muted-foreground/70 font-medium",
              )}
            >
              {description.length}/500
            </span>

            <div className="flex items-center gap-1">
              {description && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-w-11 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                    onClick={handleCopy}
                    aria-label="Копировать описание"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-w-11 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                    onClick={handleClear}
                    aria-label="Очистить описание"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              <VoiceInputButton
                onResult={onDescriptionChange}
                context="description"
                currentValue={description}
                appendMode
                className="h-11 w-11 min-w-11 p-0 rounded-lg"
              />
            </div>
          </div>

          {!description && !hidePromptSuggestions && (
            <SmartPromptSuggestions
              onSelectPrompt={(prompt) => {
                onDescriptionChange(prompt);
                trackSuggestionConversion("prompt_selected");
              }}
              currentPrompt={description}
              compact={true}
            />
          )}

          <PromptValidationAlert text={description} onApplyReplacement={onDescriptionChange} />

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

      {/* ========== TRACK TYPE — segmented control ========== */}
      <FormSection>
        <div className="space-y-2">
          <SectionLabel label="Тип трека" hint={SECTION_HINTS.trackType} />
          <div
            className="relative grid grid-cols-2 gap-1 p-1 h-11 bg-muted/40 rounded-full border border-border/50"
            role="radiogroup"
            aria-label="Тип трека"
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-br from-primary to-primary/85 shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)]"
              style={{ x: hasVocals ? 0 : "calc(100% + 4px)" }}
              aria-hidden="true"
            />
            <button
              type="button"
              role="radio"
              aria-checked={hasVocals}
              onClick={() => handleVocalsToggle(true)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 h-full rounded-full text-[13px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                hasVocals ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Mic className="w-4 h-4" aria-hidden="true" />
              Вокал
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={!hasVocals}
              onClick={() => handleVocalsToggle(false)}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 h-full rounded-full text-[13px] font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !hasVocals ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Music2 className="w-4 h-4" aria-hidden="true" />
              Инструментал
            </button>
          </div>
        </div>
      </FormSection>

      <FormDivider />

      {/* ========== TITLE SECTION ========== */}
      <FormSection>
        <div className="space-y-2">
          <SectionLabel label="Название" htmlFor="simple-title" hint={SECTION_HINTS.title} suffix="(опционально)" />
          <Input
            id="simple-title"
            placeholder="Автогенерация если пусто"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="min-h-[44px] text-[15px] rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
            aria-invalid={title.length > validation.title.maxLength}
            aria-describedby={titleValidation ? "simple-title-error" : undefined}
          />
          {titleValidation && (
            <ValidationMessage message={titleValidation.message} level={titleValidation.level} fieldId="simple-title" />
          )}
        </div>
      </FormSection>
    </motion.div>
  );
}
