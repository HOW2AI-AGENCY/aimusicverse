import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { 
  User, Music2, Sparkles, Play, Edit, Settings, 
  Clock, ChevronRight, Lock, Globe 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlayerStore } from '@/hooks/audio/usePlayerState';
import { cn } from '@/lib/utils';
import { motion } from '@/lib/motion';
import { EditArtistDialog } from './EditArtistDialog';
import type { Artist } from '@/hooks/useArtists';

interface ArtistDetailsPanelProps {
  artist: Artist | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtistDetailsPanel({ artist, open, onOpenChange }: ArtistDetailsPanelProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack, activeTrack, isPlaying } = usePlayerStore();
  const [activeTab, setActiveTab] = useState('tracks');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isOwner = user?.id === artist?.user_id;
  
  // Check if user can make private artists
  const { data: canMakePrivate } = useQuery({
    queryKey: ['can-make-private', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const [{ data: isAdmin }, { data: profile }] = await Promise.all([
        supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
        supabase.from('profiles').select('subscription_tier').eq('user_id', user.id).single(),
      ]);
      return isAdmin || (profile?.subscription_tier && profile.subscription_tier !== 'free');
    },
    enabled: !!user?.id && isOwner,
  });

  // Fetch tracks generated with this artist
  const { data: artistTracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['artist-tracks', artist?.id],
    queryFn: async () => {
      if (!artist?.id) return [];
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', artist.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!artist?.id && open,
  });

  // Fetch artist stats
  const { data: stats } = useQuery({
    queryKey: ['artist-stats', artist?.id],
    queryFn: async () => {
      if (!artist?.id) return { tracks: 0, totalPlays: 0, totalLikes: 0 };
      
      const [tracksResult, likesResult] = await Promise.all([
        supabase
          .from('tracks')
          .select('id, play_count', { count: 'exact' })
          .eq('artist_id', artist.id),
        supabase
          .from('track_likes')
          .select('id', { count: 'exact', head: true })
          .in('track_id', artistTracks?.map(t => t.id) || []),
      ]);

      const totalPlays = tracksResult.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;
      
      return {
        tracks: tracksResult.count || 0,
        totalPlays,
        totalLikes: likesResult.count || 0,
      };
    },
    enabled: !!artist?.id && !!artistTracks && open,
  });

  if (!artist) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header with Avatar */}
        <div className="relative">
          {/* Background blur */}
          {artist.avatar_url && (
            <div className="absolute inset-0 overflow-hidden">
              <img 
                src={artist.avatar_url} 
                alt="" 
                className="w-full h-full object-cover blur-3xl opacity-30" 
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
            </div>
          )}
          
          <div className="relative p-6 text-center">
            <motion.div 
              className="relative w-24 h-24 mx-auto mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-purple-500/40 blur-xl" />
              
              <Avatar className="w-24 h-24 border-4 border-primary/30 relative">
                <AvatarImage src={artist.avatar_url || undefined} alt={artist.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                  <User className="w-10 h-10 text-primary/50" />
                </AvatarFallback>
              </Avatar>
              
              {artist.is_ai_generated && (
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
            </motion.div>

            <SheetHeader className="space-y-1">
              <SheetTitle className="text-xl font-bold">{artist.name}</SheetTitle>
              {artist.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{artist.bio}</p>
              )}
            </SheetHeader>

            {/* Genre & Mood tags */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3">
              {artist.genre_tags?.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Music2 className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {artist.mood_tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{stats?.tracks || 0}</div>
                <div className="text-muted-foreground text-xs">Треков</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{stats?.totalPlays || 0}</div>
                <div className="text-muted-foreground text-xs">Прослушиваний</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{stats?.totalLikes || 0}</div>
                <div className="text-muted-foreground text-xs">Лайков</div>
              </div>
            </div>

            {/* Action buttons */}
            {isOwner && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="gap-1.5"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 mx-6 w-auto">
            <TabsTrigger value="tracks" className="gap-1.5">
              <Music2 className="w-4 h-4" />
              Треки
            </TabsTrigger>
            <TabsTrigger value="info" className="gap-1.5">
              <Settings className="w-4 h-4" />
              Инфо
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="flex-1 mt-0 px-4 pb-4">
            <ScrollArea className="h-full">
              {tracksLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                  ))}
                </div>
              ) : artistTracks && artistTracks.length > 0 ? (
                <div className="space-y-2 py-2">
                  {artistTracks.map((track) => {
                    const isActive = activeTrack?.id === track.id;
                    const isCurrentlyPlaying = isActive && isPlaying;

                    return (
                      <Card
                        key={track.id}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                          isActive && "ring-1 ring-primary"
                        )}
                        onClick={() => playTrack(track as any)}
                      >
                        <div className="flex items-center gap-3">
                          {/* Cover */}
                          <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                            {track.cover_url ? (
                              <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music2 className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {isCurrentlyPlaying && (
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              )}
                              <span className="font-medium text-sm truncate">
                                {track.title || 'Без названия'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {track.play_count !== null && track.play_count > 0 && (
                                <span className="flex items-center gap-1">
                                  <Play className="w-3 h-3" />
                                  {track.play_count}
                                </span>
                              )}
                              {track.duration_seconds && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.floor(track.duration_seconds / 60)}:{String(Math.floor(track.duration_seconds % 60)).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Нет треков с этим артистом</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/generate');
                    }}
                  >
                    Создать трек
                  </Button>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="info" className="flex-1 mt-0 px-4 pb-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 py-2">
                {artist.style_description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1.5 text-muted-foreground">Описание стиля</h4>
                    <p className="text-sm">{artist.style_description}</p>
                  </div>
                )}

                {artist.genre_tags && artist.genre_tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1.5 text-muted-foreground">Жанры</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {artist.genre_tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {artist.mood_tags && artist.mood_tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1.5 text-muted-foreground">Настроение</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {artist.mood_tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-1.5 text-muted-foreground">Создан</h4>
                  <p className="text-sm">
                    {artist.created_at ? new Date(artist.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'Неизвестно'}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>

      {artist && (
        <EditArtistDialog
          artist={artist}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          canMakePrivate={canMakePrivate ?? false}
        />
      )}
    </Sheet>
  );
}
