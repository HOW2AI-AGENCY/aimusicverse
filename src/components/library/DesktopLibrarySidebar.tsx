/**
 * Desktop Library Sidebar - Generation form as a collapsible sidebar
 * Shows generation form in the library for quick access on desktop
 */

import { useState, useCallback, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';
import { useArtists } from '@/hooks/useArtists';
import { useTracks } from '@/hooks/useTracks';
import { useGenerateForm, useAudioReference } from '@/hooks/generation';
import { CollapsibleFormHeader } from '@/components/generate-form/CollapsibleFormHeader';
import { GenerateFormActions } from '@/components/generate-form/GenerateFormActions';
import { GenerateFormReferences } from '@/components/generate-form/GenerateFormReferences';
import { GenerationLoadingState } from '@/components/generate-form/GenerationLoadingState';
import { AudioActionDialog } from '@/components/generate-form/AudioActionDialog';
import { ArtistSelector } from '@/components/generate-form/ArtistSelector';
import { ProjectTrackSelector } from '@/components/generate-form/ProjectTrackSelector';
import { PromptHistory } from '@/components/generate-form/PromptHistory';
import { LyricsChatAssistant } from '@/components/generate-form/LyricsChatAssistant';
import { StylePresetSelector } from '@/components/generate-form/StylePresetSelector';

// Lazy load heavy form components
const GenerateFormSimple = lazy(() => 
  import('@/components/generate-form/GenerateFormSimple').then(m => ({ default: m.GenerateFormSimple }))
);
const GenerateFormCustom = lazy(() => 
  import('@/components/generate-form/GenerateFormCustom').then(m => ({ default: m.GenerateFormCustom }))
);

// Form skeleton for lazy loading
const FormSkeleton = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-10 w-full" />
  </div>
);

interface DesktopLibrarySidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function DesktopLibrarySidebar({
  isCollapsed,
  onToggleCollapse,
  className,
}: DesktopLibrarySidebarProps) {
  const { projects } = useProjects();
  const { artists } = useArtists();
  const { tracks: allTracks } = useTracks();
  const { activeReference } = useAudioReference();

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [audioActionDialogOpen, setAudioActionDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lyricsAssistantOpen, setLyricsAssistantOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);
  const [projectTrackStep, setProjectTrackStep] = useState<'project' | 'track'>('project');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Form hook with sidebar-specific settings
  const form = useGenerateForm({
    open: true,
    onOpenChange: () => {},
    projects,
    artists,
    allTracks,
  });

  const projectTracks = form.selectedProjectId
    ? allTracks?.filter(t => t.project_id === form.selectedProjectId)
    : [];

  const handleProjectSelect = (projectId: string) => {
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

  const handleGenerate = () => {
    form.handleGenerate();
  };

  if (isCollapsed) {
    return (
      <div className={cn(
        "w-12 flex-shrink-0 bg-card/50 border-r border-border/30 flex flex-col items-center py-4",
        className
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20"
          title="Открыть форму генерации"
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 340, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex-shrink-0 bg-card/50 border-r border-border/30 flex flex-col overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="px-3 py-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Создать трек</h3>
          </div>
          <div className="flex items-center gap-1">
            <CollapsibleFormHeader
              balance={form.userBalance}
              cost={form.generationCost}
              mode={form.mode}
              onModeChange={form.setMode}
              model={form.model}
              onModelChange={form.setModel}
              onOpenHistory={() => setHistoryOpen(true)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-7 w-7"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
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
                compact={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        <ScrollArea className="flex-1">
          <div className="px-3 py-3 space-y-3">
            {/* Quick Actions */}
            <GenerateFormActions
              onOpenAudioDialog={() => setAudioActionDialogOpen(true)}
              onOpenProjectDialog={() => setProjectDialogOpen(true)}
              onOpenArtistDialog={() => setArtistDialogOpen(true)}
            />

            {/* References */}
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

            {/* Form Content */}
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
                    hasReferenceAudio={!!form.audioFile || !!activeReference}
                    hasPersona={!!form.selectedArtistId}
                    onOpenStyles={() => setStylesOpen(true)}
                  />
                )}
              </AnimatePresence>
            </Suspense>
          </div>
        </ScrollArea>

        {/* Generate Button */}
        <div className="p-3 border-t border-border/30">
          <Button
            onClick={handleGenerate}
            disabled={form.loading}
            className="w-full h-11 text-sm font-semibold gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-xl"
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
      </motion.div>

      {/* Dialogs */}
      <ProjectTrackSelector
        type={projectTrackStep}
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) setProjectTrackStep('project');
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
        open={audioActionDialogOpen}
        onOpenChange={setAudioActionDialogOpen}
        onAudioSelected={(file, mode) => {
          form.setAudioFile(file);
          form.setMode('custom');
          if (mode === 'extend') {
            form.setAudioWeight([0.9]);
          } else {
            form.setAudioWeight([0.5]);
          }
          toast.success(mode === 'cover' ? 'Аудио для кавера' : 'Аудио для расширения');
        }}
        onAnalysisComplete={(styleDescription) => {
          form.setMode('custom');
          form.setStyle(prev => prev ? `${prev}\n\n${styleDescription}` : styleDescription);
        }}
        onLyricsExtracted={(lyrics) => {
          form.setMode('custom');
          form.setHasVocals(true);
          form.setLyrics(lyrics);
        }}
        onChordsDetected={(chords, progression) => {
          form.setMode('custom');
          const chordInfo = `Guitar chord progression: ${progression}`;
          form.setStyle(prev => prev ? `${prev}\n\n${chordInfo}` : chordInfo);
        }}
        onOpenCoverDialog={(file, mode) => {
          setAudioActionDialogOpen(false);
          form.setMode('custom');
          form.setAudioWeight(mode === 'extend' ? [0.9] : [0.5]);
          setAdvancedOpen(true);
        }}
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

      <LyricsChatAssistant
        open={lyricsAssistantOpen}
        onOpenChange={setLyricsAssistantOpen}
        onLyricsGenerated={(newLyrics) => {
          form.setMode('custom');
          form.setHasVocals(true);
          form.setLyrics(newLyrics);
        }}
        onStyleGenerated={(style) => {
          if (style?.trim()) form.setStyle(style);
        }}
        onTitleGenerated={(title) => {
          if (title?.trim()) form.setTitle(title);
        }}
      />

      <StylePresetSelector
        open={stylesOpen}
        onOpenChange={setStylesOpen}
        currentStyle={form.style}
        onSelect={(style, tags) => {
          form.setMode('custom');
          form.setStyle(prev => prev?.trim() ? `${prev}, ${style}` : style);
          toast.success('Стиль применён');
        }}
      />
    </>
  );
}
