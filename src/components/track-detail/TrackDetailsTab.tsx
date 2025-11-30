import { Track } from '@/hooks/useTracks';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Music2, Clock, Tag, FileText, Mic, Wand2, Heart, Play } from 'lucide-react';

interface TrackDetailsTabProps {
  track: Track;
}

export function TrackDetailsTab({ track }: TrackDetailsTabProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Cover & Basic Info */}
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          {track.cover_url ? (
            <img
              src={track.cover_url}
              alt={track.title || 'Track cover'}
              className="w-full sm:w-56 h-56 rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-full sm:w-56 h-56 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-lg">
              <Music2 className="w-20 h-20 text-primary/40" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {track.title || 'Без названия'}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={track.status === 'completed' ? 'default' : 'secondary'}>
                {track.status}
              </Badge>
              {track.is_public && (
                <Badge variant="outline" className="border-primary">
                  Публичный
                </Badge>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Длительность</p>
                <p className="font-semibold">{formatDuration(track.duration_seconds)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Play className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Прослушиваний</p>
                <p className="font-semibold">{track.play_count || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Heart className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Лайков</p>
                <p className="font-semibold">{track.likes_count || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Mic className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Тип</p>
                <p className="font-semibold">{track.has_vocals ? 'Вокал' : 'Инструментал'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Style & Tags */}
      {(track.style || track.tags) && (
        <>
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-lg">
              <Tag className="w-5 h-5 text-primary" />
              Стиль и теги
            </h4>

            {track.style && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Стиль:</p>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {track.style}
                </Badge>
              </div>
            )}

            {track.tags && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">Теги:</p>
                <div className="flex flex-wrap gap-2">
                  {track.tags.split(',').map((tag, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {track.negative_tags && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Негативные теги:</p>
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
            <h4 className="font-semibold flex items-center gap-2 text-lg">
              <Wand2 className="w-5 h-5 text-primary" />
              Промпт
            </h4>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{track.prompt}</p>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Lyrics */}
      {track.lyrics && (
        <>
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Текст песни
            </h4>
            <div className="p-4 rounded-lg bg-muted/50 border border-border max-h-80 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{track.lyrics}</p>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Technical Info */}
      <div className="space-y-3">
        <h4 className="font-semibold text-lg">Техническая информация</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {track.suno_model && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Модель</p>
              <p className="font-mono text-sm">{track.suno_model}</p>
            </div>
          )}

          {track.generation_mode && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Режим генерации</p>
              <p className="text-sm">{track.generation_mode}</p>
            </div>
          )}

          {track.vocal_gender && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Пол вокала</p>
              <p className="text-sm capitalize">{track.vocal_gender}</p>
            </div>
          )}

          {track.style_weight !== undefined && track.style_weight !== null && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Style Weight</p>
              <p className="text-sm">{track.style_weight}</p>
            </div>
          )}

          {track.provider && (
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Провайдер</p>
              <p className="text-sm">{track.provider}</p>
            </div>
          )}

          {track.created_at && (
            <div className="p-3 rounded-lg bg-muted/30 sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Дата создания</p>
              <p className="text-sm">{new Date(track.created_at).toLocaleString('ru-RU')}</p>
            </div>
          )}

          {track.suno_id && (
            <div className="p-3 rounded-lg bg-muted/30 sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Suno ID</p>
              <p className="font-mono text-xs break-all">{track.suno_id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
