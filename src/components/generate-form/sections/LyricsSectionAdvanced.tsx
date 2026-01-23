/**
 * LyricsSectionAdvanced - Premium lyrics editor for generation form
 * 
 * Features:
 * - Collapsible sections (Verse, Chorus, Bridge, etc.)
 * - AI-powered suggestions
 * - Character count with limits
 * - Visual structure editor toggle
 * - Template quick-actions
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormFieldActions } from '@/components/ui/FormFieldActions';
import { LyricsVisualEditorCompact } from '../LyricsVisualEditorCompact';
import { SaveTemplateDialog } from '../SaveTemplateDialog';
import { SavedLyricsSelector } from '../SavedLyricsSelector';
import { SectionLabel, SECTION_HINTS } from '../SectionLabel';
import { ValidationMessage, checkArtistValidation } from '../ValidationMessage';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';
import {
  LayoutGrid,
  AlignLeft,
  Sparkles,
  ChevronDown,
  BookOpen,
  Save,
  Wand2,
  Music2,
  Mic2,
  FileText,
} from 'lucide-react';

interface LyricsSectionAdvancedProps {
  lyrics: string;
  onLyricsChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onOpenLyricsAssistant: () => void;
  style?: string;
  genre?: string;
  mood?: string;
}

// Quick templates for lyrics structure
const QUICK_TEMPLATES = [
  { id: 'verse-chorus', label: 'Куплет + Припев', icon: Music2, structure: '[Verse]\n\n\n[Chorus]\n\n' },
  { id: 'full-song', label: 'Полная песня', icon: FileText, structure: '[Intro]\n\n\n[Verse 1]\n\n\n[Chorus]\n\n\n[Verse 2]\n\n\n[Chorus]\n\n\n[Bridge]\n\n\n[Chorus]\n\n\n[Outro]\n' },
  { id: 'rap', label: 'Рэп трек', icon: Mic2, structure: '[Hook]\n\n\n[Verse 1]\n\n\n[Hook]\n\n\n[Verse 2]\n\n\n[Hook]\n' },
];

export const LyricsSectionAdvanced = memo(function LyricsSectionAdvanced({
  lyrics,
  onLyricsChange,
  onStyleChange,
  onOpenLyricsAssistant,
  style,
  genre,
  mood,
}: LyricsSectionAdvancedProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const [showVisualEditor, setShowVisualEditor] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);

  // Validation
  const lyricsValidation = useMemo(
    () => checkArtistValidation(lyrics),
    [lyrics]
  );
  const hasError = lyricsValidation?.level === 'error';
  
  // Character limit colors
  const charCountColor = useMemo(() => {
    if (lyrics.length > 2800) return 'text-destructive';
    if (lyrics.length > 2500) return 'text-amber-500';
    return 'text-muted-foreground';
  }, [lyrics.length]);

  const handleApplyTemplate = useCallback((structure: string) => {
    hapticFeedback('medium');
    onLyricsChange(structure);
    setShowQuickTemplates(false);
  }, [hapticFeedback, onLyricsChange]);

  const toggleEditor = useCallback((visual: boolean) => {
    hapticFeedback('light');
    setShowVisualEditor(visual);
  }, [hapticFeedback]);

  return (
    <>
      <div className="space-y-3">
        {/* Header with label and controls */}
        <div className="flex items-center justify-between gap-2">
          <SectionLabel 
            label="Текст песни"
            hint={SECTION_HINTS.lyrics}
          />
          
          <div className="flex items-center gap-1">
            {/* Quick templates dropdown */}
            <motion.div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => {
                  hapticFeedback('light');
                  setShowQuickTemplates(!showQuickTemplates);
                }}
              >
                <BookOpen className="h-3 w-3" />
                <span className="hidden sm:inline">Шаблоны</span>
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  showQuickTemplates && "rotate-180"
                )} />
              </Button>
              
              <AnimatePresence>
                {showQuickTemplates && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute right-0 top-full mt-1 z-50",
                      "w-44 p-1 rounded-xl",
                      "bg-popover border border-border shadow-xl"
                    )}
                  >
                    {QUICK_TEMPLATES.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleApplyTemplate(template.structure)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg",
                            "text-xs text-left hover:bg-accent transition-colors",
                            "touch-manipulation"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{template.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
              <Button 
                variant={!showVisualEditor ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleEditor(false)}
              >
                <AlignLeft className="h-3 w-3" />
              </Button>
              <Button 
                variant={showVisualEditor ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => toggleEditor(true)}
              >
                <LayoutGrid className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Editor area */}
        {showVisualEditor ? (
          <LyricsVisualEditorCompact
            value={lyrics}
            onChange={onLyricsChange}
            onAIGenerate={onOpenLyricsAssistant}
          />
        ) : (
          <div className="relative group">
            {/* Main textarea with premium styling */}
            <Textarea
              placeholder="Начните писать текст или выберите шаблон..."
              value={lyrics}
              onChange={(e) => onLyricsChange(e.target.value)}
              rows={10}
              className={cn(
                "text-sm min-h-[220px] max-h-[400px] overflow-y-auto whitespace-pre-wrap",
                "pb-12 pt-3 px-3 rounded-xl resize-none",
                "bg-gradient-to-b from-muted/20 to-muted/40",
                "border-muted-foreground/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                "transition-all duration-200",
                (lyrics.length > 2800 || hasError) && 
                  "border-destructive/50 focus:border-destructive focus:ring-destructive/20"
              )}
              aria-invalid={hasError || lyrics.length > 3000}
              aria-describedby={lyricsValidation ? "lyrics-error" : undefined}
            />
            
            {/* Floating toolbar at bottom */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 p-2",
              "bg-gradient-to-t from-background/95 via-background/80 to-transparent",
              "backdrop-blur-sm rounded-b-xl"
            )}>
              <div className="flex items-center justify-between gap-2">
                {/* Character count with progress bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full transition-colors",
                        lyrics.length > 2800 ? "bg-destructive" :
                        lyrics.length > 2500 ? "bg-amber-500" : "bg-primary"
                      )}
                      initial={false}
                      animate={{ width: `${Math.min((lyrics.length / 3000) * 100, 100)}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <span className={cn("text-[10px] font-mono", charCountColor)}>
                    {lyrics.length}/3000
                  </span>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1">
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

            {/* AI suggestion button - appears when empty */}
            {!lyrics && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  "flex flex-col items-center gap-2 p-4 rounded-xl",
                  "bg-primary/5 border border-dashed border-primary/30",
                  "hover:bg-primary/10 hover:border-primary/50",
                  "transition-all duration-200 cursor-pointer group/ai"
                )}
                onClick={() => {
                  hapticFeedback('medium');
                  onOpenLyricsAssistant();
                }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover/ai:bg-primary/20 transition-colors">
                  <Wand2 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">Создать с AI</p>
                  <p className="text-[10px] text-muted-foreground">Нажмите для генерации</p>
                </div>
              </motion.button>
            )}
          </div>
        )}
        
        {/* Validation message */}
        {lyricsValidation && (
          <ValidationMessage
            message={lyricsValidation.message}
            level={lyricsValidation.level}
            fieldId="lyrics"
          />
        )}
      </div>

      {/* Dialogs */}
      <SaveTemplateDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        lyrics={lyrics}
        style={style || ''}
        genre={genre}
        mood={mood}
      />

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
