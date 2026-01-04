import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { FileText, Sparkles, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, ru } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export function FeaturedBlogBanners() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts(true);

  const featuredPosts = posts?.slice(0, 4) || [];

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Статьи и гайды</h2>
            <p className="text-xs text-muted-foreground">Полезные материалы</p>
          </div>
        </div>
        <ScrollArea className="-mx-3 px-3">
          <div className="flex gap-3 pb-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-[160px] sm:w-[200px] h-[140px] sm:h-[160px] rounded-xl flex-shrink-0" />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>
    );
  }

  if (!featuredPosts.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-soft"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <BookOpen className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-base font-semibold">Статьи и гайды</h2>
            <p className="text-xs text-muted-foreground">Полезные материалы о музыке</p>
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

      {/* Cards */}
      <ScrollArea className="-mx-3 px-3">
        <div className="flex gap-3 pb-3">
          {featuredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/blog?post=${post.slug}`)}
              className="w-[160px] sm:w-[200px] flex-shrink-0 cursor-pointer group"
            >
              <div className={cn(
                "relative rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/80",
                "border border-border/50 hover:border-primary/40 transition-all duration-300",
                "shadow-sm hover:shadow-lg h-[140px] sm:h-[160px]"
              )}>
                {/* Background */}
                {post.cover_url ? (
                  <>
                    <img
                      src={post.cover_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
                )}

                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between">
                    {index === 0 ? (
                      <Badge className="text-[9px] bg-primary/20 text-primary border-0 gap-1 h-4 px-1.5">
                        <Sparkles className="w-2 h-2" />
                        Новое
                      </Badge>
                    ) : (
                      <div />
                    )}
                    {post.published_at && (
                      <span className="text-[9px] text-muted-foreground/70 flex items-center gap-0.5">
                        <Clock className="w-2 h-2" />
                        {format(new Date(post.published_at), 'd MMM', { locale: ru })}
                      </span>
                    )}
                  </div>

                  {/* Bottom content */}
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h3>
                    
                    {/* Read more indicator */}
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-primary/70 font-medium group-hover:text-primary transition-colors">
                        Читать
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
