import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { FileText, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function FeaturedBlogBanners() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts(true);

  const featuredPosts = posts?.slice(0, 4) || [];

  if (isLoading) {
    return (
      <section className="mb-4 sm:mb-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Статьи и гайды</h2>
        </div>
        <ScrollArea className="-mx-3 px-3">
          <div className="flex gap-3 pb-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="min-w-[260px] h-[140px] rounded-xl flex-shrink-0" />
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
    <section className="mb-4 sm:mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">Статьи и гайды</h2>
        </div>
        <button
          onClick={() => navigate('/blog')}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          Все статьи
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <ScrollArea className="-mx-3 px-3">
        <div className="flex gap-3 pb-2">
          {featuredPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              onClick={() => navigate(`/blog?post=${post.slug}`)}
              className="min-w-[260px] sm:min-w-[300px] flex-shrink-0 cursor-pointer group"
            >
              <div className="relative h-[140px] sm:h-[160px] rounded-xl overflow-hidden bg-gradient-to-br from-card to-card/80 border border-border/50 hover:border-primary/30 transition-all duration-300">
                {/* Background image with overlay */}
                {post.cover_url ? (
                  <>
                    <img
                      src={post.cover_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-generate/5" />
                )}

                {/* Content */}
                <div className="relative h-full flex flex-col justify-between p-3 sm:p-4">
                  {/* Top - Badges */}
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 gap-1 h-5">
                        <Sparkles className="w-2.5 h-2.5" />
                        Новое
                      </Badge>
                    )}
                    {post.published_at && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(post.published_at), 'd MMM', { locale: ru })}
                      </span>
                    )}
                  </div>

                  {/* Bottom - Title & Excerpt */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-primary" />
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
