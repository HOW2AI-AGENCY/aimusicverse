import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlogPost {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useBlogPosts(onlyPublished = true) {
  return useQuery({
    queryKey: ["blog-posts", onlyPublished],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false, nullsFirst: false });

      if (onlyPublished) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

export function useBlogPost(slugOrId: string | undefined) {
  return useQuery({
    queryKey: ["blog-post", slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;
      
      // Try to find by slug first, then by ID
      let { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slugOrId)
        .single();

      if (error || !data) {
        const result = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", slugOrId)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slugOrId,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (post: Omit<BlogPost, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Статья создана");
    },
    onError: (error) => {
      toast.error("Ошибка создания статьи: " + error.message);
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post", data.slug] });
      queryClient.invalidateQueries({ queryKey: ["blog-post", data.id] });
      toast.success("Статья обновлена");
    },
    onError: (error) => {
      toast.error("Ошибка обновления: " + error.message);
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Статья удалена");
    },
    onError: (error) => {
      toast.error("Ошибка удаления: " + error.message);
    },
  });
}

export function useBroadcastNotification() {
  return useMutation({
    mutationFn: async (data: { 
      title: string; 
      message: string; 
      targetType?: string;
      blogPostId?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("broadcast-notification", {
        body: data,
      });

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Отправлено: ${result.sentCount}, ошибок: ${result.failedCount}`);
    },
    onError: (error) => {
      toast.error("Ошибка рассылки: " + error.message);
    },
  });
}

export function useAIBlogAssistant() {
  return useMutation({
    mutationFn: async (data: { 
      action: "generate_article" | "improve_article" | "generate_excerpt" | "generate_title";
      prompt?: string;
      content?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("ai-blog-assistant", {
        body: data,
      });

      if (error) throw error;
      return result.content as string;
    },
    onError: (error) => {
      toast.error("Ошибка AI: " + error.message);
    },
  });
}

export function useGenerateBlogCover() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      title: string;
      excerpt?: string;
      content?: string;
      blogPostId?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("generate-blog-cover", {
        body: data,
      });

      if (error) throw error;
      return result.coverUrl as string;
    },
    onSuccess: (_, variables) => {
      if (variables.blogPostId) {
        queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
        queryClient.invalidateQueries({ queryKey: ["blog-post", variables.blogPostId] });
      }
      toast.success("Обложка сгенерирована");
    },
    onError: (error) => {
      toast.error("Ошибка генерации обложки: " + error.message);
    },
  });
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-а-яё]/gi, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}
