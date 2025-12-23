import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { Sparkles, ArrowRight, Clock, BookOpen, Users } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

export function FeaturedBlogHero() {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const { data: posts, isLoading } = useBlogPosts(true);

  const featuredPost = posts?.[0];
  const otherPosts = posts?.slice(1, 4) || [];

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="w-full h-[200px] rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-[140px] h-24 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (!featuredPost) {
    return null;
  }

  const handleMainClick = () => {
    hapticFeedback?.('light');
    navigate(`/blog?post=${featuredPost.slug}`);
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-generate/10 flex items-center justify-center shadow-soft"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <BookOpen className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Статьи и гайды</h2>
              <Badge variant="secondary" className="text-[9px] h-4 gap-0.5 bg-primary/10 text-primary border-0">
                <Sparkles className="w-2 h-2" />
                Новое
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Узнайте больше о создании музыки</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/blog')}
          className="text-xs text-muted-foreground hover:text-primary gap-1.5 rounded-xl"
        >
          Все статьи
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Main Featured Post - Large Banner */}
      <motion.article
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleMainClick}
        className="relative overflow-hidden rounded-2xl cursor-pointer group"
      >
        {/* Background */}
        <div className="relative h-[180px] sm:h-[200px]">
          {featuredPost.cover_url ? (
            <>
              <motion.img
                src={featuredPost.cover_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-generate/20 to-accent/10" />
          )}

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5">
            {/* Tags */}
            <div className="flex items-center gap-2 mb-2">
              <Badge className="text-[9px] bg-primary text-primary-foreground border-0 gap-1 h-5 px-2">
                <Sparkles className="w-2.5 h-2.5" />
                Рекомендуем
              </Badge>
              {featuredPost.published_at && (
                <span className="text-[10px] text-white/70 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {format(new Date(featuredPost.published_at), 'd MMMM', { locale: ru })}
                </span>
              )}
            </div>

            {/* Title - with proper truncation */}
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2 sm:line-clamp-1 break-words">
              {featuredPost.title}
            </h3>

            {/* Excerpt */}
            {featuredPost.excerpt && (
              <p className="text-xs sm:text-sm text-white/70 line-clamp-2 mb-3">
                {featuredPost.excerpt}
              </p>
            )}

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                className="h-8 px-4 text-xs gap-1.5 rounded-lg"
              >
                Читать статью
                <ArrowRight className="w-3 h-3" />
              </Button>
              <span className="text-[10px] text-white/50 flex items-center gap-1">
                <Users className="w-3 h-3" />
                Подпишитесь на авторов
              </span>
            </div>
          </div>
        </div>
      </motion.article>

      {/* Secondary Posts - Compact Scroll */}
      {otherPosts.length > 0 && (
        <ScrollArea className="-mx-3 px-3">
          <div className="flex gap-3 pb-2">
            {otherPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  hapticFeedback?.('light');
                  navigate(`/blog?post=${post.slug}`);
                }}
                className="w-[140px] sm:w-[160px] flex-shrink-0 cursor-pointer group"
              >
                <div className={cn(
                  "relative rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/80",
                  "border border-border/50 hover:border-primary/40 transition-all duration-300",
                  "h-24 sm:h-28"
                )}>
                  {/* Background */}
                  {post.cover_url ? (
                    <>
                      <img
                        src={post.cover_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
                  )}

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-2.5">
                    <h4 className="text-[11px] font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h4>
                    <span className="text-[9px] text-primary/70 font-medium mt-1 flex items-center gap-0.5">
                      Читать
                      <ArrowRight className="w-2 h-2 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </section>
  );
}
