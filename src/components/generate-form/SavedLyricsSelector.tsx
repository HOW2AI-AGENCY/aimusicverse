/**
 * SavedLyricsSelector - Select from saved lyrics templates
 * Phase 3: Improved generation flow
 */

import { useState } from 'react';
import { FileText, Search, Clock, Tag, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLyricsTemplates, LyricsTemplate } from '@/hooks/useLyricsTemplates';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, ru } from '@/lib/date-utils';

interface SavedLyricsSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: LyricsTemplate) => void;
}

export function SavedLyricsSelector({ open, onOpenChange, onSelect }: SavedLyricsSelectorProps) {
  const { templates, isLoading } = useLyricsTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredTemplates = templates?.filter(template => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.lyrics.toLowerCase().includes(query) ||
      template.genre?.toLowerCase().includes(query) ||
      template.mood?.toLowerCase().includes(query)
    );
  }) || [];

  const handleSelect = (template: LyricsTemplate) => {
    setSelectedId(template.id);
    onSelect(template);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Сохранённые тексты
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, тексту, жанру..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Templates List */}
        <ScrollArea className="flex-1 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'Ничего не найдено' : 'Нет сохранённых текстов'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    selectedId === template.id && "border-primary bg-primary/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>
                    {selectedId === template.id && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {template.lyrics.slice(0, 100)}...
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    {template.genre && (
                      <Badge variant="outline" className="text-[10px] h-5">
                        <Tag className="w-3 h-3 mr-1" />
                        {template.genre}
                      </Badge>
                    )}
                    {template.mood && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {template.mood}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(template.created_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
