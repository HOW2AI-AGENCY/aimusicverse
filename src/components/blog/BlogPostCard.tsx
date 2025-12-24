import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Edit, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow, format, ru } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/hooks/useBlog';

interface BlogPostCardProps {
  post: BlogPost;
  isAdmin?: boolean;
  onEdit?: (post: BlogPost) => void;
  onDelete?: (id: string) => void;
  variant?: 'default' | 'featured' | 'compact';
}

// Estimate reading time (words per minute)
function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export const BlogPostCard = memo(function BlogPostCard({
  post,
  isAdmin,
  onEdit,
  onDelete,
  variant = 'default',
}: BlogPostCardProps) {
  const navigate = useNavigate();
  const readingTime = getReadingTime(post.content);

  const handleClick = () => {
    navigate(`/blog?post=${post.slug}`);
  };

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          className="group relative overflow-hidden cursor-pointer border-primary/20 hover:border-primary/40 transition-all duration-300"
          onClick={handleClick}
        >
          {/* Hero image */}
          <div className="relative h-48 sm:h-64 overflow-hidden">
            {post.cover_url ? (
              <img
                src={post.cover_url}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-6xl opacity-20">📝</span>
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            
            {/* Featured badge */}
            <Badge className="absolute top-4 left-4 bg-primary/90">
              Рекомендуем
            </Badge>
          </div>

          {/* Content */}
          <div className="relative p-6 -mt-16">
            <div className="flex flex-wrap gap-2 mb-3">
              {!post.is_published && (
                <Badge variant="secondary">Черновик</Badge>
              )}
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
              {post.title}
            </h2>
            
            {post.excerpt && (
              <p className="text-muted-foreground line-clamp-2 mb-4">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), 'd MMM yyyy', { locale: ru })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {readingTime} мин
              </span>
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="absolute top-4 right-4 flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="icon" onClick={() => onEdit?.(post)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={() => onDelete?.(post.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={handleClick}
        >
          {post.cover_url && (
            <img
              src={post.cover_url}
              alt=""
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1">{post.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {post.published_at && formatDistanceToNow(new Date(post.published_at), {
                addSuffix: true,
                locale: ru,
              })}
            </p>
          </div>
          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group overflow-hidden cursor-pointer',
          'border-border/50 hover:border-primary/30',
          'transition-all duration-300',
          'hover:shadow-lg hover:shadow-primary/5'
        )}
        onClick={handleClick}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          {post.cover_url ? (
            <div className="relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
              <img
                src={post.cover_url}
                alt=""
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/20 sm:block hidden" />
            </div>
          ) : (
            <div className="w-full sm:w-40 h-32 sm:h-auto flex-shrink-0 bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
              <span className="text-4xl opacity-30">📄</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {!post.is_published && (
                      <Badge variant="secondary" className="text-xs">Черновик</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </div>
                
                {/* Admin actions */}
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit?.(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete?.(post.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              {post.excerpt && (
                <p className="text-muted-foreground text-sm line-clamp-2 mt-2">
                  {post.excerpt}
                </p>
              )}
            </div>

            {/* Meta footer */}
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(post.published_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingTime} мин чтения
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
