import { useMemo } from "react";
import { motion } from "@/lib/motion";
import { TitleSection, StyleSection, VocalsToggle, LyricsSectionAdvanced, PrivacyToggle } from "./sections";
import { AdvancedSettings } from "./AdvancedSettings";
import { FormSection, FormDivider } from "./FormSection";
import { CustomVoicePicker } from "@/components/voice-clone/CustomVoicePicker";
import { FileText, Palette, Mic2, AudioLines, Settings2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * StepIndicator — compact dot indicator showing current step / total.
 * ponytail: dots only, add numbered labels if users need non-visual step context.
 */
function StepIndicator({ steps, current, labels }: { steps: number; current: number; labels: string[] }) {
  return (
    <div
      className="flex items-center justify-center gap-2 mb-4"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={steps}
      aria-label={`Шаг ${current} из ${steps}`}
    >
      {Array.from({ length: steps }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isPast = stepNum < current;
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <div className={cn("w-4 h-px transition-colors", isPast ? "bg-primary/40" : "bg-border/30")} />}
            <div
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all",
                isActive && "bg-primary text-primary-foreground ring-2 ring-primary/20 scale-110",
                isPast && "bg-primary/20 text-primary/70",
                !isActive && !isPast && "bg-muted text-muted-foreground",
              )}
              title={labels[i]}
            >
              {stepNum}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface GenerateFormCustomProps {
  title: string;
  onTitleChange: (value: string) => void;
  style: string;
  onStyleChange: (value: string) => void;
  lyrics: string;
  onLyricsChange: (value: string) => void;
  hasVocals: boolean;
  onHasVocalsChange: (value: boolean) => void;
  onBoostStyle: () => void;
  boostLoading: boolean;
  onOpenLyricsAssistant: () => void;
  // Privacy
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  canMakePrivate?: boolean;
  // Advanced settings
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
  negativeTags: string;
  onNegativeTagsChange: (value: string) => void;
  vocalGender: "" | "m" | "f";
  onVocalGenderChange: (value: "" | "m" | "f") => void;
  styleWeight: number[];
  onStyleWeightChange: (value: number[]) => void;
  weirdnessConstraint: number[];
  onWeirdnessConstraintChange: (value: number[]) => void;
  audioWeight: number[];
  onAudioWeightChange: (value: number[]) => void;
  hasReferenceAudio: boolean;
  hasPersona: boolean;
  // Optional context for saving templates
  genre?: string;
  mood?: string;
  // Style presets
  onOpenStyles?: () => void;
  // Custom voice
  customVoiceId?: string | null;
  onCustomVoiceIdChange?: (id: string | null) => void;
}

export function GenerateFormCustom({
  title,
  onTitleChange,
  style,
  onStyleChange,
  lyrics,
  onLyricsChange,
  hasVocals,
  onHasVocalsChange,
  onBoostStyle,
  boostLoading,
  onOpenLyricsAssistant,
  isPublic = true,
  onIsPublicChange,
  canMakePrivate = false,
  advancedOpen,
  onAdvancedOpenChange,
  negativeTags,
  onNegativeTagsChange,
  vocalGender,
  onVocalGenderChange,
  styleWeight,
  onStyleWeightChange,
  weirdnessConstraint,
  onWeirdnessConstraintChange,
  audioWeight,
  onAudioWeightChange,
  hasReferenceAudio,
  hasPersona,
  genre,
  mood,
  onOpenStyles,
  customVoiceId,
  onCustomVoiceIdChange,
}: GenerateFormCustomProps) {
  // Calculate current step from visible sections. Used by StepIndicator.
  const currentStep = useMemo(() => {
    // This mirrors the step logic from the FormSection step props below.
    // Always 1. 2 = style&vocals. 3 = lyrics (if vocals) or settings (if no vocals).
    // 4 = voice (if vocals+custom) or settings. 5 = settings (if voice shown).
    if (!hasVocals) return 3; // basic(1) → style(2) → settings(3)
    if (!onCustomVoiceIdChange) return 4; // basic(1) → style(2) → lyrics(3) → settings(4)
    return 5; // basic(1) → style(2) → lyrics(3) → voice(4) → settings(5)
  }, [hasVocals, onCustomVoiceIdChange]);
  const totalSteps = hasVocals ? (onCustomVoiceIdChange ? 5 : 4) : 3;

  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <StepIndicator
        steps={totalSteps}
        current={currentStep}
        labels={["Основное", "Стиль и вокал", "Текст песни", "Голос", "Настройки"]}
      />

      {/* ========== BASIC INFO GROUP ========== */}
      <FormSection step={1} title="Основное" icon={<FileText className="w-3.5 h-3.5" />} tone="default">
        <TitleSection title={title} onTitleChange={onTitleChange} />
      </FormSection>

      <FormDivider />

      {/* ========== STYLE & VOCALS GROUP ========== */}
      <FormSection
        step={2}
        title="Стиль и вокал"
        description="Опишите звучание и выберите, нужен ли голос"
        icon={<Palette className="w-3.5 h-3.5" />}
        tone="style"
      >
        <StyleSection
          style={style}
          onStyleChange={onStyleChange}
          onBoostStyle={onBoostStyle}
          boostLoading={boostLoading}
          onOpenStyles={onOpenStyles}
        />

        <VocalsToggle hasVocals={hasVocals} onHasVocalsChange={onHasVocalsChange} onLyricsChange={onLyricsChange} />
      </FormSection>

      {/* ========== LYRICS GROUP ========== */}
      {hasVocals && (
        <>
          <FormDivider />
          <FormSection
            step={3}
            title="Текст песни"
            description="Структурируйте по секциям или напишите текст целиком"
            icon={<Mic2 className="w-3.5 h-3.5" />}
            tone="lyrics"
          >
            <LyricsSectionAdvanced
              lyrics={lyrics}
              onLyricsChange={onLyricsChange}
              onStyleChange={onStyleChange}
              onOpenLyricsAssistant={onOpenLyricsAssistant}
              style={style}
              genre={genre}
              mood={mood}
            />
          </FormSection>
          {onCustomVoiceIdChange && (
            <>
              <FormDivider />
              <FormSection
                step={4}
                title="Кастомный голос"
                description="Опционально — клонированный голос для вокала"
                icon={<AudioLines className="w-3.5 h-3.5" />}
                tone="voice"
              >
                <CustomVoicePicker value={customVoiceId ?? null} onChange={onCustomVoiceIdChange} />
              </FormSection>
            </>
          )}
        </>
      )}

      {/* ========== SETTINGS GROUP ========== */}
      <FormDivider />

      <FormSection
        step={hasVocals ? (onCustomVoiceIdChange ? 5 : 4) : 3}
        title="Настройки"
        description="Приватность и точная настройка генерации"
        icon={<Settings2 className="w-3.5 h-3.5" />}
        tone="settings"
      >
        {onIsPublicChange && (
          <PrivacyToggle isPublic={isPublic} onIsPublicChange={onIsPublicChange} canMakePrivate={canMakePrivate} />
        )}

        <AdvancedSettings
          open={advancedOpen}
          onOpenChange={onAdvancedOpenChange}
          negativeTags={negativeTags}
          onNegativeTagsChange={onNegativeTagsChange}
          vocalGender={vocalGender}
          onVocalGenderChange={onVocalGenderChange}
          styleWeight={styleWeight}
          onStyleWeightChange={onStyleWeightChange}
          weirdnessConstraint={weirdnessConstraint}
          onWeirdnessConstraintChange={onWeirdnessConstraintChange}
          audioWeight={audioWeight}
          onAudioWeightChange={onAudioWeightChange}
          hasReferenceAudio={hasReferenceAudio}
          hasPersona={hasPersona}
        />
      </FormSection>
    </motion.div>
  );
}
