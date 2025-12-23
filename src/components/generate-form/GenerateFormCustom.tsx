import { useState } from 'react';
import { motion } from '@/lib/motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2, Mic } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { FormFieldActions } from '@/components/ui/FormFieldActions';
import { LyricsVisualEditor } from './LyricsVisualEditor';
import { AdvancedSettings } from './AdvancedSettings';
import { SaveTemplateDialog } from './SaveTemplateDialog';
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
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-3"
    >
      {/* Title Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="title" className="text-xs font-medium">
            Название
          </Label>
          <FormFieldActions
            value={title}
            onClear={() => onTitleChange('')}
          />
        </div>
        <Input
          id="title"
          placeholder="Автогенерация если пусто"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Style Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="style" className="text-xs font-medium">
            Стиль
          </Label>
          <div className="flex items-center gap-1">
            <FormFieldActions
              value={style}
              onClear={() => onStyleChange('')}
            />
            <VoiceInputButton
              onResult={onStyleChange}
              context="style"
              currentValue={style}
              appendMode
              className="h-6 w-6 p-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBoostStyle}
              disabled={boostLoading || !style}
              className="h-6 px-2 gap-1"
            >
              {boostLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span className="text-xs">AI</span>
            </Button>
          </div>
        </div>
        <Textarea
          id="style"
          placeholder="Опишите стиль, жанр, настроение..."
          value={style}
          onChange={(e) => onStyleChange(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${style.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {style.length}/500
          </span>
        </div>
      </div>

      {/* Vocals Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4" />
          <Label htmlFor="vocals-toggle" className="cursor-pointer text-sm font-medium">
            С вокалом
          </Label>
        </div>
        <Switch
          id="vocals-toggle"
          checked={hasVocals}
          onCheckedChange={(checked) => {
            onHasVocalsChange(checked);
            if (!checked) {
              onLyricsChange('');
            }
          }}
        />
      </div>

      {/* Lyrics Section - Only show when hasVocals is true */}
      {hasVocals && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-medium">Текст песни</Label>
            <div className="flex items-center gap-1">
              <FormFieldActions
                value={lyrics}
                onClear={() => onLyricsChange('')}
                showSave
                onSave={async () => setSaveDialogOpen(true)}
              />
              <VoiceInputButton
                onResult={onLyricsChange}
                context="lyrics"
                currentValue={lyrics}
                appendMode
                className="h-6 w-6 p-0"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => setShowVisualEditor(!showVisualEditor)}
              >
                <span className="text-xs">{showVisualEditor ? 'Текст' : 'Визуал'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={onOpenLyricsAssistant}
              >
                <Sparkles className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {showVisualEditor ? (
            <LyricsVisualEditor
              value={lyrics}
              onChange={onLyricsChange}
              onAIGenerate={onOpenLyricsAssistant}
            />
          ) : (
            <Textarea
              placeholder="Введите текст или используйте AI..."
              value={lyrics}
              onChange={(e) => onLyricsChange(e.target.value)}
              rows={8}
              className="text-sm min-h-[180px] max-h-[300px] overflow-y-auto whitespace-pre-wrap"
            />
          )}
        </div>
      )}

      {/* Advanced Settings Collapsible */}
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

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        lyrics={lyrics}
        style={style}
        genre={genre}
        mood={mood}
      />
    </motion.div>
  );
}