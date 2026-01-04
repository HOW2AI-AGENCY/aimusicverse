import { motion } from '@/lib/motion';
import { TitleSection, StyleSection, VocalsToggle, LyricsSection, PrivacyToggle } from './sections';
import { AdvancedSettings } from './AdvancedSettings';
import { Separator } from '@/components/ui/separator';

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
  vocalGender: '' | 'm' | 'f';
  onVocalGenderChange: (value: '' | 'm' | 'f') => void;
  styleWeight: number[];
  onStyleWeightChange: (value: number[]) => void;
  weirdnessConstraint: number[];
  onWeirdnessConstraintChange: (value: number[]) => void;
  audioWeight: number[];
  onAudioWeightChange: (value: number[]) => void;
  hasReferenceAudio: boolean;
  hasPersona: boolean;
  model: string;
  onModelChange: (value: string) => void;
  // Optional context for saving templates
  genre?: string;
  mood?: string;
  // Style presets
  onOpenStyles?: () => void;
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
  model,
  onModelChange,
  genre,
  mood,
  onOpenStyles,
}: GenerateFormCustomProps) {
  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-4"
    >
      {/* ========== BASIC INFO GROUP ========== */}
      <div className="space-y-3">
        <TitleSection title={title} onTitleChange={onTitleChange} />
      </div>

      {/* Subtle divider */}
      <Separator className="bg-border/50" />

      {/* ========== STYLE & VOCALS GROUP ========== */}
      <div className="space-y-3">
        <StyleSection
          style={style}
          onStyleChange={onStyleChange}
          onBoostStyle={onBoostStyle}
          boostLoading={boostLoading}
          onOpenStyles={onOpenStyles}
        />

        <VocalsToggle
          hasVocals={hasVocals}
          onHasVocalsChange={onHasVocalsChange}
          onLyricsChange={onLyricsChange}
        />
      </div>

      {/* ========== LYRICS GROUP ========== */}
      {hasVocals && (
        <>
          <Separator className="bg-border/50" />
          <LyricsSection
            lyrics={lyrics}
            onLyricsChange={onLyricsChange}
            onStyleChange={onStyleChange}
            onOpenLyricsAssistant={onOpenLyricsAssistant}
            style={style}
            genre={genre}
            mood={mood}
          />
        </>
      )}

      {/* ========== SETTINGS GROUP ========== */}
      <Separator className="bg-border/50" />
      
      <div className="space-y-3">
        {onIsPublicChange && (
          <PrivacyToggle
            isPublic={isPublic}
            onIsPublicChange={onIsPublicChange}
            canMakePrivate={canMakePrivate}
          />
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
          model={model}
          onModelChange={onModelChange}
        />
      </div>
    </motion.div>
  );
}