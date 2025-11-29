import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Wand2, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProjectCoverEditorProps {
  projectId: string;
  currentCoverUrl?: string | null;
  projectTitle: string;
  projectGenre?: string | null;
  projectMood?: string | null;
  onCoverUpdate: (coverUrl: string) => void;
}

export function ProjectCoverEditor({
  projectId,
  currentCoverUrl,
  projectTitle,
  projectGenre,
  projectMood,
  onCoverUpdate,
}: ProjectCoverEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState(
    `Professional album cover art for "${projectTitle}" - ${projectGenre || 'music'} project with ${projectMood || 'energetic'} mood`
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 5MB');
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      // Update project cover_url
      const { error: updateError } = await supabase
        .from('music_projects')
        .update({ cover_url: publicUrl })
        .eq('id', projectId);

      if (updateError) throw updateError;

      onCoverUpdate(publicUrl);
      toast.success('Обложка загружена');
      setIsOpen(false);
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Ошибка загрузки обложки');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!generationPrompt.trim()) {
      toast.error('Введите описание обложки');
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-image', {
        body: {
          projectId,
          prompt: generationPrompt,
        },
      });

      if (error) throw error;

      if (data?.coverUrl) {
        onCoverUpdate(data.coverUrl);
        toast.success('Обложка сгенерирована');
        setIsOpen(false);
      } else {
        throw new Error('No cover URL returned');
      }
    } catch (error) {
      console.error('Error generating cover:', error);
      toast.error('Ошибка генерации обложки');
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveCover = async () => {
    try {
      const { error } = await supabase
        .from('music_projects')
        .update({ cover_url: null })
        .eq('id', projectId);

      if (error) throw error;

      onCoverUpdate('');
      toast.success('Обложка удалена');
    } catch (error) {
      console.error('Error removing cover:', error);
      toast.error('Ошибка удаления обложки');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Обложка проекта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentCoverUrl ? (
            <div className="relative group">
              <img
                src={currentCoverUrl}
                alt="Project cover"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Upload className="w-4 h-4 mr-2" />
                    Изменить
                  </Button>
                </DialogTrigger>
                <Button size="sm" variant="destructive" onClick={handleRemoveCover}>
                  <X className="w-4 h-4 mr-2" />
                  Удалить
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Добавить обложку
                </Button>
              </DialogTrigger>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Обложка проекта</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-3">
            <Label>Загрузить изображение</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Выбрать файл
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP до 5MB. Рекомендуемый размер: 1000x1000px
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Или</span>
            </div>
          </div>

          {/* AI Generation Section */}
          <div className="space-y-3">
            <Label htmlFor="prompt">Сгенерировать с помощью AI</Label>
            <Textarea
              id="prompt"
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder="Опишите обложку..."
              rows={3}
              disabled={generating}
            />
            <Button
              onClick={handleGenerateCover}
              disabled={generating || !generationPrompt.trim()}
              className="w-full gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Сгенерировать обложку
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              AI создаст уникальную обложку на основе вашего описания
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
