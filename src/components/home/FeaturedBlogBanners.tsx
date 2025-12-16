import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { FileText, Sparkles, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
          <div className="flex gap-4 pb-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="min-w-[280px] h-[180px] rounded-2xl flex-shrink-0" />
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
        <div className="flex gap-4 pb-3">
          {featuredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              onClick={() => navigate(`/blog?post=${post.slug}`)}
              className={cn(
                "min-w-[280px] sm:min-w-[320px] flex-shrink-0 cursor-pointer group",
                index === 0 && "min-w-[300px] sm:min-w-[360px]"
              )}
            >
              <div className={cn(
                "relative rounded-2xl overflow-hidden bg-gradient-to-br from-card to-card/90",
                "border border-border/50 hover:border-primary/40 transition-all duration-300",
                "shadow-soft hover:shadow-lg",
                index === 0 ? "h-[200px] sm:h-[220px]" : "h-[170px] sm:h-[190px]"
              )}>
                {/* Background */}
                {post.cover_url ? (
                  <>
                    <img
                      src={post.cover_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-generate/10" />
                )}

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-generate/5 rounded-full blur-2xl" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-4 sm:p-5">
                  {/* Top badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Badge className="text-[10px] bg-gradient-to-r from-primary/30 to-primary/20 text-primary border-primary/30 gap-1 h-5 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                          Новое
                        </Badge>
                      )}
                    </div>
                    {post.published_at && (
                      <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 bg-background/50 px-2 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(post.published_at), 'd MMM', { locale: ru })}
                      </span>
                    )}
                  </div>

                  {/* Bottom content */}
                  <div className="space-y-2">
                    <h3 className={cn(
                      "font-semibold line-clamp-2 group-hover:text-primary transition-colors leading-tight",
                      index === 0 ? "text-base sm:text-lg" : "text-sm sm:text-base"
                    )}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    
                    {/* Read more indicator */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-primary/80 font-medium group-hover:text-primary transition-colors">
                        Читать статью
                      </span>
                      <ArrowRight className="w-3 h-3 text-primary/60 group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
