import { useState } from 'react';
import { AnimatePresence } from '@/lib/motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjectsOptimized';
import { useArtists } from '@/hooks/useArtists';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useGenerateForm } from '@/hooks/generation';
import { useTelegram } from '@/contexts/TelegramContext';

// Form components
import { GenerateFormHeader } from './generate-form/GenerateFormHeader';
import { GenerateFormActions } from './generate-form/GenerateFormActions';
import { GenerateFormReferences } from './generate-form/GenerateFormReferences';
import { GenerateFormSimple } from './generate-form/GenerateFormSimple';
import { GenerateFormCustom } from './generate-form/GenerateFormCustom';
import { GenerationLoadingState } from './generate-form/GenerationLoadingState';

// Dialogs
import { UploadAudioDialog } from './UploadAudioDialog';
import { AudioActionDialog } from './generate-form/AudioActionDialog';
import { ArtistSelector } from './generate-form/ArtistSelector';
import { ProjectTrackSelector } from './generate-form/ProjectTrackSelector';
import { PromptHistory } from './generate-form/PromptHistory';
import { LyricsChatAssistant } from './generate-form/LyricsChatAssistant';

interface GenerateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export const GenerateSheet = ({ open, onOpenChange, projectId: initialProjectId }: GenerateSheetProps) => {
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();
  const { hapticFeedback } = useTelegram();

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);
  const [uploadAudioOpen, setUploadAudioOpen] = useState(false);
  const [uploadAudioMode, setUploadAudioMode] = useState<'extend' | 'cover'>('extend');
  const [projectTrackStep, setProjectTrackStep] = useState<'project' | 'track'>('project');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Form hook
  const form = useGenerateForm({
    open,
    onOpenChange,
    initialProjectId,
    projects,
    artists,
    allTracks,
  });

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
      toast.info('Проект выбран', {
        description: 'В проекте пока нет треков',
      });
    }
  };

  const handleClearDraft = () => {
    hapticFeedback('medium');
    form.clearDraft();
    form.resetForm();
    toast.success('Черновик очищен');
  };

  const handleGenerate = () => {
    hapticFeedback('medium');
    form.handleGenerate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col frost-sheet p-0">
        <SheetHeader className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4 sm:pb-3">
          <SheetTitle className="text-base sm:text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Создать трек
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-3 pb-4 sm:px-4 sm:pb-6 space-y-3">
            {/* Header with controls */}
            <GenerateFormHeader
              userBalance={form.userBalance}
              generationCost={form.generationCost}
              canGenerate={form.canGenerate}
              apiCredits={form.apiCredits}
              mode={form.mode}
              onModeChange={form.setMode}
              model={form.model}
              onModelChange={form.setModel}
              hasDraft={form.hasDraft}
              onClearDraft={handleClearDraft}
              onOpenHistory={() => setHistoryOpen(true)}
              advancedOpen={advancedOpen}
              onAdvancedOpenChange={setAdvancedOpen}
              isAdmin={form.isAdmin}
            />

            {/* Quick Action Buttons */}
            <GenerateFormActions
              onOpenAudioDialog={() => setAudioDialogOpen(true)}
              onOpenArtistDialog={() => setArtistDialogOpen(true)}
              onOpenProjectDialog={() => setProjectDialogOpen(true)}
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

            {/* Mode Content with Animation */}
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
                  advancedOpen={advancedOpen}
                  onAdvancedOpenChange={setAdvancedOpen}
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
                  hasReferenceAudio={!!form.audioFile}
                  hasPersona={!!form.selectedArtistId}
                  model={form.model}
                  onModelChange={form.setModel}
                />
              )}
            </AnimatePresence>

            {/* Show generation loading state when processing */}
            {form.loading && (
              <div className="p-4 mt-4">
                <GenerationLoadingState
                  stage="processing"
                  showCancel={false}
                  compact={false}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="p-3 sm:p-4 bg-background/95 backdrop-blur-xl border-t">
          <Button
            onClick={handleGenerate}
            disabled={form.loading}
            className="w-full h-12 text-sm gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
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
        </SheetFooter>
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

      <AudioActionDialog
        open={audioDialogOpen}
        onOpenChange={setAudioDialogOpen}
        onAudioSelected={(file) => {
          form.setAudioFile(file);
          form.setMode('custom');
          toast.success('Аудио добавлено');
        }}
        onAnalysisComplete={(styleDescription) => {
          if (form.mode === 'custom') {
            form.setStyle(prevStyle => {
              const newStyle = prevStyle
                ? `${prevStyle}\n\nАнализ референса:\n${styleDescription}`
                : styleDescription;
              toast.success('Стиль обновлен с результатами анализа');
              return newStyle;
            });
          }
        }}
      />

      <LyricsChatAssistant
        open={lyricsAssistantOpen}
        onOpenChange={setLyricsAssistantOpen}
        onLyricsGenerated={(newLyrics: string) => {
          // Switch to custom mode when lyrics are generated
          form.setMode('custom');
          // Ensure vocals are enabled
          form.setHasVocals(true);
          // Set the generated lyrics
          form.setLyrics(newLyrics);
        }}
        onStyleGenerated={(generatedStyle: string) => {
          if (!form.style || form.style.length < generatedStyle.length) {
            form.setStyle(generatedStyle);
          }
        }}
        initialGenre={projects?.find(p => p.id === form.selectedProjectId)?.genre || undefined}
      />

      <UploadAudioDialog
        open={uploadAudioOpen}
        onOpenChange={setUploadAudioOpen}
        projectId={form.selectedProjectId || initialProjectId}
        defaultMode={uploadAudioMode}
      />

      <PromptHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectPrompt={(prompt) => {
          form.setMode(prompt.mode);
          if (prompt.mode === 'simple') {
            form.setDescription(prompt.description || '');
          } else {
            form.setTitle(prompt.title || '');
            form.setStyle(prompt.style || '');
            form.setLyrics(prompt.lyrics || '');
          }
          if (prompt.model) form.setModel(prompt.model);
        }}
      />
    </Sheet>
  );
};