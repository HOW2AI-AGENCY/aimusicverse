import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLyricsTemplates, LyricsTemplate } from '@/hooks/useLyricsTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Trash2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { VirtualizedLyricsList } from '@/components/content-hub/VirtualizedLyricsList';
import { StructuredLyricsPreview } from '@/components/lyrics-workspace/ai-agent/results/StructuredLyricsPreview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LyricsTab() {
  const navigate = useNavigate();
  const { templates, isLoading, deleteTemplate } = useLyricsTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<LyricsTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (templateId: string) => {
    navigate(`/lyrics-studio?template=${templateId}`);
  };

  const filteredTemplates = templates?.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lyrics.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    setDeleteConfirmId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Поиск по текстам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Stats */}
      <div className="text-xs text-muted-foreground">
        {templates?.length || 0} сохраненных текстов
      </div>

      {/* Templates List */}
      {filteredTemplates.length > 0 ? (
        <VirtualizedLyricsList
          templates={filteredTemplates}
          onSelect={setSelectedTemplate}
          onDelete={setDeleteConfirmId}
        />
      ) : (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Ничего не найдено' : 'Нет сохраненных текстов'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Сохраняйте тексты из AI Lyrics Assistant
          </p>
        </div>
      )}

      {/* Lyrics Detail Sheet */}
      <Sheet open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
          {selectedTemplate && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTemplate.name}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full mt-4 pr-4">
                <div className="space-y-4 pb-8">
                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTemplate.genre && (
                      <Badge variant="secondary">{selectedTemplate.genre}</Badge>
                    )}
                    {selectedTemplate.mood && (
                      <Badge variant="outline">{selectedTemplate.mood}</Badge>
                    )}
                    {selectedTemplate.structure && (
                      <Badge variant="outline">{selectedTemplate.structure}</Badge>
                    )}
                    {selectedTemplate.style && (
                      <Badge variant="outline">{selectedTemplate.style}</Badge>
                    )}
                  </div>

                  {/* Lyrics - Visual Display */}
                  <StructuredLyricsPreview lyrics={selectedTemplate.lyrics} />

                  {/* Actions - icon buttons only */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="default"
                      size="icon"
                      onClick={() => {
                        handleEdit(selectedTemplate.id);
                        setSelectedTemplate(null);
                      }}
                    >
                      <PenLine className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        setDeleteConfirmId(selectedTemplate.id);
                        setSelectedTemplate(null);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить текст?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
