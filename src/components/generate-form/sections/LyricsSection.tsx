import { memo, useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormFieldActions } from '@/components/ui/FormFieldActions';
import { LyricsVisualEditorCompact } from '../LyricsVisualEditorCompact';
import { SaveTemplateDialog } from '../SaveTemplateDialog';
import { SavedLyricsSelector } from '../SavedLyricsSelector';
import { SectionLabel, SECTION_HINTS } from '../SectionLabel';
import { ValidationMessage, checkArtistValidation } from '../ValidationMessage';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutGrid, AlignLeft } from 'lucide-react';

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

  // Check for blocked artists in lyrics
  const lyricsValidation = useMemo(
    () => checkArtistValidation(lyrics),
    [lyrics]
  );
  
  const hasError = lyricsValidation?.level === 'error';

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionLabel 
            label="Текст песни"
            hint={SECTION_HINTS.lyrics}
          />
          
          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
            <Button 
              variant={!showVisualEditor ? 'default' : 'ghost'}
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowVisualEditor(false)}
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            <Button 
              variant={showVisualEditor ? 'default' : 'ghost'}
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowVisualEditor(true)}
            >
              <LayoutGrid className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {showVisualEditor ? (
          <LyricsVisualEditorCompact
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
              className={cn(
                "text-sm min-h-[180px] max-h-[300px] overflow-y-auto whitespace-pre-wrap pb-9 rounded-xl",
                "bg-muted/30 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20",
                (lyrics.length > 2800 || hasError) && "border-destructive focus:border-destructive focus-visible:ring-destructive"
              )}
              aria-invalid={hasError || lyrics.length > 3000}
              aria-describedby={lyricsValidation ? "lyrics-error" : undefined}
            />
            
            {/* Bottom toolbar */}
            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
              {/* Character count */}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md bg-background/60 backdrop-blur-sm",
                lyrics.length > 2800 ? "text-destructive font-medium" : 
                lyrics.length > 2500 ? "text-yellow-500" : "text-muted-foreground"
              )}>
                {lyrics.length}/3000
              </span>
              
              {/* Toolbar */}
              <div className="flex items-center bg-background/60 backdrop-blur-sm rounded-md">
                <FormFieldActions
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
                  size="lg"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Validation message for artist names */}
        {lyricsValidation && (
          <ValidationMessage
            message={lyricsValidation.message}
            level={lyricsValidation.level}
            fieldId="lyrics"
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
