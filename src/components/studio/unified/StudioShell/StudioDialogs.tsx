/**
 * StudioDialogs - All dialogs/sheets for StudioShell
 * Extracted from StudioShell for better maintainability
 * 
 * This component renders all the modal dialogs, sheets, and drawers
 * used by the studio interface.
 */

import { memo, Suspense } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StudioMixerPanel } from '../StudioMixerPanel';
import { ExportMixDialog } from '../ExportMixDialog';
import { StemEffectsDrawer } from '../StemEffectsDrawer';
import { ImportAudioDialog } from '../ImportAudioDialog';
import { StudioDownloadPanel } from '../StudioDownloadPanel';
import { StudioTranscriptionPanel } from '../StudioTranscriptionPanel';
import { StudioNotationPanel } from '../StudioNotationPanel';
import { SaveVersionDialog } from '../SaveVersionDialog';
import { StudioArrangementDialog } from '../StudioArrangementDialog';
import { StemSeparationModeDialog } from '../StemSeparationModeDialog';
import { InstrumentalResultHandler, InstrumentalResultData } from '../InstrumentalResultHandler';
import { ExtendTrackDialog } from '@/components/ExtendTrackDialog';
import { SectionEditorSheet } from '@/components/studio/editor/SectionEditorSheet';
import { StudioActionsSheet } from '../StudioActionsSheet';
import { AddTrackDialog } from './AddTrackDialog';
import { LazyAddVocalsDrawer, LazyGenerateSheet } from '@/components/lazy';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { StudioTrack, TrackType, TRACK_COLORS } from '@/stores/useUnifiedStudioStore';
import type { StemEffects } from '@/hooks/studio/types';
import type { Track } from '@/types/track';

interface StudioDialogsProps {
  isMobile: boolean;
  projectId: string;
  projectName: string;
  sourceTrackId?: string;
  tracks: StudioTrack[];
  masterVolume: number;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  detectedSections: any[];
  
  // Dialog states
  showMixerSheet: boolean;
  showExportDialog: boolean;
  showEffectsDrawer: boolean;
  showImportDialog: boolean;
  showDownloadPanel: boolean;
  showTranscriptionPanel: boolean;
  showNotationPanel: boolean;
  showSaveVersionDialog: boolean;
  showArrangementDialog: boolean;
  showStemSeparationDialog: boolean;
  showInstrumentalResult: boolean;
  showExtendDialog: boolean;
  showSectionEditor: boolean;
  showActionsSheet: boolean;
  showAddTrackDialog: boolean;
  showAddVocalsDrawer: boolean;
  showGenerateSheet: boolean;
  
  // Selected items
  selectedEffectsTrack: StudioTrack | null;
  selectedTranscriptionTrack: StudioTrack | null;
  selectedNotationTrack: StudioTrack | null;
  selectedArrangementTrack: StudioTrack | null;
  selectedExtendTrack: StudioTrack | null;
  selectedSectionTrack: StudioTrack | null;
  selectedVocalsTrack: StudioTrack | null;
  instrumentalResultData: InstrumentalResultData | null;
  
  // Effects state
  trackEffects: Record<string, StemEffects>;
  defaultStemEffects: StemEffects;
  
  // State flags
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isSeparating: boolean;
  
  // Event handlers
  onSetShowMixerSheet: (open: boolean) => void;
  onSetShowExportDialog: (open: boolean) => void;
  onSetShowEffectsDrawer: (open: boolean) => void;
  onSetShowImportDialog: (open: boolean) => void;
  onSetShowDownloadPanel: (open: boolean) => void;
  onSetShowTranscriptionPanel: (open: boolean) => void;
  onSetShowNotationPanel: (open: boolean) => void;
  onSetShowSaveVersionDialog: (open: boolean) => void;
  onSetShowArrangementDialog: (open: boolean) => void;
  onSetShowStemSeparationDialog: (open: boolean) => void;
  onSetShowInstrumentalResult: (open: boolean) => void;
  onSetShowExtendDialog: (open: boolean) => void;
  onSetShowSectionEditor: (open: boolean) => void;
  onSetShowActionsSheet: (open: boolean) => void;
  onSetShowAddTrackDialog: (open: boolean) => void;
  onSetShowAddVocalsDrawer: (open: boolean) => void;
  onSetShowGenerateSheet: (open: boolean) => void;
  
  onSetSelectedTranscriptionTrack: (track: StudioTrack | null) => void;
  onSetSelectedNotationTrack: (track: StudioTrack | null) => void;
  onSetSelectedArrangementTrack: (track: StudioTrack | null) => void;
  onSetSelectedExtendTrack: (track: StudioTrack | null) => void;
  onSetSelectedSectionTrack: (track: StudioTrack | null) => void;
  onSetSelectedVocalsTrack: (track: StudioTrack | null) => void;
  onSetInstrumentalResultData: (data: InstrumentalResultData | null) => void;
  
  // Actions
  onSave: () => void;
  onExport: () => void;
  onBack: () => void;
  onAddTrack: (type: TrackType, name: string) => void;
  onImportTrack: (audioUrl: string, name: string, type: TrackType, duration?: number) => void;
  onStemSeparation: (mode: 'simple' | 'detailed') => void;
  onClearSectionSelection: () => void;
  onSeek: (time: number) => void;
  onVersionSaved: (version: { label: string }) => void;
  onUpdateEQ: (settings: any) => void;
  onUpdateCompressor: (settings: any) => void;
  onUpdateReverb: (settings: any) => void;
  onResetEffects: () => void;
  onInstrumentalApply: (action: string, selectedVersionLabel: string) => void;
  onArrangementSuccess: (taskId: string, title: string) => void;
  onVocalsSuccess: (newTrackId: string) => void;
  
  // Track colors
  TRACK_COLORS: typeof TRACK_COLORS;
}

export const StudioDialogs = memo(function StudioDialogs(props: StudioDialogsProps) {
  const {
    isMobile,
    projectId,
    projectName,
    sourceTrackId,
    tracks,
    masterVolume,
    duration,
    currentTime,
    isPlaying,
    detectedSections,
    TRACK_COLORS,
  } = props;

  // Map audio tracks for export
  const audioTracks = tracks
    .filter(t => t.status !== 'pending' && t.status !== 'failed')
    .map(t => ({
      url: t.audioUrl || t.clips?.[0]?.audioUrl || '',
      volume: t.volume,
      muted: t.muted,
    }));

  return (
    <>
      {/* Mobile Mixer Sheet */}
      <Sheet open={props.showMixerSheet} onOpenChange={props.onSetShowMixerSheet}>
        <SheetContent side="bottom" className="h-[60vh]">
          <SheetHeader>
            <SheetTitle>Микшер</SheetTitle>
          </SheetHeader>
          <StudioMixerPanel 
            className="h-full pt-4" 
            onAddTrack={() => {
              props.onSetShowMixerSheet(false);
              props.onSetShowAddTrackDialog(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={props.showAddTrackDialog}
        onOpenChange={props.onSetShowAddTrackDialog}
        onAdd={props.onAddTrack}
      />

      {/* Import Audio Dialog */}
      <ImportAudioDialog
        open={props.showImportDialog}
        onOpenChange={props.onSetShowImportDialog}
        projectId={projectId}
        onImport={props.onImportTrack}
      />

      {/* Export Mix Dialog */}
      <ExportMixDialog
        open={props.showExportDialog}
        onOpenChange={props.onSetShowExportDialog}
        tracks={audioTracks}
        masterVolume={masterVolume}
        trackTitle={projectName}
      />

      {/* Track Effects Drawer */}
      <StemEffectsDrawer
        open={props.showEffectsDrawer}
        onOpenChange={props.onSetShowEffectsDrawer}
        stem={props.selectedEffectsTrack ? {
          id: props.selectedEffectsTrack.id,
          stem_type: props.selectedEffectsTrack.type,
          audio_url: props.selectedEffectsTrack.audioUrl || '',
          track_id: projectId,
          separation_mode: null,
          version_id: null,
          created_at: new Date().toISOString(),
        } : null}
        effects={props.selectedEffectsTrack 
          ? (props.trackEffects[props.selectedEffectsTrack.id] || props.defaultStemEffects) 
          : props.defaultStemEffects
        }
        onUpdateEQ={props.onUpdateEQ}
        onUpdateCompressor={props.onUpdateCompressor}
        onUpdateReverb={props.onUpdateReverb}
        onReset={props.onResetEffects}
      />

      {/* Add Vocals Drawer */}
      {props.selectedVocalsTrack && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }>
          <LazyAddVocalsDrawer
            open={props.showAddVocalsDrawer}
            onOpenChange={props.onSetShowAddVocalsDrawer}
            track={{
              id: props.selectedVocalsTrack.id,
              title: props.selectedVocalsTrack.name,
              audio_url: props.selectedVocalsTrack.audioUrl || props.selectedVocalsTrack.clips[0]?.audioUrl || '',
              cover_url: null,
              style: null,
              type: props.selectedVocalsTrack.type === 'instrumental' ? 'instrumental' : 'complete',
              project_id: projectId,
              is_liked: false,
              likes_count: 0,
            } as unknown as Track}
            onSuccess={props.onVocalsSuccess}
          />
        </Suspense>
      )}

      {/* Extend Track Dialog */}
      {props.selectedExtendTrack && (
        <ExtendTrackDialog
          open={props.showExtendDialog}
          onOpenChange={(open) => {
            props.onSetShowExtendDialog(open);
            if (!open) props.onSetSelectedExtendTrack(null);
          }}
          track={{
            id: props.selectedExtendTrack.id,
            title: props.selectedExtendTrack.name,
            audio_url: props.selectedExtendTrack.audioUrl || props.selectedExtendTrack.clips[0]?.audioUrl || '',
            cover_url: null,
            style: null,
            duration_seconds: props.selectedExtendTrack.clips[0]?.duration || props.selectedExtendTrack.versions?.[0]?.duration || 60,
            project_id: projectId,
            suno_id: null,
            is_liked: false,
            likes_count: 0,
          } as unknown as Track}
        />
      )}

      {/* Section Editor Sheet */}
      {props.selectedSectionTrack && (
        <SectionEditorSheet
          open={props.showSectionEditor}
          onClose={() => {
            props.onSetShowSectionEditor(false);
            props.onSetSelectedSectionTrack(null);
            props.onClearSectionSelection();
          }}
          trackId={sourceTrackId || props.selectedSectionTrack.id}
          trackTitle={props.selectedSectionTrack.name}
          audioUrl={props.selectedSectionTrack.audioUrl || props.selectedSectionTrack.clips?.[0]?.audioUrl}
          duration={duration}
          detectedSections={detectedSections}
        />
      )}

      {/* Download Panel Sheet */}
      <Sheet open={props.showDownloadPanel} onOpenChange={props.onSetShowDownloadPanel}>
        <SheetContent 
          side={isMobile ? 'bottom' : 'right'} 
          className={cn(
            isMobile ? 'h-[80vh]' : 'w-full sm:max-w-md',
            'p-0'
          )}
        >
          <StudioDownloadPanel
            tracks={tracks}
            projectName={projectName}
            onClose={() => props.onSetShowDownloadPanel(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Transcription Panel Sheet */}
      <Sheet 
        open={props.showTranscriptionPanel} 
        onOpenChange={(open) => {
          props.onSetShowTranscriptionPanel(open);
          if (!open) props.onSetSelectedTranscriptionTrack(null);
        }}
      >
        <SheetContent 
          side={isMobile ? 'bottom' : 'right'} 
          className={cn(
            isMobile ? 'h-[80vh]' : 'w-full sm:max-w-md',
            'p-0'
          )}
        >
          {props.selectedTranscriptionTrack && (
            <StudioTranscriptionPanel
              track={props.selectedTranscriptionTrack}
              audioUrl={props.selectedTranscriptionTrack.audioUrl || props.selectedTranscriptionTrack.clips?.[0]?.audioUrl || ''}
              trackId={sourceTrackId || undefined}
              stemType={props.selectedTranscriptionTrack.type}
              onComplete={() => {}}
              onClose={() => {
                props.onSetShowTranscriptionPanel(false);
                props.onSetSelectedTranscriptionTrack(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Generate Sheet */}
      <Suspense fallback={null}>
        <LazyGenerateSheet
          open={props.showGenerateSheet}
          onOpenChange={props.onSetShowGenerateSheet}
        />
      </Suspense>

      {/* Arrangement Replacement Dialog */}
      {props.selectedArrangementTrack && (
        <StudioArrangementDialog
          open={props.showArrangementDialog}
          onClose={() => {
            props.onSetShowArrangementDialog(false);
            props.onSetSelectedArrangementTrack(null);
          }}
          vocalTrack={props.selectedArrangementTrack}
          projectName={projectName}
          onSuccess={props.onArrangementSuccess}
        />
      )}

      {/* Instrumental Result Handler Dialog */}
      <InstrumentalResultHandler
        open={props.showInstrumentalResult}
        onClose={() => {
          props.onSetShowInstrumentalResult(false);
          props.onSetInstrumentalResultData(null);
        }}
        data={props.instrumentalResultData}
        onApply={props.onInstrumentalApply}
      />

      {/* Save Version Dialog */}
      <SaveVersionDialog
        open={props.showSaveVersionDialog}
        onOpenChange={props.onSetShowSaveVersionDialog}
        projectId={projectId}
        sourceTrackId={sourceTrackId || undefined}
        tracks={tracks}
        masterVolume={masterVolume}
        onVersionSaved={props.onVersionSaved}
      />

      {/* Notation Panel Sheet */}
      <Sheet 
        open={props.showNotationPanel} 
        onOpenChange={(open) => {
          props.onSetShowNotationPanel(open);
          if (!open) props.onSetSelectedNotationTrack(null);
        }}
      >
        <SheetContent 
          side={isMobile ? 'bottom' : 'right'} 
          className={cn(
            isMobile ? 'h-[85vh]' : 'w-full sm:max-w-lg',
            'p-0'
          )}
        >
          {props.selectedNotationTrack && (
            <StudioNotationPanel
              track={props.selectedNotationTrack}
              trackId={sourceTrackId || undefined}
              stemType={props.selectedNotationTrack.type}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={props.onSeek}
              onClose={() => {
                props.onSetShowNotationPanel(false);
                props.onSetSelectedNotationTrack(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Stem Separation Mode Dialog */}
      <StemSeparationModeDialog
        open={props.showStemSeparationDialog}
        onOpenChange={props.onSetShowStemSeparationDialog}
        onConfirm={props.onStemSeparation}
        isProcessing={props.isSeparating}
      />

      {/* Mobile Actions Sheet */}
      <StudioActionsSheet
        open={props.showActionsSheet}
        onOpenChange={props.onSetShowActionsSheet}
        hasUnsavedChanges={props.hasUnsavedChanges}
        isSaving={props.isSaving}
        onSave={props.onSave}
        onExport={props.onExport}
        onOpenDownload={() => props.onSetShowDownloadPanel(true)}
        onOpenTranscription={() => {
          const firstTrack = tracks[0];
          if (firstTrack) {
            props.onSetSelectedTranscriptionTrack(firstTrack);
            props.onSetShowTranscriptionPanel(true);
          }
        }}
        onAddTrack={() => props.onSetShowAddTrackDialog(true)}
        onGenerate={() => props.onSetShowGenerateSheet(true)}
        onImport={() => props.onSetShowImportDialog(true)}
        onBack={props.onBack}
      />
    </>
  );
});
