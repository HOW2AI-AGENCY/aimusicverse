import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2 } from 'lucide-react';
import { notify } from '@/lib/notifications';
import { useProjects } from '@/hooks/useProjects';
import { useArtists } from '@/hooks/useArtists';
import logo from '@/assets/logo.png';
import { useTracks } from '@/hooks/useTracks';
import { useGenerateForm, useAudioReference } from '@/hooks/generation';
import { useTelegram } from '@/contexts/TelegramContext';
import { useTelegramMainButton, useTelegramSecondaryButton, useTelegramBackButton } from '@/hooks/telegram';
import { useKeyboardAware } from '@/hooks/useKeyboardAware';
import { Skeleton } from '@/components/ui/skeleton';

// Form components - lazy loaded for bundle optimization
// GenerateFormHeaderCompact removed - using CollapsibleFormHeader only
import { GenerateFormActions } from './generate-form/GenerateFormActions';
import { GenerateFormReferences } from './generate-form/GenerateFormReferences';
import { GenerationLoadingState } from './generate-form/GenerationLoadingState';
import { CollapsibleFormHeader } from './generate-form/CollapsibleFormHeader';

// Lazy load heavy form components - Wizard removed for UX simplification
const GenerateFormSimple = lazy(() => 
  import('./generate-form/GenerateFormSimple').then(m => ({ default: m.GenerateFormSimple }))
);
const GenerateFormCustom = lazy(() => 
  import('./generate-form/GenerateFormCustom').then(m => ({ default: m.GenerateFormCustom }))
);

// Form skeleton for lazy loading
const FormSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

// Dialogs
import { AudioActionDialog } from './generate-form/AudioActionDialog';
import { ArtistSelector } from './generate-form/ArtistSelector';
import { ProjectTrackSelector } from './generate-form/ProjectTrackSelector';
import { PromptHistory } from './generate-form/PromptHistory';
import { LyricsChatAssistant } from './generate-form/LyricsChatAssistant';
import { StylePresetSelector } from './generate-form/StylePresetSelector';
import { CreditBalanceWarning } from './generate-form/CreditBalanceWarning';
import { CreditBalanceIndicator } from './generate-form/CreditBalanceIndicator';
// UploadAudioDialog removed - now using unified form for cover/extend
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId: initialProjectId }: GenerateSheetProps) => {
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();
  const { hapticFeedback, enableClosingConfirmation, disableClosingConfirmation } = useTelegram();
  
  // Get active audio reference for hasReferenceAudio check
  const { activeReference } = useAudioReference();
  
  // Keyboard-aware behavior для адаптации под клавиатуру iOS
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { keyboardHeight, isKeyboardOpen, createFocusHandler } = useKeyboardAware();

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [audioActionDialogOpen, setAudioActionDialogOpen] = useState(false); // For reference audio selection
  // Legacy UploadAudioDialog states removed - now using unified form
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const [projectTrackStep, setProjectTrackStep] = useState<'project' | 'track'>('project');
  // Persist advanced settings state to localStorage (T044)
  const [advancedOpen, setAdvancedOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('generate-form-advanced-open');
      return saved === 'true';
    }
    return false;
  });
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  // Save advancedOpen state to localStorage when it changes (T044)
  useEffect(() => {
    localStorage.setItem('generate-form-advanced-open', String(advancedOpen));
  }, [advancedOpen]);

  // Haptic feedback wrapper for advanced toggle (T045)
  const handleAdvancedToggle = useCallback((open: boolean) => {
    hapticFeedback('light');
    setAdvancedOpen(open);
  }, [hapticFeedback]);

  // Form hook
  const form = useGenerateForm({
    open,
    onOpenChange,
    initialProjectId,
    projects,
    artists,
    allTracks,
  });

  // Check if form has unsaved data
  const hasUnsavedData = Boolean(
    form.style.trim() ||
    form.lyrics.trim() ||
    form.title.trim()
  );

  // Enable/disable Telegram closing confirmation based on form state
  useEffect(() => {
    if (open && hasUnsavedData) {
      enableClosingConfirmation();
    } else {
      disableClosingConfirmation();
    }
    return () => {
      disableClosingConfirmation();
    };
  }, [open, hasUnsavedData, enableClosingConfirmation, disableClosingConfirmation]);

  // Handle close with confirmation
  const handleCloseRequest = useCallback(() => {
    if (hasUnsavedData) {
      hapticFeedback('warning');
      setCloseConfirmOpen(true);
    } else {
      onOpenChange(false);
    }
  }, [hasUnsavedData, hapticFeedback, onOpenChange]);

  const handleConfirmClose = useCallback(() => {
    setCloseConfirmOpen(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const projectTracks = form.selectedProjectId
    ? allTracks?.filter(t => t.project_id === form.selectedProjectId)
    : [];

  const handleProjectSelect = (projectId: string) => {
    hapticFeedback('light');
    form.setSelectedProjectId(projectId);
    const tracks = allTracks?.filter(t => t.project_id === projectId);
    if (tracks && tracks.length > 0) {
      setProjectTrackStep('track');
    } else {
      setProjectDialogOpen(false);
      notify.info('Проект выбран', {
        description: 'В проекте пока нет треков',
      });
    }
  };

  const handleClearDraft = () => {
    hapticFeedback('medium');
    form.clearDraft();
    form.resetForm();
    notify.success('Черновик очищен');
  };

  const handleGenerate = () => {
    hapticFeedback('medium');
    form.handleGenerate();
  };

  // Telegram MainButton integration - shows native button in Mini App, UI button for test users
  // Hide when LyricsChatAssistant is open (it has its own MainButton for "Apply")
  const { shouldShowUIButton, showProgress, hideProgress } = useTelegramMainButton({
    text: form.loading ? 'Создание...' : 'СГЕНЕРИРОВАТЬ',
    onClick: handleGenerate,
    enabled: !form.loading,
    visible: open && !lyricsAssistantOpen,
  });

  // Telegram SecondaryButton for "Save Draft" - NEW FEATURE
  // Only show when there's unsaved data
  const { shouldShowUIButton: shouldShowSecondaryUIButton } = useTelegramSecondaryButton({
    text: 'Сохранить черновик',
    onClick: () => {
      hapticFeedback('light');
      notify.success('Черновик сохранён');
    },
    enabled: hasUnsavedData && !form.loading,
    visible: open && hasUnsavedData && !lyricsAssistantOpen,
    position: 'left',
  });

  // Telegram BackButton integration - with confirmation for unsaved data
  useTelegramBackButton({
    visible: open,
    onClick: handleCloseRequest,
  });

  // Show/hide progress on MainButton when loading changes
  useEffect(() => {
    if (form.loading) {
      showProgress(true);
    } else {
      hideProgress();
    }
  }, [form.loading, showProgress, hideProgress]);

  return (
    <>
    {/* Close confirmation dialog */}
    <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Закрыть форму?</AlertDialogTitle>
          <AlertDialogDescription>
            У вас есть несохранённые данные. Они будут потеряны.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClose}>
            Закрыть
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Sheet open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCloseRequest();
      } else {
        onOpenChange(true);
      }
    }}>
      <SheetContent 
        side="bottom" 
        className="h-[95dvh] sm:h-[85vh] sm:max-h-[800px] flex flex-col frost-sheet p-0 w-full max-w-full min-w-0 overflow-x-hidden"
        hideCloseButton
        hideTitle
        accessibleTitle="Создание музыки"
      >
        {/* Compact Header with safe area for Telegram */}
        <div 
          className="px-3 border-b bg-background/95 backdrop-blur-xl flex-shrink-0"
          style={{ 
            paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))' 
          }}
        >
          <CollapsibleFormHeader
            balance={form.userBalance}
            cost={form.generationCost}
            mode={form.mode}
            onModeChange={form.setMode}
            onOpenHistory={() => setHistoryOpen(true)}
            model={form.model}
            onModelChange={form.setModel}
            onClose={handleCloseRequest}
          />
        </div>

        {/* Loading Overlay */}
        <AnimatePresence>
          {form.loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <GenerationLoadingState
                stage="processing"
                showCancel={false}
                compact={false}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollArea className="flex-1 overflow-x-hidden">
          <div className="px-4 py-3 space-y-3 w-full max-w-full min-w-0 overflow-x-hidden">
            {/* Credit Balance Warning */}
            <CreditBalanceWarning
              balance={form.userBalance}
              cost={form.generationCost}
              onClose={() => onOpenChange(false)}
            />
            
            <GenerateFormActions
              onOpenAudioDialog={() => setAudioActionDialogOpen(true)}
              onOpenProjectDialog={() => setProjectDialogOpen(true)}
              onOpenArtistDialog={() => setArtistDialogOpen(true)}
            />

            {/* Selected References Indicators */}
            <GenerateFormReferences
              planTrackId={form.planTrackId}
              planTrackTitle={form.title}
              audioFile={form.audioFile}
              audioReferenceLoading={form.audioReferenceLoading}
              selectedArtistId={form.selectedArtistId}
              selectedProjectId={form.selectedProjectId}
              artists={artists}
              projects={projects}
              onRemoveAudioFile={() => form.setAudioFile(null)}
              onRemoveArtist={() => form.setSelectedArtistId(undefined)}
              onRemoveProject={() => {
                form.setSelectedProjectId(undefined);
                form.setSelectedTrackId(undefined);
              }}
            />

            {/* Mode Content with Animation - Wizard removed for UX simplification */}
            <Suspense fallback={<FormSkeleton />}>
              <AnimatePresence mode="wait">
                {form.mode === 'simple' ? (
                  <GenerateFormSimple
                    description={form.description}
                    onDescriptionChange={form.setDescription}
                    title={form.title}
                    onTitleChange={form.setTitle}
                    hasVocals={form.hasVocals}
                    onHasVocalsChange={form.setHasVocals}
                    onBoostStyle={form.handleBoostStyle}
                    boostLoading={form.boostLoading}
                    onOpenStyles={() => setStylesOpen(true)}
                  />
                ) : (
                  <GenerateFormCustom
                    title={form.title}
                    onTitleChange={form.setTitle}
                    style={form.style}
                    onStyleChange={form.setStyle}
                    lyrics={form.lyrics}
                    onLyricsChange={form.setLyrics}
                    hasVocals={form.hasVocals}
                    onHasVocalsChange={form.setHasVocals}
                    onBoostStyle={form.handleBoostStyle}
                    boostLoading={form.boostLoading}
                    onOpenLyricsAssistant={() => setLyricsAssistantOpen(true)}
                    isPublic={form.isPublic}
                    onIsPublicChange={form.setIsPublic}
                    canMakePrivate={form.canMakePrivate}
                    advancedOpen={advancedOpen}
                    onAdvancedOpenChange={handleAdvancedToggle}
                    negativeTags={form.negativeTags}
                    onNegativeTagsChange={form.setNegativeTags}
                    vocalGender={form.vocalGender}
                    onVocalGenderChange={form.setVocalGender}
                    styleWeight={form.styleWeight}
                    onStyleWeightChange={form.setStyleWeight}
                    weirdnessConstraint={form.weirdnessConstraint}
                    onWeirdnessConstraintChange={form.setWeirdnessConstraint}
                    audioWeight={form.audioWeight}
                    onAudioWeightChange={form.setAudioWeight}
                    hasReferenceAudio={!!form.audioFile || !!activeReference}
                    hasPersona={!!form.selectedArtistId}
                    onOpenStyles={() => setStylesOpen(true)}
                  />
                )}
              </AnimatePresence>
            </Suspense>
          </div>
        </ScrollArea>

        {/* Footer - keyboard-aware padding */}
        <div 
          className="p-4 border-t bg-background/95 backdrop-blur"
          style={{
            // Применяем padding для клавиатуры + safe-area
            paddingBottom: isKeyboardOpen
              ? `${keyboardHeight + 16}px`
              : 'max(1rem, env(safe-area-inset-bottom))',
            transition: 'padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Credit balance indicator */}
          <div className="flex items-center justify-between mb-2">
            <CreditBalanceIndicator 
              balance={form.userBalance} 
              cost={form.generationCost} 
            />
            {form.loading && (
              <span className="text-xs text-muted-foreground animate-pulse">Создание...</span>
            )}
          </div>
          {form.loading && (
            <div className="mb-1.5">
              <Progress value={33} className="h-1" />
            </div>
          )}
          <div className="flex gap-2">
            {/* SecondaryButton fallback - Save Draft */}
            {shouldShowSecondaryUIButton && (
              <Button
                onClick={() => {
                  hapticFeedback('light');
                  notify.success('Черновик сохранён');
                }}
                variant="outline"
                disabled={form.loading || !hasUnsavedData}
                className="flex-1 h-12 text-sm font-semibold rounded-xl"
              >
                Сохранить черновик
              </Button>
            )}
            {/* MainButton fallback - Generate */}
            {shouldShowUIButton && (
              <Button
                onClick={handleGenerate}
                disabled={form.loading}
                className={cn(
                  "h-12 text-sm font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-xl disabled:opacity-50",
                  shouldShowSecondaryUIButton ? "flex-1" : "w-full"
                )}
              >
                {form.loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Сгенерировать
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>

      {/* Dialogs */}
      <ProjectTrackSelector
        type={projectTrackStep}
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) {
            setProjectTrackStep('project');
          }
        }}
        projects={projects}
        tracks={projectTrackStep === 'track' ? projectTracks : undefined}
        selectedId={projectTrackStep === 'project' ? form.selectedProjectId : form.selectedTrackId}
        onSelect={projectTrackStep === 'project' ? handleProjectSelect : form.handleTrackSelect}
      />

      <ArtistSelector
        open={artistDialogOpen}
        onOpenChange={setArtistDialogOpen}
        artists={artists}
        selectedArtistId={form.selectedArtistId}
        onSelect={form.handleArtistSelect}
      />

      {/* Audio Action Dialog - for cover/extend operations */}
      <AudioActionDialog
        open={audioActionDialogOpen}
        onOpenChange={setAudioActionDialogOpen}
        onAudioSelected={(file, mode) => {
          form.setAudioFile(file);
          form.setMode('custom');
          // Set mode-specific audio weight based on cover/extend selection
          if (mode === 'extend') {
            // High audio weight for extending - preserves original characteristics
            form.setAudioWeight([0.9]);
          } else {
            // Moderate audio weight for cover - allows more creative variation
            form.setAudioWeight([0.5]);
          }
          notify.success(mode === 'cover' ? 'Аудио для кавера добавлено' : 'Аудио для расширения добавлено');
        }}
        onAnalysisComplete={(styleDescription) => {
          form.setMode('custom');
          form.setStyle(prevStyle => {
            const newStyle = prevStyle
              ? `${prevStyle}\n\n${styleDescription}`
              : styleDescription;
            return newStyle;
          });
        }}
        onLyricsExtracted={(lyrics) => {
          form.setMode('custom');
          form.setHasVocals(true);
          form.setLyrics(lyrics);
        }}
        onChordsDetected={(chords, progression) => {
          form.setMode('custom');
          // Add chord progression to style description
          const chordInfo = `Guitar chord progression: ${progression}`;
          form.setStyle(prevStyle => {
            return prevStyle ? `${prevStyle}\n\n${chordInfo}` : chordInfo;
          });
          notify.success(`Обнаружено ${chords.length} аккордов`);
        }}
        onOpenCoverDialog={(file, mode) => {
          // Instead of opening legacy UploadAudioDialog, 
          // use unified audio reference system and switch form to custom mode
          hapticFeedback?.('light');
          
          // Close the audio action dialog
          setAudioActionDialogOpen(false);
          
          // Switch form to custom mode with appropriate audio weight
          form.setMode('custom');
          if (mode === 'extend') {
            form.setAudioWeight([0.9]);
          } else {
            form.setAudioWeight([0.5]);
          }
          
          // Open advanced settings to show provider selector
          setAdvancedOpen(true);
          
          notify.success(mode === 'cover' ? 'Режим кавера активирован' : 'Режим расширения активирован', {
            description: 'Настройте параметры в форме генерации',
          });
        }}
      />

      <LyricsChatAssistant
        open={lyricsAssistantOpen}
        onOpenChange={setLyricsAssistantOpen}
        onLyricsGenerated={(newLyrics: string) => {
          form.setMode('custom');
          form.setHasVocals(true);
          form.setLyrics(newLyrics);
          notify.success('Текст песни добавлен! 🎤', {
            description: 'Лирика с профессиональными тегами Suno готова к генерации',
          });
        }}
        onStyleGenerated={(generatedStyle: string) => {
          if (generatedStyle && generatedStyle.trim()) {
            form.setStyle(generatedStyle);
          }
        }}
        onTitleGenerated={(generatedTitle: string) => {
          if (generatedTitle && generatedTitle.trim()) {
            form.setTitle(generatedTitle);
          }
        }}
        initialGenre={projects?.find(p => p.id === form.selectedProjectId)?.genre || undefined}
        initialMood={projects?.find(p => p.id === form.selectedProjectId)?.mood ? [projects.find(p => p.id === form.selectedProjectId)!.mood!] : undefined}
        initialLanguage={(projects?.find(p => p.id === form.selectedProjectId)?.language as 'ru' | 'en') || 'ru'}
        projectContext={form.selectedProjectId ? (() => {
          const project = projects?.find(p => p.id === form.selectedProjectId);
          if (!project) return undefined;
          return {
            projectId: project.id,
            projectTitle: project.title,
            genre: project.genre || undefined,
            mood: project.mood || undefined,
            language: project.language as 'ru' | 'en' | undefined,
            concept: project.concept || undefined,
            targetAudience: project.target_audience || undefined,
            referenceArtists: project.reference_artists || undefined,
            projectType: project.project_type || undefined,
            existingTracks: allTracks?.filter(t => t.project_id === project.id).map((t, index) => ({
              title: t.title || 'Untitled',
              position: index + 1,
              stylePrompt: t.style || undefined,
              generatedLyrics: t.lyrics || undefined,
              draftLyrics: undefined,
            })),
          };
        })() : undefined}
        trackContext={form.selectedTrackId ? (() => {
          const track = allTracks?.find(t => t.id === form.selectedTrackId);
          if (!track) return undefined;
          return {
            title: track.title || 'Untitled',
            position: 1,
            stylePrompt: track.style || undefined,
            draftLyrics: undefined,
            generatedLyrics: track.lyrics || undefined,
          };
        })() : undefined}
      />

      <PromptHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectPrompt={(prompt) => {
          // Map wizard to custom if it exists in old history
          const mode = prompt.mode === 'wizard' ? 'custom' : prompt.mode;
          form.setMode(mode as 'simple' | 'custom');
          if (mode === 'simple') {
            form.setDescription(prompt.description || '');
          } else {
            form.setTitle(prompt.title || '');
            form.setStyle(prompt.style || '');
            form.setLyrics(prompt.lyrics || '');
          }
          if (prompt.model) form.setModel(prompt.model);
        }}
      />

      <StylePresetSelector
        open={stylesOpen}
        onOpenChange={setStylesOpen}
        currentStyle={form.style}
        onSelect={(style, tags) => {
          form.setMode('custom');
          form.setStyle(prevStyle => {
            if (prevStyle && prevStyle.trim()) {
              return `${prevStyle}, ${style}`;
            }
            return style;
          });
          notify.success('Стиль применён');
        }}
      />
    </Sheet>
    </>
  );
};