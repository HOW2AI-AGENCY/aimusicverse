import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, Pause, Trash2, Music, Download, 
  FileMusic, FileText, Edit2, Check, X,
  Clock, Gauge, Key
} from 'lucide-react';
import { useGuitarRecordings, type GuitarRecording } from '@/hooks/useGuitarRecordings';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedRecordingsListProps {
  onSelect?: (recording: GuitarRecording) => void;
  selectedId?: string;
}

export function SavedRecordingsList({ onSelect, selectedId }: SavedRecordingsListProps) {
  const { recordings, isLoading, deleteRecording, updateRecording } = useGuitarRecordings();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlay = (recording: GuitarRecording) => {
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

  const handleEdit = (recording: GuitarRecording) => {
    setEditingId(recording.id);
    setEditTitle(recording.title || '');
  };

  const handleSaveEdit = (id: string) => {
    updateRecording.mutate({ id, title: editTitle });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (playingId === id) {
      audioElement?.pause();
      setPlayingId(null);
    }
    deleteRecording.mutate(id);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
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
                  "p-3 cursor-pointer transition-all hover:bg-accent/50",
                  selectedId === recording.id && "ring-2 ring-primary bg-accent/30",
                  playingId === recording.id && "bg-primary/10"
                )}
                onClick={() => onSelect?.(recording)}
              >
                <div className="flex items-start gap-3">
                  {/* Play Button */}
                  <Button
                    size="icon"
                    variant={playingId === recording.id ? "default" : "outline"}
                    className="h-10 w-10 shrink-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay(recording);
                    }}
                  >
                    {playingId === recording.id ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveEdit(recording.id);
                          }}
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
                        <p className="font-medium truncate">
                          {recording.title || 'Без названия'}
                        </p>
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
                    </div>

                    {/* File Downloads */}
                    {(recording.midi_url || recording.pdf_url || recording.gp5_url) && (
                      <div className="flex gap-1 mt-2">
                        {recording.midi_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(recording.midi_url!, '_blank');
                            }}
                          >
                            <FileMusic className="w-3 h-3" />
                            MIDI
                          </Button>
                        )}
                        {recording.pdf_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(recording.pdf_url!, '_blank');
                            }}
                          >
                            <FileText className="w-3 h-3" />
                            PDF
                          </Button>
                        )}
                        {recording.gp5_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(recording.gp5_url!, '_blank');
                            }}
                          >
                            <Download className="w-3 h-3" />
                            GP5
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(recording);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(recording.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
