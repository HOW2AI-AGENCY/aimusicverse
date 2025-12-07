import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Search, Trash2, Copy, Check, 
  ArrowRight, Plus, Sparkles, BookOpen
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '@/contexts/TelegramContext';

interface Template {
  id: string;
  name: string;
  template_text: string;
  tags: string[];
  created_at: string;
  usage_count: number;
}

const Templates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Шаблон удалён');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Ошибка удаления');
    },
  });

  const incrementUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prompt_templates')
        .update({ usage_count: (templates.find(t => t.id === id)?.usage_count || 0) + 1 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    t.template_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    hapticFeedback('light');
    setTimeout(() => setCopied(false), 2000);
    toast.success('Скопировано');
  };

  const handleUseTemplate = (template: Template) => {
    hapticFeedback('medium');
    incrementUsageMutation.mutate(template.id);
    
    // Store template in sessionStorage for GenerateSheet to pick up
    sessionStorage.setItem('templateLyrics', template.template_text);
    sessionStorage.setItem('templateName', template.name);
    
    setSelectedTemplate(null);
    navigate('/generate');
    toast.success('Шаблон загружен');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 safe-area-top">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Мои шаблоны</h1>
            <p className="text-sm text-muted-foreground">
              {templates.length} {templates.length === 1 ? 'шаблон' : 'шаблонов'}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск шаблонов..."
            className="pl-10 bg-muted/50 border-border/50"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Ничего не найдено' : 'Нет сохранённых шаблонов'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {searchQuery 
                ? 'Попробуйте изменить запрос'
                : 'Создайте текст песни с помощью AI и сохраните его в библиотеку'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/generate')} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Создать текст
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <button
                    onClick={() => {
                      hapticFeedback('light');
                      setSelectedTemplate(template);
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border border-border/50",
                      "bg-card hover:bg-muted/50 transition-colors",
                      "touch-manipulation"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium text-sm line-clamp-1 flex-1">
                        {template.name}
                      </h3>
                      {template.usage_count > 0 && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {template.usage_count}×
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {template.template_text}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-xs px-2 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-0">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(template.created_at)}
                      </span>
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Template Detail Sheet */}
      <Sheet open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left line-clamp-1">
              {selectedTemplate?.name}
            </SheetTitle>
            <SheetDescription className="text-left">
              Создан {selectedTemplate && formatDate(selectedTemplate.created_at)}
            </SheetDescription>
          </SheetHeader>

          {selectedTemplate && (
            <>
              {/* Tags */}
              {selectedTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-4">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Lyrics Content */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {selectedTemplate.template_text}
                  </pre>
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex gap-2 pt-4 safe-area-bottom">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => handleCopy(selectedTemplate.template_text)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(selectedTemplate.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => handleUseTemplate(selectedTemplate)}
                >
                  Использовать
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Шаблон будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Templates;
