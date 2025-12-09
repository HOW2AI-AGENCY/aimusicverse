import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit, Calendar, ArrowLeft, Trash2, Share2 } from "lucide-react";
import { useBlogPosts, useBlogPost, useDeleteBlogPost, type BlogPost } from "@/hooks/useBlog";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogHeroSection } from "@/components/blog/BlogHeroSection";
import { BlogListSkeleton } from "@/components/blog/BlogSkeleton";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Blog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postSlug = searchParams.get("post");
  
  const { data: adminAuth } = useAdminAuth();
  const isAdmin = adminAuth?.isAdmin;
  
  const { data: posts, isLoading } = useBlogPosts(!isAdmin);
  const { data: selectedPost, isLoading: isLoadingPost } = useBlogPost(postSlug || undefined);
  const deletePost = useDeleteBlogPost();
  
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Show editor if creating or editing
  if (isCreating || editingPost) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        <BlogEditor 
          post={editingPost} 
          onBack={() => {
            setEditingPost(null);
            setIsCreating(false);
          }} 
        />
      </div>
    );
  }

  // Show single post
  if (selectedPost) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen pb-24"
      >
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/blog")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Все статьи
          </Button>

          {/* Hero image */}
          {selectedPost.cover_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden mb-8"
            >
              <img 
                src={selectedPost.cover_url} 
                alt={selectedPost.title}
                className="w-full h-48 sm:h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </motion.div>
          )}

          {/* Article header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                {!selectedPost.is_published && (
                  <Badge variant="secondary" className="mb-3">Черновик</Badge>
                )}
                <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
                  {selectedPost.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {selectedPost.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedPost.published_at), "d MMMM yyyy", { locale: ru })}
                    </span>
                  )}
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <Share2 className="h-4 w-4" />
                    Поделиться
                  </Button>
                </div>
              </div>
              
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingPost(selectedPost)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Редактировать
                </Button>
              )}
            </div>

            {/* Excerpt as lead paragraph */}
            {selectedPost.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4">
                {selectedPost.excerpt}
              </p>
            )}
          </motion.div>

          {/* Article content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BlogContentRenderer content={selectedPost.content} />
          </motion.article>

          {/* Footer with share/related */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 pt-8 border-t border-border/50"
          >
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => navigate("/blog")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Все статьи
              </Button>
              <Button variant="ghost" className="gap-2">
                <Share2 className="h-4 w-4" />
                Поделиться
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Blog list
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Hero section */}
        <BlogHeroSection 
          isAdmin={isAdmin} 
          onCreateNew={() => setIsCreating(true)} 
        />

        {/* Loading state */}
        {isLoading ? (
          <BlogListSkeleton />
        ) : posts && posts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="space-y-6">
              {/* Featured post (first one) */}
              {posts[0] && (
                <BlogPostCard
                  post={posts[0]}
                  variant="featured"
                  isAdmin={isAdmin}
                  onEdit={setEditingPost}
                  onDelete={(id) => deletePost.mutate(id)}
                />
              )}

              {/* Rest of posts in grid */}
              {posts.length > 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {posts.slice(1).map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <BlogPostCard
                        post={post}
                        isAdmin={isAdmin}
                        onEdit={setEditingPost}
                        onDelete={(id) => deletePost.mutate(id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-12 glass-card border-primary/20 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {isAdmin ? "Создайте первую статью" : "Статьи скоро появятся"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isAdmin ? "Нажмите кнопку выше, чтобы создать статью" : "Следите за обновлениями"}
              </p>
              {isAdmin && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Создать статью
                </Button>
              )}
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
