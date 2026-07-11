import { motion } from "@/lib/motion";
import { TitleSection, StyleSection, VocalsToggle, LyricsSectionAdvanced, PrivacyToggle } from "./sections";
import { AdvancedSettings } from "./AdvancedSettings";
import { FormSection, FormDivider } from "./FormSection";
import { CustomVoicePicker } from "@/components/voice-clone/CustomVoicePicker";
import { FileText, Palette, Mic2, AudioLines, Settings2 } from "@/lib/icons";

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
  return (
    <motion.div>
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
