import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, Pause, Trash2, Music, ChevronRight,
  Clock, Gauge, Key, Edit2, Check, X,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useGuitarRecordings, type GuitarRecording } from '@/hooks/useGuitarRecordings';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from '@/lib/motion';
import { SavedRecordingDetailSheet } from './SavedRecordingDetailSheet';
import { formatDuration } from '@/lib/player-utils';

interface SavedRecordingsListProps {
  onSelect?: (recording: GuitarRecording) => void;
  selectedId?: string;
  showDetails?: boolean;
}

export function SavedRecordingsList({ onSelect, selectedId, showDetails = true }: SavedRecordingsListProps) {
  const { recordings, isLoading, deleteRecording, updateRecording } = useGuitarRecordings();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [detailRecording, setDetailRecording] = useState<GuitarRecording | null>(null);

  const handlePlay = (e: React.MouseEvent, recording: GuitarRecording) => {
    e.stopPropagation();
    
    if (playingId === recording.id) {
      audioElement?.pause();
      setPlayingId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audio = new Audio(recording.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    setAudioElement(audio);
    setPlayingId(recording.id);
  };

  const handleEdit = (e: React.MouseEvent, recording: GuitarRecording) => {
    e.stopPropagation();
    setEditingId(recording.id);
    setEditTitle(recording.title || '');
  };

  const handleSaveEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateRecording.mutate({ id, title: editTitle });
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (playingId === id) {
      audioElement?.pause();
      setPlayingId(null);
    }
    deleteRecording.mutate(id);
  };

  const handleCardClick = (recording: GuitarRecording) => {
    if (showDetails) {
      setDetailRecording(recording);
    } else {
      onSelect?.(recording);
    }
  };

  const handleUseForGeneration = (recording: GuitarRecording) => {
    onSelect?.(recording);
    setDetailRecording(null);
  };


  const hasFullAnalysis = (recording: GuitarRecording) => {
    return recording.analysis_status?.beats && 
           recording.analysis_status?.chords && 
           recording.analysis_status?.transcription;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Music className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Нет сохранённых записей</p>
        <p className="text-sm text-muted-foreground mt-1">
          Запишите мелодию и сохраните для использования
        </p>
      </Card>
    );
  }

  return (
    <>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-4">
          <AnimatePresence>
            {recordings.map((recording, index) => (
              <motion.div
                key={recording.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:bg-accent/50 group",
                    selectedId === recording.id && "ring-2 ring-primary bg-accent/30",
                    playingId === recording.id && "bg-primary/10"
                  )}
                  onClick={() => handleCardClick(recording)}
                >
                  <div className="flex items-start gap-3">
                    {/* Play Button */}
                    <Button
                      size="icon"
                      variant={playingId === recording.id ? "default" : "outline"}
                      className="h-12 w-12 shrink-0 rounded-full"
                      onClick={(e) => handlePlay(e, recording)}
                    >
                      {playingId === recording.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </Button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {editingId === recording.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-8"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-500"
                            onClick={(e) => handleSaveEdit(e, recording.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {recording.title || 'Без названия'}
                            </p>
                            {hasFullAnalysis(recording) ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(recording.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                          </p>
                        </>
                      )}

                      {/* Metadata Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {recording.bpm && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Gauge className="w-3 h-3" />
                            {Math.round(recording.bpm)} BPM
                          </Badge>
                        )}
                        {recording.key && recording.key !== 'Unknown' && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Key className="w-3 h-3" />
                            {recording.key}
                          </Badge>
                        )}
                        {recording.duration_seconds && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(recording.duration_seconds)}
                          </Badge>
                        )}
                        {recording.chords && recording.chords.length > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Music className="w-3 h-3" />
                            {recording.chords.length} аккордов
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleEdit(e, recording)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(e, recording.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {showDetails && (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Detail Sheet */}
      <SavedRecordingDetailSheet
        recording={detailRecording}
        open={!!detailRecording}
        onOpenChange={(open) => !open && setDetailRecording(null)}
        onUseForGeneration={onSelect ? handleUseForGeneration : undefined}
      />
    </>
  );
}
