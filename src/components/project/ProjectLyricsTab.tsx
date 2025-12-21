/**
 * ProjectLyricsTab - Displays all lyrics for tracks in a project
 * Provides a unified view of all track lyrics with editing capabilities
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Edit3, 
  Copy, 
  Check,
  Music,
  PenLine,
  Sparkles
} from 'lucide-react';
import { ProjectTrack } from '@/hooks/useProjectTracks';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { motion, AnimatePresence } from '@/lib/motion';

interface ProjectLyricsTabProps {
  projectId: string;
  tracks: ProjectTrack[];
  onOpenLyrics: (track: ProjectTrack) => void;
  onOpenLyricsWizard: (track: ProjectTrack) => void;
}

const LYRICS_STATUS_CONFIG = {
  draft: { label: 'Черновик', className: 'bg-muted text-muted-foreground' },
  prompt: { label: 'Идея', className: 'bg-blue-500/20 text-blue-500' },
  generated: { label: 'AI', className: 'bg-purple-500/20 text-purple-500' },
  approved: { label: 'Готово', className: 'bg-green-500/20 text-green-500' },
};

export function ProjectLyricsTab({
  projectId,
  tracks,
  onOpenLyrics,
  onOpenLyricsWizard,
}: ProjectLyricsTabProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tracksWithLyrics = tracks.filter(t => t.lyrics || t.notes);
  const tracksWithoutLyrics = tracks.filter(t => !t.lyrics && !t.notes);

  const handleCopyLyrics = async (track: ProjectTrack) => {
    const text = track.lyrics || track.notes || '';
    await navigator.clipboard.writeText(text);
    setCopiedId(track.id);
    toast.success('Текст скопирован');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenInStudio = (track: ProjectTrack) => {
    // Navigate to lyrics studio - can be enhanced to pass track context
    navigate('/lyrics-studio');
  };

  const getStatusConfig = (status: string | null) => {
    return LYRICS_STATUS_CONFIG[status as keyof typeof LYRICS_STATUS_CONFIG] || LYRICS_STATUS_CONFIG.draft;
  };

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Music className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">Нет треков</h3>
        <p className="text-sm text-muted-foreground/70">
          Добавьте треки в проект, чтобы начать работу над текстами
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", isMobile ? "px-3" : "px-4")}>
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {tracksWithLyrics.length} / {tracks.length} с текстом
        </Badge>
        <Button 
          size="sm" 
          variant="outline" 
          className="gap-1.5"
          onClick={() => navigate('/lyrics-studio')}
        >
          <PenLine className="w-3.5 h-3.5" />
          Открыть студию
        </Button>
      </div>

      {/* Tracks with lyrics */}
      {tracksWithLyrics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Треки с текстом</h3>
          <AnimatePresence>
            {tracksWithLyrics.map((track, index) => {
              const statusConfig = getStatusConfig(track.lyrics_status);
              const lyricsText = track.lyrics || track.notes || '';
              const isFromLinkedTrack = !!track.linked_track?.lyrics;
              
              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass-card border-primary/20 overflow-hidden">
                    <CardContent className={cn("p-0", isMobile ? "" : "")}>
                      {/* Header */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-muted/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                            {track.position}
                          </div>
                          <span className="font-medium text-sm truncate">{track.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className={cn("text-[10px]", statusConfig.className)}>
                            {isFromLinkedTrack ? 'Связан' : statusConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Lyrics preview */}
                      <div className="px-3 py-2.5">
                        <ScrollArea className="max-h-32">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                            {lyricsText.replace(/\[.*?\]/g, '').trim().slice(0, 300)}
                            {lyricsText.length > 300 && '...'}
                          </p>
                        </ScrollArea>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border/30 bg-muted/10">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => onOpenLyrics(track)}
                        >
                          <Edit3 className="w-3 h-3" />
                          Редактировать
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleCopyLyrics(track)}
                        >
                          {copiedId === track.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          Копировать
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => onOpenLyricsWizard(track)}
                        >
                          <Sparkles className="w-3 h-3" />
                          AI
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Tracks without lyrics */}
      {tracksWithoutLyrics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Без текста</h3>
          <div className="grid grid-cols-1 gap-2">
            {tracksWithoutLyrics.map((track) => (
              <Card key={track.id} className="glass-card border-dashed border-muted-foreground/30">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-md bg-muted text-muted-foreground font-bold text-xs">
                      {track.position}
                    </div>
                    <span className="text-sm text-muted-foreground">{track.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => onOpenLyrics(track)}
                    >
                      <Edit3 className="w-3 h-3" />
                      Написать
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => onOpenLyricsWizard(track)}
                    >
                      <Sparkles className="w-3 h-3" />
                      AI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
