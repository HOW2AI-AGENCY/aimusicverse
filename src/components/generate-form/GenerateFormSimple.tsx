import { useCallback, useEffect, useRef } from "react";
import { motion } from "@/lib/motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Mic, Music2, Palette, Copy, X } from "@/lib/icons";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { SectionLabel, useSectionHints } from "./SectionLabel";
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
import { useGenerationStrings } from "@/hooks/useGenerationStrings";

interface GenerateFormSimpleProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  customVoiceId?: string | null;
  onCustomVoiceChange?: (voiceId: string | null) => void;
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
  customVoiceId,
  onCustomVoiceChange,
  onBoostStyle,
  boostLoading,
  onOpenStyles,
}: GenerateFormSimpleProps) {
  const g = useGenerationStrings();
  const hints = useSectionHints();
  const { hapticFeedback } = useTelegram();
  // Remove hints import - using hints variable above
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
    if (!description) return;
    try {
      await navigator.clipboard.writeText(description);
      notify.success(g.toast.copied);
    } catch {
      // Clipboard может быть недоступен вне secure context / в webview без разрешения
      notify.error(g.toast.copyFailed);
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
    if (!description.trim()) {
      hapticFeedback("light");
      notify.info(g.actions.aiBoostEmptyHint || "Сначала напишите описание", {
        description: "AI улучшит уже введённый текст, добавит теги и структуру",
      });
      return;
    }
    hapticFeedback("medium");
    trackAction("ai_boost", "generation", "click", { hasDescription: !!description });
    onBoostStyle();
  }, [hapticFeedback, onBoostStyle, trackAction, description, g.actions.aiBoostEmptyHint]);

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
            <SectionLabel label={hasVocals ? g.form.describeSong : g.form.describeMusic} hint={hints.description} />
            <div className="flex items-center gap-0.5 -mr-1">
              {onOpenStyles && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 min-w-11 p-0 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                  onClick={handleOpenStyles}
                  aria-label={g.actions.chooseStyle}
                >
                  <Palette className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBoostStyle}
                disabled={boostLoading}
                aria-disabled={!description || boostLoading}
                className={cn(
                  "h-11 px-2.5 gap-1 text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-all",
                  !description && "opacity-60",
                )}
                aria-label={g.actions.boostAi}
                title={!description ? g.actions.aiBoostEmptyHint : undefined}
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
            placeholder={hasVocals ? g.form.placeholderVocals : g.form.placeholderInstrumental}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            className={cn(
              "resize-none text-body-lg leading-relaxed px-3.5 py-3 rounded-xl bg-muted/30 border-muted-foreground/20",
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
                "text-caption-sm tabular-nums transition-all duration-200",
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
                    aria-label={g.actions.copyDescription}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 min-w-11 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                    onClick={handleClear}
                    aria-label={g.actions.clearDescription}
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

      {/* ========== TRACK TYPE + TITLE — merged surface card ========== */}
      <FormSection elevated>
        <div className="space-y-4">
          <div className="space-y-2">
            <SectionLabel label={g.form.trackType} hint={hints.trackType} />
            <div role="radiogroup" aria-label={g.form.trackType} className="grid grid-cols-2 gap-2">
              {[
                { value: false, Icon: Music2, label: g.vocalToggle.instrumentalLabel },
                { value: true, Icon: Mic, label: g.vocalToggle.vocalLabel },
              ].map(({ value, Icon, label }) => {
                const active = hasVocals === value;
                return (
                  <button
                    key={String(value)}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleVocalsToggle(value)}
                    className={cn(
                      "flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-body-sm font-semibold transition-all border",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/50",
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/40" aria-hidden />

          <div className="space-y-2">
            <SectionLabel label={g.form.title} htmlFor="simple-title" hint={hints.title} suffix={g.form.titleSuffix} />
            <Input
              id="simple-title"
              placeholder={g.form.titlePlaceholder}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="min-h-[44px] text-body-lg rounded-xl bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-invalid={title.length > validation.title.maxLength}
              aria-describedby={titleValidation ? "simple-title-error" : undefined}
            />
            {titleValidation && (
              <ValidationMessage
                message={titleValidation.message}
                level={titleValidation.level}
                fieldId="simple-title"
              />
            )}
          </div>
        </div>
      </FormSection>

      {hasVocals && onCustomVoiceChange && (
        <>
          <FormDivider />
          <FormSection elevated>
            <CustomVoicePicker value={customVoiceId ?? null} onChange={onCustomVoiceChange} />
          </FormSection>
        </>
      )}
    </motion.div>

  );
}
