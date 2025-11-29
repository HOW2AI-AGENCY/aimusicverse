import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Track } from '@/hooks/useTracks';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music2, Clock, Tag, FileText, Mic, Wand2 } from 'lucide-react';

interface TrackDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function TrackDetailDialog({ open, onOpenChange, track }: TrackDetailDialogProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Детали трека
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 pr-4">
            {/* Cover & Basic Info */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                {track.cover_url ? (
                  <img
                    src={track.cover_url}
                    alt={track.title || 'Track cover'}
                    className="w-48 h-48 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Music2 className="w-16 h-16 text-primary/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {track.title || 'Без названия'}
                  </h3>
                  <Badge variant={track.status === 'completed' ? 'default' : 'secondary'}>
                    {track.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDuration(track.duration_seconds)}</span>
                  </div>

                  {track.play_count !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Music2 className="w-4 h-4 text-muted-foreground" />
                      <span>{track.play_count} прослушиваний</span>
                    </div>
                  )}

                  {track.likes_count !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      ❤️
                      <span>{track.likes_count} лайков</span>
                    </div>
                  )}

                  {track.has_vocals !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mic className="w-4 h-4 text-muted-foreground" />
                      <span>{track.has_vocals ? 'С вокалом' : 'Инструментал'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Style & Tags */}
            {(track.style || track.tags) && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Стиль и теги
                  </h4>
                  
                  {track.style && (
                    <div>
                      <span className="text-sm text-muted-foreground">Стиль: </span>
                      <Badge variant="outline">{track.style}</Badge>
                    </div>
                  )}

                  {track.tags && (
                    <div>
                      <span className="text-sm text-muted-foreground">Теги: </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {track.tags.split(',').map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {track.negative_tags && (
                    <div>
                      <span className="text-sm text-muted-foreground">Негативные теги: </span>
                      <Badge variant="destructive">{track.negative_tags}</Badge>
                    </div>
                  )}
                </div>

                <Separator />
              </>
            )}

            {/* Prompt */}
            {track.prompt && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    Промпт
                  </h4>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{track.prompt}</p>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Lyrics */}
            {track.lyrics && (
              <>
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Текст песни
                  </h4>
                  <div className="p-4 rounded-lg bg-muted/50 max-h-64 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{track.lyrics}</p>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Technical Info */}
            <div className="space-y-3">
              <h4 className="font-semibold">Техническая информация</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {track.suno_model && (
                  <div>
                    <span className="text-muted-foreground">Модель: </span>
                    <span className="font-mono">{track.suno_model}</span>
                  </div>
                )}

                {track.generation_mode && (
                  <div>
                    <span className="text-muted-foreground">Режим: </span>
                    <span>{track.generation_mode}</span>
                  </div>
                )}

                {track.vocal_gender && (
                  <div>
                    <span className="text-muted-foreground">Пол вокала: </span>
                    <span>{track.vocal_gender}</span>
                  </div>
                )}

                {track.style_weight !== undefined && track.style_weight !== null && (
                  <div>
                    <span className="text-muted-foreground">Style Weight: </span>
                    <span>{track.style_weight}</span>
                  </div>
                )}

                {track.suno_id && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Suno ID: </span>
                    <span className="font-mono text-xs">{track.suno_id}</span>
                  </div>
                )}

                {track.created_at && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Создан: </span>
                    <span>{new Date(track.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* URLs */}
            {(track.audio_url || track.streaming_url || track.local_audio_url) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Файлы</h4>
                  <div className="space-y-1 text-xs">
                    {track.local_audio_url && (
                      <div>
                        <span className="text-muted-foreground">Локальный аудио: </span>
                        <a
                          href={track.local_audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {track.local_audio_url}
                        </a>
                      </div>
                    )}
                    {track.audio_url && (
                      <div>
                        <span className="text-muted-foreground">Аудио URL: </span>
                        <a
                          href={track.audio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {track.audio_url}
                        </a>
                      </div>
                    )}
                    {track.streaming_url && track.streaming_url !== track.audio_url && (
                      <div>
                        <span className="text-muted-foreground">Streaming URL: </span>
                        <a
                          href={track.streaming_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {track.streaming_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
