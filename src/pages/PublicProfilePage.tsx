/**
 * Public Profile Page
 * Mobile-first design showing user's public tracks, projects, artists, playlists
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from '@/lib/motion';
import { 
  Settings, Music2, FolderOpen, Users, ListMusic, 
  ChevronLeft, Share2, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import { PublicTrackCard } from '@/components/home/PublicTrackCard';

interface PublicProfile {
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  is_public: boolean;
}

interface ProfileStats {
  tracksCount: number;
  likesReceived: number;
  projectsCount: number;
  playlistsCount: number;
}

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('tracks');
  
  const isOwner = user?.id === userId;

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, username, photo_url, is_public')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as PublicProfile | null;
    },
    enabled: !!userId,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      const [tracksRes, projectsRes, playlistsRes, creditsRes] = await Promise.all([
        supabase.from('tracks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_public', true),
        supabase.from('music_projects').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_public', true),
        supabase.from('playlists').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_public', true),
        supabase.from('user_credits').select('total_likes_received').eq('user_id', userId).maybeSingle(),
      ]);

      return {
        tracksCount: tracksRes.count || 0,
        likesReceived: creditsRes.data?.total_likes_received || 0,
        projectsCount: projectsRes.count || 0,
        playlistsCount: playlistsRes.count || 0,
      } as ProfileStats;
    },
    enabled: !!userId,
  });

  // Fetch public tracks
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['public-tracks', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && activeTab === 'tracks',
  });

  // Fetch public projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['public-projects', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('music_projects')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && activeTab === 'projects',
  });

  // Fetch public artists
  const { data: artists, isLoading: artistsLoading } = useQuery({
    queryKey: ['public-artists', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && activeTab === 'artists',
  });

  // Fetch public playlists
  const { data: playlists, isLoading: playlistsLoading } = useQuery({
    queryKey: ['public-playlists', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && activeTab === 'playlists',
  });

  const handleShare = () => {
    hapticFeedback?.('light');
    if (navigator.share) {
      navigator.share({
        title: `${profile?.first_name || 'Пользователь'} на MusicVerse`,
        url: window.location.href,
      });
    }
  };

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || 'Пользователь';

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Профиль не найден</h2>
          <p className="text-muted-foreground mb-4">Пользователь не существует или профиль скрыт</p>
          <Button onClick={() => navigate('/')}>На главную</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">Профиль</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
            {isOwner && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <motion.div 
        className="px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={profile.photo_url || undefined} alt={displayName} />
            <AvatarFallback className="text-2xl bg-primary/10">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold mt-4">{displayName}</h2>
          {profile.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold">{stats?.tracksCount || 0}</p>
              <p className="text-xs text-muted-foreground">Треков</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{stats?.likesReceived || 0}</p>
              <p className="text-xs text-muted-foreground">Лайков</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{stats?.projectsCount || 0}</p>
              <p className="text-xs text-muted-foreground">Проектов</p>
            </div>
          </div>

          {isOwner && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 gap-2"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4" />
              Настройки профиля
            </Button>
          )}
        </div>
      </motion.div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="tracks" className="gap-1.5 text-xs">
            <Music2 className="w-4 h-4" />
            <span className="hidden sm:inline">Треки</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5 text-xs">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Проекты</span>
          </TabsTrigger>
          <TabsTrigger value="artists" className="gap-1.5 text-xs">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Артисты</span>
          </TabsTrigger>
          <TabsTrigger value="playlists" className="gap-1.5 text-xs">
            <ListMusic className="w-4 h-4" />
            <span className="hidden sm:inline">Плейлисты</span>
          </TabsTrigger>
        </TabsList>

        {/* Tracks Tab */}
        <TabsContent value="tracks" className="mt-4">
          {tracksLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : tracks?.length ? (
            <div className="grid grid-cols-2 gap-3">
              {tracks.map((track) => (
                <PublicTrackCard key={track.id} track={track as any} compact />
              ))}
            </div>
          ) : (
            <EmptyState icon={Music2} text="Нет публичных треков" />
          )}
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-4">
          {projectsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : projects?.length ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  className="p-4 rounded-xl bg-card/50 border border-border/50"
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="font-semibold">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {project.genre && <Badge variant="secondary">{project.genre}</Badge>}
                    {project.mood && <Badge variant="outline">{project.mood}</Badge>}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderOpen} text="Нет публичных проектов" />
          )}
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists" className="mt-4">
          {artistsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : artists?.length ? (
            <div className="grid grid-cols-3 gap-3">
              {artists.map((artist) => (
                <motion.div
                  key={artist.id}
                  className="flex flex-col items-center p-3 rounded-xl bg-card/50 border border-border/50"
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={artist.avatar_url || undefined} />
                    <AvatarFallback>{artist.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium mt-2 text-center line-clamp-1">{artist.name}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} text="Нет публичных артистов" />
          )}
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="mt-4">
          {playlistsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : playlists?.length ? (
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <motion.div
                  key={playlist.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ListMusic className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{playlist.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {playlist.track_count || 0} треков
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ListMusic} text="Нет публичных плейлистов" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
