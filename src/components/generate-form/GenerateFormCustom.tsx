import { motion } from "@/lib/motion";
import { TitleSection, StyleSection, VocalsToggle, LyricsSectionAdvanced, PrivacyToggle } from "./sections";
import { AdvancedSettings } from "./AdvancedSettings";
import { FormSection, FormDivider } from "./FormSection";
import { CustomVoicePicker } from "@/components/voice-clone/CustomVoicePicker";
import { FileText, Palette, Mic2, AudioLines, Settings2 } from "@/lib/icons";
import type { UseGenerateFormReturn } from "@/hooks/generation/useGenerateForm.types";

interface GenerateFormCustomProps {
  /** Single form object eliminates 25+ prop-drilled value/setter pairs. */
  form: UseGenerateFormReturn;
  /** Non-form props stay as individual props. */
  onOpenLyricsAssistant: () => void;
  onOpenStyles?: () => void;
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
  canMakePrivate?: boolean;
  genre?: string;
  mood?: string;
  /** Override for hasReferenceAudio — default: !!form.audioFile */
  hasReferenceAudio?: boolean;
  /** Override for hasPersona — default: !!form.selectedArtistId */
  hasPersona?: boolean;
}

export function GenerateFormCustom({
  form,
  onOpenLyricsAssistant,
  onOpenStyles,
  advancedOpen,
  onAdvancedOpenChange,
  canMakePrivate = false,
  genre,
  mood,
  hasReferenceAudio: hasReferenceAudioOverride,
  hasPersona: hasPersonaOverride,
}: GenerateFormCustomProps) {
  const {
    title,
    setTitle,
    style,
    setStyle,
    lyrics,
    setLyrics,
    hasVocals,
    setHasVocals,
    handleBoostStyle,
    boostLoading,
    isPublic,
    setIsPublic,
    negativeTags,
    setNegativeTags,
    vocalGender,
    setVocalGender,
    styleWeight,
    setStyleWeight,
    weirdnessConstraint,
    setWeirdnessConstraint,
    audioWeight,
    setAudioWeight,
    audioFile,
    selectedArtistId,
    customVoiceId,
    setCustomVoiceId,
  } = form;

  const hasReferenceAudio = hasReferenceAudioOverride ?? !!audioFile;
  const hasPersona = hasPersonaOverride ?? !!selectedArtistId;

  return (
    <motion.div>
      {/* ========== BASIC INFO GROUP ========== */}
      <FormSection step={1} title="Основное" icon={<FileText className="w-3.5 h-3.5" />} tone="default">
        <TitleSection title={title} onTitleChange={setTitle} />
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
          onStyleChange={setStyle}
          onBoostStyle={handleBoostStyle}
          boostLoading={boostLoading}
          onOpenStyles={onOpenStyles}
        />

        <VocalsToggle hasVocals={hasVocals} onHasVocalsChange={setHasVocals} onLyricsChange={setLyrics} />
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
              onLyricsChange={setLyrics}
              onStyleChange={setStyle}
              onOpenLyricsAssistant={onOpenLyricsAssistant}
              style={style}
              genre={genre}
              mood={mood}
            />
          </FormSection>
          {setCustomVoiceId && (
            <>
              <FormDivider />
              <FormSection
                step={4}
                title="Кастомный голос"
                description="Опционально — клонированный голос для вокала"
                icon={<AudioLines className="w-3.5 h-3.5" />}
                tone="voice"
              >
                <CustomVoicePicker value={customVoiceId ?? null} onChange={setCustomVoiceId} />
              </FormSection>
            </>
          )}
        </>
      )}

      {/* ========== SETTINGS GROUP ========== */}
      <FormDivider />

      <FormSection
        step={hasVocals ? (customVoiceId ? 5 : 4) : 3}
        title="Настройки"
        description="Приватность и точная настройка генерации"
        icon={<Settings2 className="w-3.5 h-3.5" />}
        tone="settings"
      >
        {setIsPublic && (
          <PrivacyToggle isPublic={isPublic} onIsPublicChange={setIsPublic} canMakePrivate={canMakePrivate} />
        )}

        <AdvancedSettings
          open={advancedOpen}
          onOpenChange={onAdvancedOpenChange}
          negativeTags={negativeTags}
          onNegativeTagsChange={setNegativeTags}
          vocalGender={vocalGender}
          onVocalGenderChange={setVocalGender}
          styleWeight={styleWeight}
          onStyleWeightChange={setStyleWeight}
          weirdnessConstraint={weirdnessConstraint}
          onWeirdnessConstraintChange={setWeirdnessConstraint}
          audioWeight={audioWeight}
          onAudioWeightChange={setAudioWeight}
          hasReferenceAudio={hasReferenceAudio}
          hasPersona={hasPersona}
        />
      </FormSection>
    </motion.div>
  );
}
