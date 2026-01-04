import { Button } from '@/components/ui/button';
import { FileAudio, User, FolderOpen, Music2, Loader2 } from 'lucide-react';
import { InlineReferencePreview } from '@/components/audio-reference';
import { useAudioReference } from '@/hooks/useAudioReference';

interface GenerateFormReferencesProps {
  planTrackId?: string;
  planTrackTitle?: string;
  audioFile: File | null;
  audioReferenceLoading: boolean;
  selectedArtistId?: string;
  selectedProjectId?: string;
  artists?: { id: string; name: string }[];
  projects?: { id: string; title: string }[];
  onRemoveAudioFile: () => void;
  onRemoveArtist: () => void;
  onRemoveProject: () => void;
  onOpenReferenceDrawer?: () => void;
}

export function GenerateFormReferences({
  planTrackId,
  planTrackTitle,
  audioFile,
  audioReferenceLoading,
  selectedArtistId,
  selectedProjectId,
  artists,
  projects,
  onRemoveAudioFile,
  onRemoveArtist,
  onRemoveProject,
  onOpenReferenceDrawer,
}: GenerateFormReferencesProps) {
  const { activeReference } = useAudioReference();
  
  // Check for unified reference (takes priority over legacy audioFile)
  const hasUnifiedReference = !!activeReference;
  const hasReferences = hasUnifiedReference || audioFile || audioReferenceLoading || selectedArtistId || selectedProjectId || planTrackId;

  if (!hasReferences) return null;

  return (
    <div className="space-y-2">
      {planTrackId && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <Music2 className="w-4 h-4 text-green-500" />
          <span className="text-xs flex-1 truncate text-green-600 dark:text-green-400">
            Из плана проекта: {planTrackTitle}
          </span>
        </div>
      )}

      {/* Unified Reference Preview - takes priority */}
      {hasUnifiedReference && (
        <InlineReferencePreview 
          onRemove={onRemoveAudioFile}
          onOpenDrawer={onOpenReferenceDrawer}
          showModeSelector={true}
          showAnalysis={true}
        />
      )}

      {/* Legacy loading state */}
      {audioReferenceLoading && !audioFile && !hasUnifiedReference && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-pulse">
          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
          <span className="text-xs flex-1 text-amber-600 dark:text-amber-400">
            Загрузка аудио референса...
          </span>
        </div>
      )}

      {/* Legacy audioFile display - only show if no unified reference */}
      {audioFile && !hasUnifiedReference && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <FileAudio className="w-4 h-4 text-primary" />
          <span className="text-xs flex-1 truncate">{audioFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onRemoveAudioFile}
          >
            <span className="text-xs">✕</span>
          </Button>
        </div>
      )}

      {selectedArtistId && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <User className="w-4 h-4 text-primary" />
          <span className="text-xs flex-1 truncate">
            {artists?.find(a => a.id === selectedArtistId)?.name || 'Персона'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onRemoveArtist}
          >
            <span className="text-xs">✕</span>
          </Button>
        </div>
      )}

      {selectedProjectId && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span className="text-xs flex-1 truncate">
            {projects?.find(p => p.id === selectedProjectId)?.title || 'Проект'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onRemoveProject}
          >
            <span className="text-xs">✕</span>
          </Button>
        </div>
      )}
    </div>
  );
}