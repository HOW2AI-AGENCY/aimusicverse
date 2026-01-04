import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, Play, Music, Disc3, 
  Sparkles, ArrowRight, Album, Mic2, Plus, BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickProjectSheet } from '@/components/project/QuickProjectSheet';

interface FeaturedProject {
  id: string;
  title: string;
  banner_url: string | null;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  project_type: string | null;
  total_tracks_count: number | null;
  profiles: {
    display_name: string | null;
    photo_url: string | null;
  } | null;
  isCreateCta?: boolean;
}

const getProjectTypeIcon = (type: string | null) => {
  switch (type) {
    case 'album': return Album;
    case 'ep': return Disc3;
    case 'single': return Music;
    case 'compilation': return Sparkles;
    default: return Disc3;
  }
};

const getProjectTypeLabel = (type: string | null) => {
  switch (type) {
    case 'album': return 'Альбом';
    case 'ep': return 'EP';
    case 'single': return 'Сингл';
    case 'compilation': return 'Сборник';
    default: return 'Проект';
  }
};

// CTA slide for creating a project
const createProjectCta: FeaturedProject = {
  id: 'create-project-cta',
  title: 'Создайте свой музыкальный проект',
  banner_url: null,
  cover_url: null,
  genre: null,
  mood: null,
  project_type: null,
  total_tracks_count: null,
  profiles: null,
  isCreateCta: true,
};

export function FeaturedProjectsBanner() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['featured-projects-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('music_projects')
        .select(`
          id,
          title,
          banner_url,
          cover_url,
          genre,
          mood,
          project_type,
          total_tracks_count,
          user_id,
          project_tracks(count)
        `)
        .eq('is_public', true)
        .not('banner_url', 'is', null)
        .order('published_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Fetch profiles separately
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, photo_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      const projectsWithProfiles = data?.map(project => {
        // Use actual track count from project_tracks relation
        const actualTrackCount = (project.project_tracks as any)?.[0]?.count || project.total_tracks_count || 0;
        return {
          ...project,
          total_tracks_count: actualTrackCount,
          profiles: profileMap.get(project.user_id) || null,
        };
      }) as FeaturedProject[];

      // Add CTA slide at the end
      return [...(projectsWithProfiles || []), createProjectCta];
    },
    staleTime: 5 * 60 * 1000,
  });

  const goToNext = useCallback(() => {
    if (!projects?.length) return;
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  }, [projects?.length]);

  const goToPrev = useCallback(() => {
    if (!projects?.length) return;
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  }, [projects?.length]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || !projects?.length || projects.length <= 1) return;
    
    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [isPaused, projects?.length, goToNext]);

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl bg-gradient-to-br from-card to-card/60 animate-pulse" 
           style={{ aspectRatio: '16/9' }} />
    );
  }

  if (!projects?.length) {
    return null;
  }

  const currentProject = projects[currentIndex];
  const TypeIcon = getProjectTypeIcon(currentProject.project_type);
  const isCtaSlide = currentProject.isCreateCta;

  return (
    <>
      <div 
        className="relative w-full rounded-2xl overflow-hidden group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Banner Container */}
        <div 
          className="relative w-full"
          style={{ aspectRatio: '16/9' }}
        >
          <AnimatePresence mode="wait">
            {isCtaSlide ? (
              /* CTA Slide */
              <motion.div
                key="create-cta"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-gradient-to-br from-primary/20 via-generate/15 to-primary/10"
              >
                {/* Animated background */}
                <div className="absolute inset-0">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  />
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-generate/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                
                {/* Icons decoration */}
                <div className="absolute inset-0 opacity-20">
                  <Album className="absolute top-4 right-8 w-16 h-16 text-primary animate-pulse" />
                  <Music className="absolute bottom-8 right-1/4 w-12 h-12 text-generate" />
                  <Disc3 className="absolute top-1/3 right-1/3 w-10 h-10 text-primary/50" />
                </div>
              </motion.div>
            ) : (
              /* Project Slide */
              <motion.div
                key={currentProject.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {/* Background Image */}
                <img
                  src={currentProject.banner_url || currentProject.cover_url || ''}
                  alt={currentProject.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                
                {/* Animated Glow */}
                <motion.div
                  className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-generate/20 blur-2xl opacity-0 group-hover:opacity-100"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="absolute inset-0 flex items-end p-4 sm:p-6 lg:p-8">
            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
              {isCtaSlide ? (
                /* CTA Content */
                <>
                  <motion.div 
                    className="flex flex-wrap items-center gap-1.5 sm:gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-generate/90 text-white gap-1 text-[10px] sm:text-xs">
                      <Sparkles className="w-3 h-3" />
                      AI-проекты
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs bg-background/60 backdrop-blur-sm">
                      Альбомы • EP • Синглы
                    </Badge>
                  </motion.div>

                  <motion.h2
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Создайте свой музыкальный проект
                  </motion.h2>

                  <motion.p 
                    className="text-sm text-muted-foreground max-w-md"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    AI сгенерирует концепцию, трек-лист и обложку. Организуйте треки в альбомы, EP или синглы.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-1 sm:pt-2 flex gap-2"
                  >
                    <Button
                      onClick={() => setCreateSheetOpen(true)}
                      className="gap-2 group/btn"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      Создать проект
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/blog/projects-guide')}
                      className="gap-2"
                      size="sm"
                    >
                      <BookOpen className="w-4 h-4" />
                      Подробнее
                    </Button>
                  </motion.div>
                </>
              ) : (
                /* Project Content */
                <>
                  {/* Tags */}
                  <motion.div 
                    className="flex flex-wrap items-center gap-1.5 sm:gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className="bg-primary/90 text-primary-foreground gap-1 text-[10px] sm:text-xs">
                      <TypeIcon className="w-3 h-3" />
                      {getProjectTypeLabel(currentProject.project_type)}
                    </Badge>
                    {currentProject.genre && (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs bg-background/60 backdrop-blur-sm">
                        {currentProject.genre}
                      </Badge>
                    )}
                    {currentProject.mood && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs bg-background/40 backdrop-blur-sm border-white/20">
                        {currentProject.mood}
                      </Badge>
                    )}
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentProject.title}
                  </motion.h2>

                  {/* Artist & Stats */}
                  <motion.div 
                    className="flex items-center gap-3 sm:gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {currentProject.profiles?.display_name && (
                      <div className="flex items-center gap-2">
                        {currentProject.profiles.photo_url ? (
                          <img 
                            src={currentProject.profiles.photo_url}
                            alt={currentProject.profiles.display_name}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-2 ring-white/30"
                          />
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <Mic2 className="w-3 h-3 text-primary" />
                          </div>
                        )}
                        <span className="text-xs sm:text-sm text-white/80">
                          {currentProject.profiles.display_name}
                        </span>
                      </div>
                    )}
                    {currentProject.total_tracks_count && currentProject.total_tracks_count > 0 && (
                      <span className="text-xs sm:text-sm text-white/60 flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {currentProject.total_tracks_count} {currentProject.total_tracks_count === 1 ? 'трек' : 
                          currentProject.total_tracks_count < 5 ? 'трека' : 'треков'}
                      </span>
                    )}
                  </motion.div>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-1 sm:pt-2"
                  >
                    <Button
                      onClick={() => navigate(`/album/${currentProject.id}`)}
                      className="gap-2 group/btn"
                      size="sm"
                    >
                      <Play className="w-4 h-4" />
                      Слушать
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          {projects.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full",
                  "bg-background/60 backdrop-blur-sm border border-white/10",
                  "flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-background/80 hover:scale-110"
                )}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={goToNext}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full",
                  "bg-background/60 backdrop-blur-sm border border-white/10",
                  "flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-background/80 hover:scale-110"
                )}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {projects.length > 1 && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
              {projects.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    idx === currentIndex 
                      ? p.isCreateCta ? "bg-generate w-4" : "bg-primary w-4"
                      : "bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickProjectSheet 
        open={createSheetOpen} 
        onOpenChange={setCreateSheetOpen}
      />
    </>
  );
}
