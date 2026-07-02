import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Mic, Music2, Palette, Copy, X, ChevronDown } from "@/lib/icons";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { SectionLabel, SECTION_HINTS } from "./SectionLabel";
import { SmartPromptSuggestions } from "./SmartPromptSuggestions";
import { FormSection, FormDivider } from "./FormSection";
import { ValidationMessage, validation } from "./ValidationMessage";
import { PromptValidationAlert } from "./PromptValidationAlert";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/notifications";
import { useTelegram } from "@/contexts/TelegramContext";
import { useFeatureUsageTracking, FeatureEvents } from "@/hooks/analytics";
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

  // Track form view once on mount
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

  // Haptic feedback for track type toggle (T045)
  const handleVocalsToggle = useCallback(
    (value: boolean) => {
      hapticFeedback("light");
      onHasVocalsChange(value);
    },
    [hapticFeedback, onHasVocalsChange],
  );

  // Haptic feedback for boost style (T045)
  const handleBoostStyle = useCallback(() => {
    hapticFeedback("medium");
    trackAction("ai_boost", "generation", "click", { hasDescription: !!description });
    onBoostStyle();
  }, [hapticFeedback, onBoostStyle, trackAction, description]);

  // Haptic feedback for open styles (T045)
  const handleOpenStyles = useCallback(() => {
    hapticFeedback("light");
    trackAction("style_selector", "generation", "click");
    onOpenStyles?.();
  }, [hapticFeedback, onOpenStyles, trackAction]);

  // Collapsible "Тип трека" section (persisted, default collapsed)
  const [trackTypeOpen, setTrackTypeOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("gen_form_track_type_open") === "1";
    } catch {
      return false;
    }
  });
  const toggleTrackType = useCallback(() => {
    hapticFeedback("light");
    setTrackTypeOpen((v) => {
      const nv = !v;
      try {
        localStorage.setItem("gen_form_track_type_open", nv ? "1" : "0");
      } catch {}
      return nv;
    });
  }, [hapticFeedback]);

  // Validation messages - now pass text for artist checking
  const descriptionValidation = validation.description.getMessage(description.length, description);
  const titleValidation = validation.title.getMessage(title.length);

  return (
    <motion.div
      key="simple"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-4 lg:space-y-5 w-full max-w-full min-w-0 overflow-x-hidden"
    >
      {/* ========== TRACK TYPE SECTION ========== */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
      >
        <FormSection>
          <div className="space-y-2">
            <button
              type="button"
              onClick={toggleTrackType}
              aria-expanded={trackTypeOpen}
              aria-controls="track-type-panel"
              className="w-full flex items-center justify-between gap-2 min-h-[40px] px-2 -mx-1 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <SectionLabel label="Тип трека" hint={SECTION_HINTS.trackType} />
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                    "bg-primary/15 text-primary border border-primary/25",
                  )}
                >
                  {hasVocals ? <Mic className="w-3 h-3" /> : <Music2 className="w-3 h-3" />}
                  {hasVocals ? "Вокал" : "Инструментал"}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                  trackTypeOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence initial={false}>
              {trackTypeOpen && (
                <motion.div
                  id="track-type-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className="grid grid-cols-2 gap-2 p-1 bg-muted/40 rounded-2xl border border-border/50 mt-1"
                    role="radiogroup"
                    aria-label="Тип трека"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={hasVocals}
                      onClick={() => handleVocalsToggle(true)}
                      className={cn(
                        "flex items-center justify-center gap-2 min-h-[44px] lg:min-h-[52px] px-3 lg:px-4 rounded-xl text-sm lg:text-base font-semibold transition-colors duration-200 motion-reduce:transition-none",
                        hasVocals
                          ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.45)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <Mic className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Вокал</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!hasVocals}
                      onClick={() => handleVocalsToggle(false)}
                      className={cn(
                        "flex items-center justify-center gap-2 min-h-[44px] lg:min-h-[52px] px-3 lg:px-4 rounded-xl text-sm lg:text-base font-semibold transition-colors duration-200 motion-reduce:transition-none",
                        !hasVocals
                          ? "bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.45)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <Music2 className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" aria-hidden="true" />
                      <span className="truncate">Инструментал</span>
                    </button>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FormSection>
      </motion.div>

      <FormDivider />

      {/* ========== DESCRIPTION SECTION ========== */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
      >
        <FormSection>
          <div className="space-y-2 lg:space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <SectionLabel label={hasVocals ? "Опишите песню" : "Опишите музыку"} hint={SECTION_HINTS.description} />
              <div className="flex items-center gap-1 lg:gap-2">
                {onOpenStyles && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 lg:h-12 lg:w-12 min-w-[44px] p-0 text-primary hover:text-primary/80 hover:scale-105 transition-transform"
                    onClick={handleOpenStyles}
                    aria-label="Выбрать стиль музыки"
                  >
                    <Palette className="w-4 h-4 lg:w-5 lg:h-5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBoostStyle}
                  disabled={boostLoading || !description}
                  className="h-11 lg:h-12 px-3 lg:px-4 gap-1.5 text-primary hover:text-primary/80 hover:scale-105 transition-transform"
                  aria-label="Улучшить описание с помощью AI"
                >
                  {boostLoading ? (
                    <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="w-4 h-4 lg:w-5 lg:h-5" aria-hidden="true" />
                  )}
                  <span className="text-xs lg:text-sm">AI</span>
                </Button>
              </div>
            </div>

            {/* Textarea with bottom toolbar */}
            <div className="relative">
              <Textarea
                id="description"
                placeholder={
                  hasVocals ? "Энергичный поп с запоминающимся припевом..." : "Атмосферный эмбиент с синтезаторами..."
                }
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={3}
                className={cn(
                  "resize-none text-sm lg:text-base pb-10 lg:pb-12 rounded-xl lg:rounded-2xl bg-muted/30 border-muted-foreground/20",
                  "focus:border-primary/50 focus:ring-primary/20 transition-colors lg:min-h-[120px]",
                  description.length > 500 && "border-destructive focus-visible:ring-destructive",
                )}
                aria-invalid={description.length > 500}
                aria-describedby={descriptionValidation ? "description-error" : undefined}
              />

              {/* Bottom toolbar */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                {/* Character count */}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md bg-background/60 backdrop-blur-sm",
                    description.length > 500
                      ? "text-destructive font-medium"
                      : description.length > 400
                        ? "text-yellow-500"
                        : "text-muted-foreground",
                  )}
                >
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

            {/* Smart Prompt Suggestions — A/B tested (PROMPT_SUGGESTIONS experiment) */}
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

            {/* Artist name warning with replacement suggestions */}
            <PromptValidationAlert text={description} onApplyReplacement={onDescriptionChange} />

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
      </motion.div>

      <FormDivider />

      {/* ========== TITLE SECTION ========== */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.12 }}
      >
        <FormSection>
          <div className="space-y-2 lg:space-y-3">
            <SectionLabel label="Название" htmlFor="simple-title" hint={SECTION_HINTS.title} suffix="(опционально)" />
            <Input
              id="simple-title"
              placeholder="Автогенерация если пусто"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="min-h-[44px] lg:min-h-[52px] text-sm lg:text-base rounded-xl lg:rounded-2xl bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20"
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
    </motion.div>
  );
}
