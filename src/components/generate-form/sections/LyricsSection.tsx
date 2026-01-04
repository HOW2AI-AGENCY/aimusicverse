import { memo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FormFieldToolbar } from '../FormFieldToolbar';
import { LyricsVisualEditor } from '../LyricsVisualEditor';
import { SaveTemplateDialog } from '../SaveTemplateDialog';
import { SavedLyricsSelector } from '../SavedLyricsSelector';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Текст песни</Label>
            {/* Visual toggle button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 text-[10px] px-2"
              onClick={() => setShowVisualEditor(!showVisualEditor)}
            >
              {showVisualEditor ? '📝 Текст' : '🎨 Визуал'}
            </Button>
          </div>
          
          <FormFieldToolbar
            value={lyrics}
            onClear={() => onLyricsChange('')}
            onVoiceInput={onLyricsChange}
            voiceContext="lyrics"
            appendMode
            onAIAssist={onOpenLyricsAssistant}
            onOpenTemplates={() => setTemplateSelectorOpen(true)}
            onOpenStudio={() => navigate('/lyrics-studio')}
            onSave={async () => setSaveDialogOpen(true)}
            showSave
            compact
          />
        </div>

        {showVisualEditor ? (
          <LyricsVisualEditor
            value={lyrics}
            onChange={onLyricsChange}
            onAIGenerate={onOpenLyricsAssistant}
          />
        ) : (
          <div className="relative">
            <Textarea
              placeholder="Введите текст или используйте AI..."
              value={lyrics}
              onChange={(e) => onLyricsChange(e.target.value)}
              rows={8}
              className="text-sm min-h-[180px] max-h-[300px] overflow-y-auto whitespace-pre-wrap pb-6"
            />
            {/* Character count indicator */}
            <div className={cn(
              "absolute bottom-2 right-2 text-[10px] bg-background/80 px-1.5 py-0.5 rounded",
              lyrics.length > 2800 ? "text-destructive" : "text-muted-foreground"
            )}>
              {lyrics.length} / 3000
            </div>
          </div>
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
