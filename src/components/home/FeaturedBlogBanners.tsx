import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';

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
              <Skeleton key={i} className="min-w-[280px] h-32 rounded-xl flex-shrink-0" />
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
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/blog?post=${post.slug}`)}
              className="min-w-[280px] sm:min-w-[320px] flex-shrink-0 cursor-pointer group"
            >
              <GlassCard 
                className="h-32 sm:h-36 p-4 relative overflow-hidden"
                hover="glow"
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
                
                {/* Cover image overlay if exists */}
                {post.cover_url && (
                  <div className="absolute inset-0 opacity-20">
                    <img
                      src={post.cover_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
                  </div>
                )}
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  {/* Top badges */}
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary border-primary/20 gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Новое
                      </Badge>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hover arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </GlassCard>
            </motion.article>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
