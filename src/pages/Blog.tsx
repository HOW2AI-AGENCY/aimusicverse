import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Edit, Calendar, ArrowLeft, Trash2 } from "lucide-react";
import { useBlogPosts, useBlogPost, useDeleteBlogPost, type BlogPost } from "@/hooks/useBlog";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { BlogContentRenderer } from "@/components/blog/BlogContentRenderer";
import { formatDistanceToNow, format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Blog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postSlug = searchParams.get("post");
  
  const { data: adminAuth } = useAdminAuth();
  const isAdmin = adminAuth?.isAdmin;
  
  const { data: posts, isLoading } = useBlogPosts(!isAdmin);
  const { data: selectedPost } = useBlogPost(postSlug || undefined);
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
      <div className="container max-w-4xl mx-auto px-4 py-6 pb-24">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/blog")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Все статьи
        </Button>

        {selectedPost.cover_url && (
          <img 
            src={selectedPost.cover_url} 
            alt={selectedPost.title}
            className="w-full h-48 object-cover rounded-lg mb-6"
          />
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{selectedPost.title}</h1>
            {selectedPost.published_at && (
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(selectedPost.published_at), "d MMMM yyyy", { locale: ru })}
              </p>
            )}
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

        {!selectedPost.is_published && (
          <Badge variant="secondary" className="mb-4">Черновик</Badge>
        )}

        <BlogContentRenderer content={selectedPost.content} />
      </div>
    );
  }

  // Blog list
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full glass-card border-primary/20">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Блог
              </h1>
              <p className="text-muted-foreground">Новости и обновления</p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Новая статья
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="overflow-hidden hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/blog?post=${post.slug}`)}
              >
                <div className="flex">
                  {post.cover_url && (
                    <img 
                      src={post.cover_url} 
                      alt="" 
                      className="w-32 h-32 object-cover hidden sm:block"
                    />
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                        {!post.is_published && (
                          <Badge variant="secondary" className="mb-2">Черновик</Badge>
                        )}
                        {post.excerpt && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingPost(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deletePost.mutate(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {post.published_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(post.published_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
