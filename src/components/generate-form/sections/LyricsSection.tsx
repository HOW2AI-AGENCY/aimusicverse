import { memo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, ExternalLink } from 'lucide-react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { FormFieldActions } from '@/components/ui/FormFieldActions';
import { LyricsVisualEditor } from '../LyricsVisualEditor';
import { SaveTemplateDialog } from '../SaveTemplateDialog';
import { SavedLyricsSelector } from '../SavedLyricsSelector';
import { useNavigate } from 'react-router-dom';

interface LyricsSectionProps {
  lyrics: string;
  onLyricsChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onOpenLyricsAssistant: () => void;
  style?: string;
  genre?: string;
  mood?: string;
}

export const LyricsSection = memo(function LyricsSection({
  lyrics,
  onLyricsChange,
  onStyleChange,
  onOpenLyricsAssistant,
  style,
  genre,
  mood,
}: LyricsSectionProps) {
  const navigate = useNavigate();
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-xs font-medium">Текст песни</Label>
          <div className="flex items-center gap-1">
            {/* Template selector button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1"
              onClick={() => setTemplateSelectorOpen(true)}
            >
              <FileText className="w-3 h-3" />
              <span className="text-xs hidden sm:inline">Шаблоны</span>
            </Button>
            {/* Lyrics Studio link */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 gap-1"
              onClick={() => navigate('/lyrics-studio')}
            >
              <ExternalLink className="w-3 h-3" />
              <span className="text-xs hidden sm:inline">Студия</span>
            </Button>
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

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        lyrics={lyrics}
        style={style || ''}
        genre={genre}
        mood={mood}
      />

      {/* Saved Lyrics Selector */}
      <SavedLyricsSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelect={(template) => {
          onLyricsChange(template.lyrics);
          if (template.style) onStyleChange(template.style);
        }}
      />
    </>
  );
});
