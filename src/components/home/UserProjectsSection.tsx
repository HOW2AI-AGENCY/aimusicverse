/**
 * User Projects Section - displays user's music projects on homepage
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus, ArrowRight, Music, CheckCircle2, Clock, Disc3 } from 'lucide-react';
import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface UserProject {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  status: string | null;
  total_tracks_count: number | null;
  approved_tracks_count: number | null;
  created_at: string | null;
  is_public: boolean | null;
}

export function UserProjectsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['user-projects-home', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('music_projects')
        .select('id, title, description, cover_url, genre, status, total_tracks_count, approved_tracks_count, created_at, is_public')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as UserProject[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Мои проекты</h2>
            <p className="text-xs text-muted-foreground">Альбомы и EP</p>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-44 h-56 rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'published':
        return { label: 'Опубликован', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'in_progress':
        return { label: 'В работе', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
      default:
        return { label: 'Черновик', icon: FolderOpen, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-generate/20 to-generate/5 flex items-center justify-center shadow-soft"
            whileHover={{ scale: 1.05, rotate: -5 }}
          >
            <FolderOpen className="w-5 h-5 text-generate" />
          </motion.div>
          <div>
            <h2 className="text-base font-semibold">Мои проекты</h2>
            <p className="text-xs text-muted-foreground">Альбомы и EP в работе</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="text-xs text-muted-foreground hover:text-primary gap-1.5 rounded-xl"
        >
          Все проекты
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="-mx-3 px-3">
        <div className="flex gap-4 pb-3">
          {/* Create new project card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/projects')}
            className="w-36 sm:w-44 shrink-0 cursor-pointer"
          >
            <div className="aspect-square rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent flex flex-col items-center justify-center gap-3 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Новый проект</p>
                <p className="text-[10px] text-muted-foreground">Создать альбом</p>
              </div>
            </div>
          </motion.div>

          {/* Project cards */}
          {projects?.map((project, index) => {
            const statusConfig = getStatusConfig(project.status);
            const StatusIcon = statusConfig.icon;
            const progress = project.total_tracks_count 
              ? Math.round((project.approved_tracks_count || 0) / project.total_tracks_count * 100)
              : 0;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="w-44 sm:w-52 shrink-0 cursor-pointer group"
              >
                {/* Cover */}
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                  {project.cover_url ? (
                    <img
                      src={project.cover_url}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-generate/20 via-primary/10 to-generate/5">
                      <Disc3 className="w-12 h-12 text-generate/40" />
                    </div>
                  )}

                  {/* Status badge */}
                  <Badge 
                    className={cn(
                      "absolute top-2 right-2 text-[10px] h-5 gap-1",
                      statusConfig.bg,
                      statusConfig.color,
                      "border-0"
                    )}
                  >
                    <StatusIcon className="w-2.5 h-2.5" />
                    {statusConfig.label}
                  </Badge>

                  {/* Progress indicator */}
                  {project.status !== 'published' && project.total_tracks_count && project.total_tracks_count > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-generate transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Public badge */}
                  {project.is_public && project.status === 'published' && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="secondary" className="text-[10px] h-5 bg-black/60 text-white border-0">
                        Публичный
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1 px-1">
                  <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Music className="w-3 h-3" />
                      <span>
                        {project.approved_tracks_count || 0}/{project.total_tracks_count || 0} треков
                      </span>
                    </div>
                  </div>
                  {project.genre && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {project.genre}
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
