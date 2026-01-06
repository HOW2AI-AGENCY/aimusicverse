/**
 * TrackReferencesSection - Artist, Project, and Audio references
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { FileAudio, User, FolderOpen, Headphones, Link2 } from 'lucide-react';
import { DetailSection } from '@/components/common/DetailSection';
import { formatDuration } from '@/lib/player-utils';

interface Artist {
  id: string;
  name: string;
  avatar_url?: string | null;
  genre_tags?: string[] | null;
}

interface Project {
  id: string;
  title: string;
  cover_url?: string | null;
  genre?: string | null;
}

interface ReferenceAudio {
  id: string;
  file_name: string;
  file_url?: string | null;
  genre?: string | null;
  mood?: string | null;
  bpm?: number | null;
  style_description?: string | null;
  duration_seconds?: number | null;
}

interface TrackReferencesSectionProps {
  artist?: Artist | null;
  project?: Project | null;
  referenceAudio?: ReferenceAudio | null;
  streamingUrl?: string | null;
  generationMode?: string | null;
  isCoverOrExtension?: boolean;
}

export const TrackReferencesSection = memo(function TrackReferencesSection({
  artist,
  project,
  referenceAudio,
  streamingUrl,
  generationMode,
  isCoverOrExtension,
}: TrackReferencesSectionProps) {
  const hasReferences = artist || project || referenceAudio || (isCoverOrExtension && streamingUrl);
  
  if (!hasReferences) return null;

  return (
    <DetailSection icon={FileAudio} title="Референсы" showSeparator>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Artist Reference */}
        {artist && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {artist.avatar_url ? (
                <img src={artist.avatar_url} alt={artist.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">AI Артист</p>
              <p className="font-medium truncate">{artist.name}</p>
              {artist.genre_tags && artist.genre_tags.length > 0 && (
                <p className="text-xs text-muted-foreground truncate">{artist.genre_tags.slice(0, 2).join(', ')}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Project Reference */}
        {project && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {project.cover_url ? (
                <img src={project.cover_url} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Проект</p>
              <p className="font-medium truncate">{project.title}</p>
              {project.genre && (
                <p className="text-xs text-muted-foreground truncate">{project.genre}</p>
              )}
            </div>
          </div>
        )}

        {/* Audio Reference - for covers/extensions */}
        {referenceAudio && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 sm:col-span-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Аудио референс</p>
              <p className="font-medium truncate">{referenceAudio.file_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {referenceAudio.genre && <span>{referenceAudio.genre}</span>}
                {referenceAudio.bpm && <span>• {referenceAudio.bpm} BPM</span>}
                {referenceAudio.duration_seconds && (
                  <span>• {formatDuration(referenceAudio.duration_seconds)}</span>
                )}
              </div>
            </div>
            {referenceAudio.file_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => window.open(referenceAudio.file_url!, '_blank')}
              >
                <Link2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Streaming URL reference for covers/extensions when no reference_audio found */}
        {!referenceAudio && isCoverOrExtension && streamingUrl && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 sm:col-span-2">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {generationMode === 'cover' ? 'Оригинальный трек' : 'Исходный трек'}
              </p>
              <p className="font-medium truncate">Внешний аудио-референс</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => window.open(streamingUrl, '_blank')}
            >
              <Link2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </DetailSection>
  );
});
