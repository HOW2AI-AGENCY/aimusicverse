import { useState } from 'react';
import { AnimatePresence, motion } from '@/lib/motion';
import { Sheet, SheetContent, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjectsOptimized';
import { useArtists } from '@/hooks/useArtists';
import { useTracks } from '@/hooks/useTracksOptimized';
import { useGenerateForm } from '@/hooks/generation';
import { useTelegram } from '@/contexts/TelegramContext';

// Form components
import { GenerateFormHeaderCompact } from './generate-form/GenerateFormHeaderCompact';
import { GenerateFormActions } from './generate-form/GenerateFormActions';
import { GenerateFormReferences } from './generate-form/GenerateFormReferences';
import { GenerateFormSimple } from './generate-form/GenerateFormSimple';
import { GenerateFormCustom } from './generate-form/GenerateFormCustom';
import { GenerationLoadingState } from './generate-form/GenerationLoadingState';

// Dialogs
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
  const [audioActionDialogOpen, setAudioActionDialogOpen] = useState(false); // For reference audio selection
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);
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
      <SheetContent side="bottom" className="h-[92vh] flex flex-col frost-sheet p-0">
        {/* Compact Header */}
        <div className="px-3 pt-2 pb-1.5 flex items-center justify-between border-b shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-sm font-semibold">Создать трек</h2>
          </div>
          <GenerateFormHeaderCompact
            userBalance={form.userBalance}
            generationCost={form.generationCost}
            canGenerate={form.canGenerate}
            apiCredits={form.apiCredits}
            mode={form.mode}
            onModeChange={form.setMode}
            model={form.model}
            onModelChange={form.setModel}
            isAdmin={form.isAdmin}
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

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-3 py-2 space-y-2">
            {/* Quick Action Buttons */}
            <GenerateFormActions
              onOpenAudioDialog={() => setAudioActionDialogOpen(true)}
              onOpenArtistDialog={() => setArtistDialogOpen(true)}
              onOpenProjectDialog={() => setProjectDialogOpen(true)}
              onOpenHistory={() => setHistoryOpen(true)}
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
          </div>
        </ScrollArea>

        {/* Footer with progress indicator */}
        <div className="p-2.5 border-t bg-background/95 backdrop-blur shrink-0">
          {form.loading && (
            <div className="mb-1.5">
              <Progress value={33} className="h-1" />
            </div>
          )}
          <Button
            onClick={handleGenerate}
            disabled={form.loading}
            className="w-full h-10 text-sm gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg disabled:opacity-50"
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
          toast.success(mode === 'cover' ? 'Аудио для кавера добавлено' : 'Аудио для расширения добавлено');
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
          // Notify user that lyrics are ready
          toast.success('Текст песни добавлен! 🎤', {
            description: 'Лирика с профессиональными тегами Suno готова к генерации',
          });
        }}
        onStyleGenerated={(generatedStyle: string) => {
          // Always update style with AI-generated one
          form.setStyle(generatedStyle);
          // Auto-generate title if empty
          if (!form.title && generatedStyle) {
            const firstGenre = generatedStyle.split(',')[0].trim();
            form.setTitle(firstGenre.length > 30 ? firstGenre.slice(0, 30) : firstGenre);
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