/**
 * Cloud Audio Selector Component
 * Allows selecting audio from previously uploaded reference_audio
 * Integrates with studio audio coordination
 */

import { memo, useState, useRef, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Cloud, 
  Music2, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Play,
  Pause,
} from 'lucide-react';
import { useReferenceAudio, type ReferenceAudio } from '@/hooks/useReferenceAudio';
import { useAudioReference } from '@/hooks/useAudioReference';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/formatters';
import type { ReferenceMode } from '@/services/audio-reference';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { 
  registerStudioAudio, 
  unregisterStudioAudio, 
  pauseAllStudioAudio 
} from '@/hooks/studio/useStudioAudio';

interface CloudAudioSelectorProps {
  onSelect?: (audio: ReferenceAudio, mode: ReferenceMode) => void;
  selectedMode?: ReferenceMode;
  maxItems?: number;
  className?: string;
  compact?: boolean;
}

export const CloudAudioSelector = memo(function CloudAudioSelector({
  onSelect,
  selectedMode = 'reference',
  maxItems = 5,
  className,
  compact = false,
}: CloudAudioSelectorProps) {
  const { audioList, isLoading } = useReferenceAudio();
  const { setFromCloud, activeReference } = useAudioReference();
  const [isExpanded, setIsExpanded] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceId = useId();
  
  const { pauseTrack, isPlaying: globalIsPlaying } = usePlayerStore();

  // Register with studio audio coordinator
  useEffect(() => {
    const fullSourceId = `cloud-selector-${sourceId}`;
    registerStudioAudio(fullSourceId, () => {
      audioRef.current?.pause();
      setPlayingId(null);
    });

    return () => {
      unregisterStudioAudio(fullSourceId);
      audioRef.current?.pause();
    };
  }, [sourceId]);

  // Pause when global player starts
  useEffect(() => {
    if (globalIsPlaying && playingId) {
      audioRef.current?.pause();
      setPlayingId(null);
    }
  }, [globalIsPlaying, playingId]);

  const handleSelect = (audio: ReferenceAudio) => {
    setFromCloud(audio, selectedMode);
    onSelect?.(audio, selectedMode);
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
  };

  const handlePlayPreview = (audio: ReferenceAudio, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playingId === audio.id) {
      // Stop playing
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop previous
    audioRef.current?.pause();

    // Pause global player and other studio audio
    pauseTrack();
    pauseAllStudioAudio(`cloud-selector-${sourceId}`);

    // Play new
    const newAudio = new Audio(audio.file_url);
    newAudio.onended = () => setPlayingId(null);
    newAudio.onerror = () => setPlayingId(null);
    newAudio.play();
    audioRef.current = newAudio;
    setPlayingId(audio.id);
  };

  if (audioList.length === 0) {
    return null;
  }

  const displayList = audioList.slice(0, maxItems);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toggle button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-between text-muted-foreground h-8"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          <span className="text-xs">Из облака ({audioList.length})</span>
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* List */}
      {isExpanded && (
        <div className="rounded-lg border bg-muted/30 overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            </div>
          ) : (
            <ScrollArea className={compact ? "max-h-32" : "max-h-48"}>
              <div className="divide-y divide-border">
                {displayList.map((item) => {
                  const isSelected = activeReference?.dbId === item.id;
                  const isPlaying = playingId === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      className={cn(
                        "w-full p-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left",
                        isSelected && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                      onClick={() => handleSelect(item)}
                    >
                      {/* Play button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => handlePlayPreview(item, e)}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        )}
                      </Button>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.file_name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {item.duration_seconds && (
                            <span>{formatTime(Math.floor(item.duration_seconds))}</span>
                          )}
                          {item.genre && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {item.genre}
                            </Badge>
                          )}
                          {item.bpm && (
                            <span>{item.bpm} BPM</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Status indicators */}
                      {item.analysis_status === 'completed' && (
                        <Check className="w-3 h-3 text-green-500 shrink-0" />
                      )}
                      {isSelected && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">
                          Выбрано
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
});
