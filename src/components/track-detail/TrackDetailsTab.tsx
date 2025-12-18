import { Track } from '@/hooks/useTracksOptimized';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Music2, Clock, Tag, FileText, Mic, Wand2, Heart, Play, BookmarkPlus, User, FolderOpen, FileAudio, Cpu, Lock, Unlock } from 'lucide-react';
import { savePromptToBookmarks } from '@/components/generate-form/PromptHistory';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VideoSection } from './VideoSection';
import { useTrackActions } from '@/hooks/useTrackActions';
import { formatDuration } from '@/lib/player-utils';
import { RemixButton } from './RemixButton';
import { ParentTrackLink } from './ParentTrackLink';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TrackDetailsTabProps {
  track: Track;
}

export function TrackDetailsTab({ track }: TrackDetailsTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { handleGenerateVideo, isProcessing } = useTrackActions();
  
  // Check if current user owns the track
  const isOwner = user?.id === track.user_id;
  
  // Fetch artist info if track has artist_id
  const { data: artist } = useQuery({
    queryKey: ['artist', track.artist_id],
    queryFn: async () => {
      if (!track.artist_id) return null;
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, avatar_url, genre_tags')
        .eq('id', track.artist_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!track.artist_id,
  });

  // Fetch project info if track has project_id
  const { data: project } = useQuery({
    queryKey: ['project', track.project_id],
    queryFn: async () => {
      if (!track.project_id) return null;
      const { data, error } = await supabase
        .from('music_projects')
        .select('id, title, cover_url, genre')
        .eq('id', track.project_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!track.project_id,
  });
  
  // Mutation to toggle allow_remix
  const toggleRemixMutation = useMutation({
    mutationFn: async (allowRemix: boolean) => {
      const { error } = await supabase
        .from('tracks')
        .update({ allow_remix: allowRemix })
        .eq('id', track.id);
      if (error) throw error;
      return allowRemix;
    },
    onSuccess: (allowRemix) => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success(allowRemix ? 'Ремикс разрешён' : 'Ремикс запрещён');
    },
    onError: () => {
      toast.error('Ошибка обновления настроек');
    },
  });

  // Format model name for display
  const formatModelName = (model: string | null) => {
    if (!model) return null;
    const modelLabels: Record<string, string> = {
      'V5': 'Suno V5 (Crow)',
      'V4_5ALL': 'Suno V4.5',
      'V4': 'Suno V4',
      'V3_5': 'Suno V3.5',
    };
    return modelLabels[model] || model;
  };

  return (
    <div className="space-y-6">
      {/* Full-width Cover on Mobile */}
      <div className="relative -mx-4 sm:mx-0">
        {track.cover_url ? (
          <div className="relative">
            <img
              src={track.cover_url}
              alt={track.title || 'Track cover'}
              className="w-full aspect-square sm:aspect-video sm:max-h-64 object-cover sm:rounded-xl"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent sm:rounded-xl" />
          </div>
        ) : (
          <div className="w-full aspect-square sm:aspect-video sm:max-h-64 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center sm:rounded-xl">
            <Music2 className="w-24 h-24 text-primary/40" />
          </div>
        )}
        
        {/* Title overlay on cover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
            {track.title || 'Без названия'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={track.status === 'completed' ? 'default' : 'secondary'} className="bg-background/80 backdrop-blur-sm">
              {track.status}
            </Badge>
            {track.is_public && (
              <Badge variant="outline" className="border-primary bg-background/80 backdrop-blur-sm">
                Публичный
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-0">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Длительность</p>
            <p className="font-semibold">{track.duration_seconds ? formatDuration(track.duration_seconds) : 'N/A'}</p>
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

      {/* Remix Button - Main action */}
      <RemixButton track={track} />

      {/* Parent Track Link - if this is a remix */}
      {track.parent_track_id && (
        <ParentTrackLink parentTrackId={track.parent_track_id} />
      )}

      {/* Allow Remix Toggle - Only for track owner */}
      {isOwner && track.is_public && (
        <>
          <Separator />
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              {track.allow_remix !== false ? (
                <Unlock className="w-5 h-5 text-green-500" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="allow-remix" className="text-sm font-medium">
                  Разрешить ремиксы
                </Label>
                <p className="text-xs text-muted-foreground">
                  Другие пользователи смогут создавать ремиксы
                </p>
              </div>
            </div>
            <Switch
              id="allow-remix"
              checked={track.allow_remix !== false}
              onCheckedChange={(checked) => toggleRemixMutation.mutate(checked)}
              disabled={toggleRemixMutation.isPending}
            />
          </div>
        </>
      )}
      {(artist || project || track.streaming_url) && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2 text-lg">
              <FileAudio className="w-5 h-5 text-primary" />
              Референсы
            </h4>
            
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
            </div>
          </div>
        </>
      )}

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
            <div className="flex items-center justify-between">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <Wand2 className="w-5 h-5 text-primary" />
                Промпт
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const promptName = track.title || track.prompt.substring(0, 30);
                  savePromptToBookmarks({
                    name: promptName,
                    mode: track.generation_mode === 'custom' ? 'custom' : 'simple',
                    description: track.generation_mode === 'simple' ? track.prompt : undefined,
                    title: track.title || undefined,
                    style: track.style || undefined,
                    lyrics: track.lyrics || undefined,
                    model: track.suno_model || 'V4_5ALL',
                  });
                }}
              >
                <BookmarkPlus className="w-4 h-4" />
                <span className="hidden sm:inline">В закладки</span>
              </Button>
            </div>
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

      {/* Video Section - Show for tracks with suno_id */}
      {track.suno_id && track.suno_task_id && (
        <>
          <VideoSection 
            track={track} 
            onGenerateVideo={() => handleGenerateVideo(track)} 
          />
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
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <p className="font-medium text-sm">{formatModelName(track.suno_model)}</p>
              </div>
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
