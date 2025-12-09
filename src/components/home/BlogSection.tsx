import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function BlogSection() {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts(true);

  // Show only latest 3 posts
  const latestPosts = posts?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Блог</h2>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!latestPosts.length) {
    return null;
  }

  return (
    <section className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Блог</h2>
            <p className="text-xs text-muted-foreground">Статьи и советы</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/blog')}
          className="text-xs text-muted-foreground hover:text-primary gap-1"
        >
          Все статьи
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Posts Grid */}
      <div className="space-y-3">
        {latestPosts.map((post, index) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/blog?post=${post.slug}`)}
            className="group cursor-pointer"
          >
            <div className="relative p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300">
              {/* Featured badge for first post */}
              {index === 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px] bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Новое
                </Badge>
              )}

              <div className="flex items-start gap-4">
                {/* Cover image or icon */}
                {post.cover_url ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={post.cover_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary/60" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {post.published_at
                        ? format(new Date(post.published_at), 'd MMM yyyy', { locale: ru })
                        : format(new Date(post.created_at), 'd MMM yyyy', { locale: ru })}
                    </span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* View all button for mobile */}
      <Button
        variant="outline"
        className="w-full mt-3 rounded-xl border-dashed"
        onClick={() => navigate('/blog')}
      >
        <FileText className="w-4 h-4 mr-2" />
        Все статьи блога
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Button>
    </section>
  );
}
