import { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Loader2, Mic } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { LyricsVisualEditor } from './LyricsVisualEditor';
import { AdvancedSettings } from './AdvancedSettings';

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
}: GenerateFormCustomProps) {
  const [showVisualEditor, setShowVisualEditor] = useState(false);

  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="space-y-3"
    >
      <div>
        <Label htmlFor="title" className="text-xs font-medium mb-1.5 block">
          Название
        </Label>
        <Input
          id="title"
          placeholder="Автогенерация если пусто"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="style" className="text-xs font-medium">
            Стиль
          </Label>
          <div className="flex items-center gap-1">
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
            <div className="flex gap-1">
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
              rows={5}
              className="resize-none text-sm"
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
      />
    </motion.div>
  );
}