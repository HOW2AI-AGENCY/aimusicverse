/**
 * Public Profile Page - Enhanced "Producer Center" style
 * Mobile-first design showing user's public tracks, projects, artists, playlists
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from '@/lib/motion';
import { 
  Settings, Music2, FolderOpen, Users, ListMusic, 
  ChevronLeft, Share2, Heart, Play, Crown,
  Instagram, Twitter, Youtube, Globe, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import { useTelegramBackButton } from '@/hooks/telegram';
import { PublicTrackCard } from '@/components/home/PublicTrackCard';
import { FollowButton } from '@/components/social/FollowButton';
import { cn } from '@/lib/utils';

interface PublicProfile {
  user_id: string;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  display_name: string | null;
  bio: string | null;
  banner_url: string | null;
  social_links: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    spotify?: string;
    soundcloud?: string;
    website?: string;
  } | null;
  is_public: boolean;
  followers_count: number | null;
  following_count: number | null;
}

interface ProfileStats {
  tracksCount: number;
  likesReceived: number;
  projectsCount: number;
  playlistsCount: number;
  totalPlays: number;
}

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('tracks');
  const [showFullBio, setShowFullBio] = useState(false);
  
  const isOwner = user?.id === userId;

  // Telegram BackButton - navigates back to home
  const { shouldShowUIButton: showUIBackButton } = useTelegramBackButton({
    visible: true,
    fallbackPath: '/',
  });

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, username, photo_url, display_name, bio, banner_url, social_links, is_public, followers_count, following_count')
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
      const [tracksRes, projectsRes, playlistsRes, creditsRes, playsRes] = await Promise.all([
        supabase.from('tracks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_public', true),
        supabase.from('music_projects').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_public', true),
        supabase.from('playlists').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_public', true),
        supabase.from('user_credits').select('total_likes_received').eq('user_id', userId).maybeSingle(),
        supabase.from('tracks').select('play_count').eq('user_id', userId).eq('is_public', true),
      ]);

      const totalPlays = playsRes.data?.reduce((sum, t) => sum + (t.play_count || 0), 0) || 0;

      return {
        tracksCount: tracksRes.count || 0,
        likesReceived: creditsRes.data?.total_likes_received || 0,
        projectsCount: projectsRes.count || 0,
        playlistsCount: playlistsRes.count || 0,
        totalPlays,
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
        title: `${displayName} на MusicVerse`,
        url: window.location.href,
      });
    }
  };

  const displayName = profile?.display_name || 
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 
    profile?.username || 
    'Пользователь';

  const socialLinks = profile?.social_links || {};

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
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
      <div className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          {showUIBackButton ? (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
          ) : (
            <div className="w-9" />
          )}
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

      {/* Banner Section */}
      <div className="relative">
        {profile.banner_url ? (
          <div className="h-32 sm:h-48 overflow-hidden">
            <img 
              src={profile.banner_url} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-32 sm:h-48 bg-gradient-to-br from-primary/30 via-primary/10 to-background relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />
          </div>
        )}

        {/* Avatar - overlapping banner */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-background shadow-xl">
              <AvatarImage src={profile.photo_url || undefined} alt={displayName} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>
      </div>

      {/* Profile Info */}
      <motion.div 
        className="px-4 pt-16 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col items-center text-center">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            {displayName}
            {(stats?.likesReceived || 0) > 100 && (
              <Crown className="w-5 h-5 text-amber-400" />
            )}
          </h2>
          {profile.username && (
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="mt-3 max-w-md">
              <p className={cn(
                "text-sm text-muted-foreground leading-relaxed",
                !showFullBio && "line-clamp-2"
              )}>
                {profile.bio}
              </p>
              {profile.bio.length > 100 && (
                <button 
                  className="text-xs text-primary mt-1"
                  onClick={() => setShowFullBio(!showFullBio)}
                >
                  {showFullBio ? 'Скрыть' : 'Читать далее'}
                </button>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-4">
            <StatItem value={stats?.tracksCount || 0} label="Треков" icon={Music2} />
            <StatItem value={stats?.likesReceived || 0} label="Лайков" icon={Heart} color="text-red-400" />
            <StatItem value={stats?.totalPlays || 0} label="Прослушиваний" icon={Play} />
          </div>

          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              {socialLinks.instagram && (
                <SocialButton 
                  icon={Instagram} 
                  href={`https://instagram.com/${socialLinks.instagram}`}
                  label="Instagram"
                />
              )}
              {socialLinks.twitter && (
                <SocialButton 
                  icon={Twitter} 
                  href={`https://twitter.com/${socialLinks.twitter}`}
                  label="Twitter"
                />
              )}
              {socialLinks.youtube && (
                <SocialButton 
                  icon={Youtube} 
                  href={socialLinks.youtube.startsWith('http') ? socialLinks.youtube : `https://youtube.com/@${socialLinks.youtube}`}
                  label="YouTube"
                />
              )}
              {socialLinks.spotify && (
                <SocialButton 
                  icon={() => <span className="text-[10px] font-bold">S</span>} 
                  href={socialLinks.spotify.startsWith('http') ? socialLinks.spotify : `https://open.spotify.com/artist/${socialLinks.spotify}`}
                  label="Spotify"
                  className="bg-green-500/20 hover:bg-green-500/30"
                />
              )}
              {socialLinks.website && (
                <SocialButton 
                  icon={Globe} 
                  href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`}
                  label="Сайт"
                />
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            {!isOwner && userId && (
              <FollowButton userId={userId} />
            )}
            {isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4" />
                Настроить профиль
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="w-full grid grid-cols-4 h-11 bg-muted/50">
          <TabsTrigger value="tracks" className="gap-1.5 text-xs data-[state=active]:bg-background">
            <Music2 className="w-4 h-4" />
            <span className="hidden sm:inline">Треки</span>
            {(stats?.tracksCount || 0) > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] hidden sm:flex">
                {stats?.tracksCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5 text-xs data-[state=active]:bg-background">
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Проекты</span>
          </TabsTrigger>
          <TabsTrigger value="artists" className="gap-1.5 text-xs data-[state=active]:bg-background">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Артисты</span>
          </TabsTrigger>
          <TabsTrigger value="playlists" className="gap-1.5 text-xs data-[state=active]:bg-background">
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
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {tracks.map((track, i) => (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PublicTrackCard track={track as any} compact />
                </motion.div>
              ))}
            </motion.div>
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
                  className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <div className="flex items-start gap-3">
                    {project.cover_url ? (
                      <img 
                        src={project.cover_url} 
                        alt={project.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {project.genre && <Badge variant="secondary" className="text-xs">{project.genre}</Badge>}
                        {project.mood && <Badge variant="outline" className="text-xs">{project.mood}</Badge>}
                      </div>
                    </div>
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
                  className="flex flex-col items-center p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                    <AvatarImage src={artist.avatar_url || undefined} />
                    <AvatarFallback className="text-lg bg-primary/10">{artist.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium mt-2 text-center line-clamp-1">{artist.name}</p>
                  {artist.genre_tags && artist.genre_tags.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-full">
                      {artist.genre_tags.slice(0, 2).join(', ')}
                    </p>
                  )}
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                  whileTap={{ scale: 0.98 }}
                >
                  {playlist.cover_url ? (
                    <img 
                      src={playlist.cover_url}
                      alt={playlist.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ListMusic className="w-6 h-6 text-primary" />
                    </div>
                  )}
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

function StatItem({ 
  value, 
  label, 
  icon: Icon,
  color 
}: { 
  value: number; 
  label: string; 
  icon: React.ElementType;
  color?: string;
}) {
  const formatValue = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toString();
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1">
        <Icon className={cn("w-4 h-4", color || "text-muted-foreground")} />
        <p className="text-lg font-bold">{formatValue(value)}</p>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SocialButton({ 
  icon: Icon, 
  href, 
  label,
  className 
}: { 
  icon: React.ElementType; 
  href: string; 
  label: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "w-9 h-9 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors",
        className
      )}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
