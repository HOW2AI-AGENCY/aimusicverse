import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Wand2, FileText, Send, Loader2, Save, Eye, ArrowLeft, ImagePlus } from "@/lib/icons";
import {
  useCreateBlogPost,
  useUpdateBlogPost,
  useAIBlogAssistant,
  useBroadcastNotification,
  useGenerateBlogCover,
  generateSlug,
  type BlogPost,
} from "@/hooks/useBlog";
import { useAuth } from "@/hooks/useAuth";
import { LazyImage } from "@/components/ui/lazy-image";

interface BlogEditorProps {
  post?: BlogPost | null;
  onBack: () => void;
}

export function BlogEditor({ post, onBack }: BlogEditorProps) {
  const { user } = useAuth();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const aiAssistant = useAIBlogAssistant();
  const broadcast = useBroadcastNotification();
  const generateCover = useGenerateBlogCover();

  const [title, setTitle] = useState(post?.title || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [excerpt, setExcerpt] = useState(post?.excerpt || "");
  const [content, setContent] = useState(post?.content || "");
  const [coverUrl, setCoverUrl] = useState(post?.cover_url || "");
  const [isPublished, setIsPublished] = useState(post?.is_published || false);
  const [aiPrompt, setAiPrompt] = useState("");

  // Handle title change and auto-generate slug if needed
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!post && !slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const postData = {
      title,
      slug: slug || generateSlug(title),
      excerpt,
      content,
      cover_url: coverUrl || null,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      author_id: user.id,
    };

    if (post) {
      await updatePost.mutateAsync({ id: post.id, ...postData });
    } else {
      await createPost.mutateAsync(postData);
    }
  };

  const handleGenerateArticle = async () => {
    if (!aiPrompt) return;
    const result = await aiAssistant.mutateAsync({
      action: "generate_article",
      prompt: aiPrompt,
    });
    setContent(result);
  };

  const handleImproveArticle = async () => {
    if (!content) return;
    const result = await aiAssistant.mutateAsync({
      action: "improve_article",
      content,
    });
    setContent(result);
  };

  const handleGenerateExcerpt = async () => {
    if (!content) return;
    const result = await aiAssistant.mutateAsync({
      action: "generate_excerpt",
      content,
    });
    setExcerpt(result);
  };

  const handleGenerateTitle = async () => {
    if (!aiPrompt && !content) return;
    const result = await aiAssistant.mutateAsync({
      action: "generate_title",
      prompt: aiPrompt || content.substring(0, 500),
    });
    handleTitleChange(result.trim());
  };

  const handleBroadcast = async () => {
    if (!post?.id) {
      await handleSave();
    }
    await broadcast.mutateAsync({
      title: `📝 Новая статья: ${title}`,
      message: excerpt || content.substring(0, 200) + "...",
      blogPostId: post?.id,
    });
  };

  const handleGenerateCover = async () => {
    if (!title) return;
    const newCoverUrl = await generateCover.mutateAsync({
      title,
      excerpt: excerpt || undefined,
      content: content || undefined,
      blogPostId: post?.id,
    });
    setCoverUrl(newCoverUrl);
  };

  const isLoading = createPost.isPending || updatePost.isPending || aiAssistant.isPending || generateCover.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
        <h2 className="text-xl font-bold">{post ? "Редактирование статьи" : "Новая статья"}</h2>
      </div>

      {/* AI Assistant */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Ассистент
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Опишите тему статьи..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <Button onClick={handleGenerateArticle} disabled={!aiPrompt || aiAssistant.isPending} size="sm">
              {aiAssistant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateTitle}
              disabled={aiAssistant.isPending || (!aiPrompt && !content)}
            >
              <FileText className="h-3 w-3 mr-1" />
              Заголовок
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateExcerpt}
              disabled={aiAssistant.isPending || !content}
            >
              <FileText className="h-3 w-3 mr-1" />
              Описание
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImproveArticle}
              disabled={aiAssistant.isPending || !content}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Улучшить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Post Fields */}
      <div className="space-y-4">
        <div>
          <Label>Заголовок</Label>
          <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Заголовок статьи" />
        </div>

        <div>
          <Label>URL (slug)</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="url-stati" />
        </div>

        <div>
          <Label>Краткое описание</Label>
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Краткое описание для превью"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Обложка</Label>
          <div className="flex gap-2">
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... или сгенерируйте AI"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateCover}
              disabled={generateCover.isPending || !title}
              title="Сгенерировать обложку с помощью AI"
            >
              {generateCover.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
          </div>
          {coverUrl && (
            <LazyImage src={coverUrl} alt="Обложка статьи" className="w-full max-w-md h-32 object-cover rounded-md border" />
          )}
        </div>

        <div>
          <Label>Содержимое (Markdown)</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Текст статьи в формате Markdown..."
            rows={15}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          <Label>Опубликовать</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={isLoading || !title || !content}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Сохранить
        </Button>
        <Button variant="outline" onClick={onBack}>
          <Eye className="h-4 w-4 mr-1" />
          Превью
        </Button>
        {post?.is_published && (
          <Button variant="secondary" onClick={handleBroadcast} disabled={broadcast.isPending}>
            {broadcast.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Разослать
          </Button>
        )}
      </div>
    </div>
  );
}
