import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Music2, Search, Play, Pause, Loader2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Track {
  id: string;
  title: string;
  prompt: string;
  status: string;
  audio_url: string | null;
  cover_url: string | null;
  created_at: string;
  duration_seconds: number | null;
  has_vocals: boolean;
}

export default function Library() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadTracks();
      
      // Set up realtime subscription
      const subscription = supabase
        .channel('tracks_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tracks',
          },
          () => {
            loadTracks();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAuthenticated]);

  const loadTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error loading tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const filteredTracks = tracks.filter(
    (track) =>
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Ожидание', variant: 'secondary' },
      processing: { label: 'Обработка', variant: 'default' },
      completed: { label: 'Готов', variant: 'outline' },
      failed: { label: 'Ошибка', variant: 'destructive' },
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full glass-card border-primary/20">
            <Music2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Библиотека треков
            </h1>
            <p className="text-muted-foreground">Ваша музыкальная коллекция</p>
          </div>
        </div>

        <Card className="glass-card border-primary/20 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTracks.length === 0 ? (
          <Card className="glass-card border-primary/20 p-12 text-center">
            <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Ничего не найдено' : 'Пока нет треков'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Попробуйте изменить поисковой запрос'
                : 'Создайте свой первый трек в генераторе'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map((track) => (
              <Card
                key={track.id}
                className="glass-card border-primary/20 p-4 hover:border-primary/40 transition-all"
              >
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                  {track.cover_url ? (
                    <img
                      src={track.cover_url}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music2 className="w-12 h-12 text-primary/40" />
                  )}
                  {track.status === 'processing' && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <h3 className="font-semibold truncate mb-1">{track.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {track.prompt}
                </p>

                <div className="flex items-center justify-between mb-3">
                  {getStatusBadge(track.status)}
                  {track.duration_seconds && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.floor(track.duration_seconds / 60)}:
                      {String(track.duration_seconds % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {track.audio_url && track.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      if (playingTrackId === track.id) {
                        setPlayingTrackId(null);
                      } else {
                        setPlayingTrackId(track.id);
                      }
                    }}
                  >
                    {playingTrackId === track.id ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Пауза
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Воспроизвести
                      </>
                    )}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}