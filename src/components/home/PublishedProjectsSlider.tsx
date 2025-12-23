/**
 * Published Projects Slider - displays published projects with horizontal scroll
 * Includes a CTA banner at the end to create new project
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FolderOpen, 
  ArrowRight, 
  Sparkles, 
  Disc3, 
  Music, 
  Film, 
  Plus,
  CheckCircle2 
} from 'lucide-react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { QuickProjectSheet } from '@/components/project/QuickProjectSheet';

interface PublishedProject {
  id: string;
  title: string;
  cover_url: string | null;
  genre: string | null;
  user_id: string;
  published_at: string | null;
  total_tracks_count: number | null;
  project_type: string | null;
  profiles?: {
    username: string | null;
    display_name: string | null;
    photo_url: string | null;
  };
}

export function PublishedProjectsSlider() {
  const navigate = useNavigate();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['published-projects-slider'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_projects')
        .select(`
          id,
          title,
          cover_url,
          genre,
          user_id,
          published_at,
          total_tracks_count,
          project_type
        `)
        .eq('is_public', true)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      if (!data?.length) return [];

      // Fetch profiles
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, photo_url')
        .in('user_id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(project => ({
        ...project,
        profiles: profilesMap.get(project.user_id) || null,
      })) as PublishedProject[];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Проекты сообщества</h2>
            <p className="text-xs text-muted-foreground">Альбомы, EP и синглы</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[200px] h-[140px] rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  const getProjectTypeIcon = (type: string | null) => {
    switch (type) {
      case 'album':
      case 'ep':
        return Disc3;
      case 'single':
        return Music;
      case 'soundtrack':
        return Film;
      default:
        return FolderOpen;
    }
  };

  const getProjectTypeLabel = (type: string | null) => {
    switch (type) {
      case 'album': return 'Альбом';
      case 'ep': return 'EP';
      case 'single': return 'Сингл';
      case 'soundtrack': return 'Саундтрек';
      default: return 'Проект';
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-generate/20 to-primary/10 flex items-center justify-center shadow-soft"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <FolderOpen className="w-5 h-5 text-generate" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Проекты сообщества</h2>
              {projects && projects.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 gap-0.5 bg-generate/10 text-generate border-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  {projects.length}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Альбомы, EP и синглы</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="text-xs text-muted-foreground hover:text-primary gap-1.5 rounded-xl"
        >
          Все
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="-mx-3 px-3">
        <div className="flex gap-3 pb-3">
          {/* Project Cards - Large Banners */}
          {projects?.map((project, index) => {
            const TypeIcon = getProjectTypeIcon(project.project_type);
            
            return (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/album/${project.id}`)}
                className="w-[200px] sm:w-[240px] shrink-0 cursor-pointer group"
              >
                <div className="relative h-[140px] sm:h-[160px] rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/80 border border-border/50 hover:border-primary/40 transition-all duration-300">
                  {/* Background */}
                  {project.cover_url ? (
                    <>
                      <img
                        src={project.cover_url}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-generate/20 via-primary/10 to-generate/5 flex items-center justify-center">
                      <Disc3 className="w-12 h-12 text-generate/30" />
                    </div>
                  )}

                  {/* Type Badge */}
                  <Badge 
                    className="absolute top-2 left-2 text-[9px] h-5 gap-1 px-2 bg-background/80 backdrop-blur-sm border-0"
                  >
                    <TypeIcon className="w-2.5 h-2.5" />
                    {getProjectTypeLabel(project.project_type)}
                  </Badge>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3">
                    <h3 className="font-semibold text-sm text-white truncate group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {project.profiles?.display_name && (
                        <span className="text-[10px] text-white/70 truncate">
                          {project.profiles.display_name}
                        </span>
                      )}
                      {project.total_tracks_count && project.total_tracks_count > 0 && (
                        <span className="text-[10px] text-white/50 flex items-center gap-0.5">
                          <Music className="w-2.5 h-2.5" />
                          {project.total_tracks_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Create Project CTA Banner */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (projects?.length || 0) * 0.08 + 0.1, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCreateSheetOpen(true)}
            className="w-[200px] sm:w-[240px] shrink-0 cursor-pointer group"
          >
            <div className="relative h-[140px] sm:h-[160px] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-generate/10 to-primary/5 border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all duration-300">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-generate/10 opacity-50" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
                <motion.div 
                  className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Plus className="w-6 h-6 text-primary" />
                </motion.div>
                
                <h3 className="font-bold text-sm text-foreground mb-1">
                  Создайте свой проект!
                </h3>
                <p className="text-[10px] text-muted-foreground leading-tight mb-2">
                  Организуйте музыку в альбомы
                </p>

                {/* Project types */}
                <div className="flex flex-wrap justify-center gap-1">
                  <Badge variant="outline" className="text-[8px] h-4 px-1.5 gap-0.5">
                    <Music className="w-2 h-2" />
                    Сингл
                  </Badge>
                  <Badge variant="outline" className="text-[8px] h-4 px-1.5 gap-0.5">
                    <Disc3 className="w-2 h-2" />
                    EP/Альбом
                  </Badge>
                  <Badge variant="outline" className="text-[8px] h-4 px-1.5 gap-0.5">
                    <Film className="w-2 h-2" />
                    Саундтрек
                  </Badge>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <QuickProjectSheet 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen} 
      />
    </section>
  );
}