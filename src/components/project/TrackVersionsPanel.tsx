/**
 * Panel showing all generated versions for a project track slot
 * Allows selecting master version and shows stems/MIDI/notes for master
 */
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Star,
  Music,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Mic2,
  Guitar,
  Drum,
  Piano,
  FileMusic,
  FileText,
  Download,
  ExternalLink
} from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useProjectGeneratedTracks, ProjectGeneratedTrack } from '@/hooks/useProjectGeneratedTracks';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from '@/lib/motion';
import { formatDuration } from '@/lib/formatters';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface TrackVersionsPanelProps {
  projectId: string;
  projectTrackId: string;
  projectTrackTitle: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

// Stem type display config
const STEM_ICONS: Record<string, React.ElementType> = {
  vocals: Mic2,
  instrumental: Piano,
  drums: Drum,
  bass: Guitar,
  other: Music,
};

const STEM_LABELS: Record<string, string> = {
  vocals: 'Вокал',
  instrumental: 'Инструментал',
  drums: 'Ударные',
  bass: 'Бас',
  other: 'Другое',
};

// Fetch stems for a track
function useTrackAssets(trackId: string | undefined) {
  // Fetch stems
  const { data: stems, isLoading: stemsLoading } = useQuery({
    queryKey: ['track-stems', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await supabase
        .from('track_stems')
        .select('*')
        .eq('track_id', trackId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!trackId,
  });

  // Fetch stem transcriptions (MIDI/notes)
  const { data: transcriptions, isLoading: transcriptionsLoading } = useQuery({
    queryKey: ['stem-transcriptions', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await supabase
        .from('stem_transcriptions')
        .select('*')
        .eq('track_id', trackId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!trackId,
  });

  // Fetch guitar recordings (for notes/tabs)
  const { data: guitarRecordings, isLoading: guitarLoading } = useQuery({
    queryKey: ['guitar-recordings', trackId],
    queryFn: async () => {
      if (!trackId) return [];
      const { data, error } = await supabase
        .from('guitar_recordings')
        .select('*')
        .eq('track_id', trackId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!trackId,
  });

  return {
    stems: stems || [],
    transcriptions: transcriptions || [],
    guitarRecordings: guitarRecordings || [],
    isLoading: stemsLoading || transcriptionsLoading || guitarLoading,
    hasStems: (stems?.length || 0) > 0,
    hasTranscriptions: (transcriptions?.length || 0) > 0,
    hasGuitarRecordings: (guitarRecordings?.length || 0) > 0,
  };
}

// Master version assets display
function MasterVersionAssets({ trackId }: { trackId: string }) {
  const navigate = useNavigate();
  const { stems, transcriptions, guitarRecordings, isLoading, hasStems, hasTranscriptions, hasGuitarRecordings } = useTrackAssets(trackId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 py-1">
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground">Загрузка...</span>
      </div>
    );
  }

  const hasAnyAssets = hasStems || hasTranscriptions || hasGuitarRecordings;

  if (!hasAnyAssets) {
    return null;
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-2 pt-2 border-t border-border/30"
      >
        <p className="text-[9px] text-muted-foreground mb-1.5">Ассеты мастер-версии:</p>
        
        <div className="flex flex-wrap gap-1">
          {/* Stems */}
          {hasStems && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[9px] gap-1"
                  onClick={() => navigate(`/studio/${trackId}`)}
                >
                  <Music className="w-3 h-3" />
                  Стемы ({stems.length})
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="space-y-0.5">
                  {stems.map(stem => {
                    const Icon = STEM_ICONS[stem.stem_type] || Music;
                    return (
                      <div key={stem.id} className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3" />
                        <span>{STEM_LABELS[stem.stem_type] || stem.stem_type}</span>
                      </div>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* MIDI/Transcriptions */}
          {hasTranscriptions && transcriptions.map(trans => (
            <Tooltip key={trans.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[9px] gap-1"
                  onClick={() => {
                    if (trans.midi_url) {
                      window.open(trans.midi_url, '_blank');
                    }
                  }}
                >
                  <FileMusic className="w-3 h-3" />
                  MIDI
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="space-y-0.5">
                  {trans.bpm && <div>BPM: {trans.bpm}</div>}
                  {trans.key_detected && <div>Тональность: {trans.key_detected}</div>}
                  {trans.notes_count && <div>Нот: {trans.notes_count}</div>}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Guitar tabs/notes */}
          {hasGuitarRecordings && guitarRecordings.map(rec => (
            <div key={rec.id} className="flex gap-1">
              {rec.gp5_url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[9px] gap-1"
                      onClick={() => window.open(rec.gp5_url!, '_blank')}
                    >
                      <Guitar className="w-3 h-3" />
                      GP5
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Guitar Pro файл</TooltipContent>
                </Tooltip>
              )}
              {rec.pdf_url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[9px] gap-1"
                      onClick={() => window.open(rec.pdf_url!, '_blank')}
                    >
                      <FileText className="w-3 h-3" />
                      Ноты
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>PDF с нотами</TooltipContent>
                </Tooltip>
              )}
              {rec.midi_url && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[9px] gap-1"
                      onClick={() => window.open(rec.midi_url!, '_blank')}
                    >
                      <FileMusic className="w-3 h-3" />
                      MIDI
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>MIDI файл</TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}

export const TrackVersionsPanel = memo(function TrackVersionsPanel({ 
  projectId, 
  projectTrackId, 
  projectTrackTitle,
  isExpanded = false,
  onToggle,
}: TrackVersionsPanelProps) {
  const navigate = useNavigate();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const { 
    tracksBySlot, 
    isLoading,
    setMasterTrack,
    isSettingMaster,
  } = useProjectGeneratedTracks(projectId);

  const versions = tracksBySlot[projectTrackId] || [];
  const versionsCount = versions.length;
  const masterVersion = versions.find(v => v.is_primary);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only show if there are versions for this slot
  if (versionsCount === 0) {
    return null;
  }

  const renderTrackItem = (version: ProjectGeneratedTrack, index: number) => {
    const isCurrentTrack = activeTrack?.id === version.id;
    const isTrackPlaying = isCurrentTrack && isPlaying;
    const isMaster = version.is_primary;

    return (
      <div
        key={version.id}
        className={cn(
          "flex items-center gap-1.5 p-1.5 rounded-md transition-all",
          isMaster 
            ? "bg-primary/10 ring-1 ring-primary/30" 
            : "bg-muted/30 hover:bg-muted/50",
          isCurrentTrack && "bg-primary/5"
        )}
      >
        {/* Cover */}
        <div 
          className="relative w-8 h-8 rounded-md overflow-hidden bg-secondary flex-shrink-0 cursor-pointer group"
          onClick={() => isTrackPlaying ? pauseTrack() : playTrack(version as unknown as Parameters<typeof playTrack>[0])}
        >
          {version.cover_url || version.local_cover_url ? (
            <img 
              src={version.local_cover_url || version.cover_url || ''} 
              alt={version.title || ''} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Music className="w-3 h-3 text-primary/50" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
            isTrackPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isTrackPlaying ? (
              <Pause className="w-3 h-3 text-white" />
            ) : (
              <Play className="w-3 h-3 text-white" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-medium truncate">
              Версия {index + 1}
            </span>
            {isMaster && (
              <Star className="w-2.5 h-2.5 text-primary fill-primary" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="w-2 h-2" />
              {formatDuration(version.duration_seconds || 0)}
            </span>
            {version.style && (
              <span className="truncate">{version.style.slice(0, 15)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Open in studio */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => navigate(`/studio/${version.id}`)}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Открыть в студии</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {!isMaster ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[9px] gap-0.5"
              onClick={() => setMasterTrack({ trackId: version.id, projectTrackId })}
              disabled={isSettingMaster}
            >
              {isSettingMaster ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <>
                  <Star className="w-2.5 h-2.5" />
                  Выбрать
                </>
              )}
            </Button>
          ) : (
            <Badge variant="default" className="text-[8px] h-4 px-1.5 gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Мастер
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-1.5">
      {/* Header - clickable to toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-1.5 py-1 rounded-md bg-secondary/50 hover:bg-secondary/70 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Music className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-medium">
            {versionsCount} {versionsCount === 1 ? 'версия' : versionsCount < 5 ? 'версии' : 'версий'}
          </span>
          {masterVersion && (
            <Badge variant="default" className="text-[8px] h-3.5 px-1 gap-0.5">
              <Star className="w-2 h-2" />
              Мастер
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Versions list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1.5">
              {versions.map((version, index) => renderTrackItem(version, index))}
            </div>

            {/* Master version assets */}
            {masterVersion && (
              <MasterVersionAssets trackId={masterVersion.id} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
