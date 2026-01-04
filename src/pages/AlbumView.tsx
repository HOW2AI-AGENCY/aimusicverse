/**
 * Album view page - displays a published project with its tracks
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Music, 
  Play, 
  Pause, 
  Share2, 
  User,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { useTelegramBackButton } from '@/hooks/telegram';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, ru } from '@/lib/date-utils';
import { formatTime } from '@/lib/formatters';

interface AlbumTrack {
  id: string;
  title: string | null;
  audio_url: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  style: string | null;
  is_master: boolean | null;
  project_track_id: string | null;
}

interface Album {
  id: string;
  title: string;
  cover_url: string | null;
  description: string | null;
  concept: string | null;
  genre: string | null;
  mood: string | null;
  published_at: string | null;
  user_id: string;
  profiles: {
    username: string | null;
    display_name: string | null;
    photo_url: string | null;
  } | null;
}

export default function AlbumView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTrack, isPlaying, playTrack, pauseTrack } = usePlayerStore();
  const [playingAll, setPlayingAll] = useState(false);

  // Telegram BackButton - navigates back to library
  const { shouldShowUIButton: showUIBackButton } = useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  // Fetch album data with profile separately (no FK relationship)
  const { data: album, isLoading: albumLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: async () => {
      if (!id) throw new Error('No album ID');
      
      // Fetch project first
      const { data: project, error } = await supabase
        .from('music_projects')
        .select('id, title, cover_url, description, concept, genre, mood, published_at, user_id')
        .eq('id', id)
        .eq('is_public', true)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      if (!project) return null;

      // Fetch profile separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, display_name, photo_url')
        .eq('user_id', project.user_id)
        .single();

      return {
        ...project,
        profiles: profile || null,
      } as Album;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch master tracks for this album
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['album-tracks', id],
    queryFn: async () => {
      if (!id) throw new Error('No album ID');
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, audio_url, cover_url, duration_seconds, style, is_master, project_track_id')
        .eq('project_id', id)
        .eq('is_master', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as AlbumTrack[];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const handlePlayAll = () => {
    if (!tracks || tracks.length === 0) return;
    
    const firstTrack = tracks.find(t => t.audio_url);
    if (firstTrack && firstTrack.audio_url) {
      playTrack({
        id: firstTrack.id,
        title: firstTrack.title || 'Без названия',
        audio_url: firstTrack.audio_url,
        cover_url: firstTrack.cover_url || album?.cover_url || undefined,
        duration_seconds: firstTrack.duration_seconds,
      } as any);
      setPlayingAll(true);
    }
  };

  const handlePlayTrack = (track: AlbumTrack) => {
    if (!track.audio_url) return;
    
    const isCurrentTrack = activeTrack?.id === track.id;
    
    if (isCurrentTrack && isPlaying) {
      pauseTrack();
    } else {
      playTrack({
        id: track.id,
        title: track.title || 'Без названия',
        audio_url: track.audio_url,
        cover_url: track.cover_url || album?.cover_url,
        duration_seconds: track.duration_seconds,
      } as any);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.share({
        title: album?.title,
        text: `Послушай альбом "${album?.title}" на MusicVerse`,
        url,
      });
    } catch {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    }
  };

  const totalDuration = tracks?.reduce((acc, t) => acc + (t.duration_seconds || 0), 0) || 0;
  const creatorName = album?.profiles?.display_name || album?.profiles?.username || 'Автор';

  if (albumLoading || tracksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Music className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Альбом не найден</h2>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          На главную
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Hero Section */}
      <div className="relative">
        {/* Background blur */}
        <div 
          className="absolute inset-0 h-64 bg-gradient-to-b from-primary/20 to-background"
          style={{
            backgroundImage: album.cover_url ? `url(${album.cover_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px)',
            opacity: 0.5,
          }}
        />

        {/* Header */}
        <div 
          className="relative sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/30 px-4 py-3"
          style={{ paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.75rem), calc(env(safe-area-inset-top, 0px) + 0.75rem))' }}
        >
          <div className="flex items-center gap-3">
            {showUIBackButton && (
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <span className="font-medium text-sm truncate flex-1">{album.title}</span>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Album Info */}
        <div className="relative px-4 pt-6 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-end">
            {/* Cover */}
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden shadow-2xl shrink-0 bg-secondary">
              {album.cover_url ? (
                <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-16 h-16 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left space-y-3 flex-1">
              <Badge variant="secondary" className="text-xs">Альбом</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold">{album.title}</h1>
              
              {/* Creator */}
              <div 
                className="flex items-center gap-2 justify-center sm:justify-start cursor-pointer hover:opacity-80"
                onClick={() => navigate(`/profile/${album.user_id}`)}
              >
                {album.profiles?.photo_url ? (
                  <img 
                    src={album.profiles.photo_url} 
                    alt={creatorName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="font-medium">{creatorName}</span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground justify-center sm:justify-start">
                {album.genre && (
                  <Badge variant="outline">{album.genre}</Badge>
                )}
                <span className="flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" />
                  {tracks?.length || 0} треков
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(totalDuration)}
                </span>
                {album.published_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(album.published_at), 'd MMM yyyy', { locale: ru })}
                  </span>
                )}
              </div>

              {album.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{album.description}</p>
              )}
            </div>
          </div>

          {/* Play All Button */}
          <div className="mt-6 flex justify-center sm:justify-start">
            <Button 
              size="lg" 
              onClick={handlePlayAll}
              disabled={!tracks || tracks.length === 0}
              className="gap-2 px-8"
            >
              <Play className="w-5 h-5 fill-current" />
              Слушать альбом
            </Button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="px-4 space-y-1">
        {tracks?.map((track, index) => {
          const isCurrentTrack = activeTrack?.id === track.id;
          const isTrackPlaying = isCurrentTrack && isPlaying;

          return (
            <div
              key={track.id}
              onClick={() => handlePlayTrack(track)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                isCurrentTrack ? "bg-primary/10" : "hover:bg-secondary/50"
              )}
            >
              {/* Track number / Play indicator */}
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {isTrackPlaying ? (
                  <Pause className="w-4 h-4 text-primary" />
                ) : isCurrentTrack ? (
                  <Play className="w-4 h-4 text-primary" />
                ) : (
                  <span className="text-sm text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Cover */}
              <div className="w-10 h-10 rounded-md overflow-hidden bg-secondary shrink-0">
                {track.cover_url ? (
                  <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                ) : album.cover_url ? (
                  <img src={album.cover_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm truncate",
                  isCurrentTrack && "text-primary"
                )}>
                  {track.title || `Трек ${index + 1}`}
                </p>
                {track.style && (
                  <p className="text-xs text-muted-foreground truncate">{track.style}</p>
                )}
              </div>

              {/* Duration */}
              <span className="text-xs text-muted-foreground shrink-0">
                {track.duration_seconds ? formatTime(track.duration_seconds) : '--:--'}
              </span>
            </div>
          );
        })}

        {(!tracks || tracks.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Нет треков в альбоме</p>
          </div>
        )}
      </div>
    </div>
  );
}
