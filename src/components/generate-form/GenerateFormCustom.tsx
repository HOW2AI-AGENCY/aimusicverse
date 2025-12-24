import { motion } from '@/lib/motion';
import { TitleSection, StyleSection, VocalsToggle, LyricsSection } from './sections';
import { AdvancedSettings } from './AdvancedSettings';
import type { GenerationProvider } from './ProviderSelector';

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
  // Provider selection for cover/extend modes
  provider?: GenerationProvider;
  onProviderChange?: (provider: GenerationProvider) => void;
  audioDuration?: number | null;
  stabilityStrength?: number[];
  onStabilityStrengthChange?: (value: number[]) => void;
  showProviderSelector?: boolean;
  // Optional context for saving templates
  genre?: string;
  mood?: string;
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
  provider,
  onProviderChange,
  audioDuration,
  stabilityStrength,
  onStabilityStrengthChange,
  showProviderSelector = false,
  genre,
  mood,
}: GenerateFormCustomProps) {
  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-3"
    >
      <TitleSection title={title} onTitleChange={onTitleChange} />

      <StyleSection
        style={style}
        onStyleChange={onStyleChange}
        onBoostStyle={onBoostStyle}
        boostLoading={boostLoading}
      />

      <VocalsToggle
        hasVocals={hasVocals}
        onHasVocalsChange={onHasVocalsChange}
        onLyricsChange={onLyricsChange}
      />

      {hasVocals && (
        <LyricsSection
          lyrics={lyrics}
          onLyricsChange={onLyricsChange}
          onStyleChange={onStyleChange}
          onOpenLyricsAssistant={onOpenLyricsAssistant}
          style={style}
          genre={genre}
          mood={mood}
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
        provider={provider}
        onProviderChange={onProviderChange}
        audioDuration={audioDuration}
        stabilityStrength={stabilityStrength}
        onStabilityStrengthChange={onStabilityStrengthChange}
        showProviderSelector={showProviderSelector}
      />
    </motion.div>
  );
}