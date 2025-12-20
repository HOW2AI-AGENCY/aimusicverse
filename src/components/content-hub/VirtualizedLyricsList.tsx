import { forwardRef, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LyricsTemplate } from '@/hooks/useLyricsTemplates';

interface VirtualizedLyricsListProps {
  templates: LyricsTemplate[];
  onSelect: (template: LyricsTemplate) => void;
  onDelete: (id: string) => void;
}

// List container
const ListContainer = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => (
    <div ref={ref} {...props} className="space-y-2" />
  )
);
ListContainer.displayName = "ListContainer";

export function VirtualizedLyricsList({
  templates,
  onSelect,
  onDelete,
}: VirtualizedLyricsListProps) {
  const handleCopy = useCallback((lyrics: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lyrics);
    toast.success('Текст скопирован');
  }, []);

  const renderLyricsItem = useCallback((index: number, template: LyricsTemplate) => {
    return (
      <div
        onClick={() => onSelect(template)}
        className={cn(
          "p-3 rounded-xl bg-card/50 border border-border/50",
          "hover:bg-card hover:border-border cursor-pointer transition-all",
          "active:scale-[0.99] touch-manipulation"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{template.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 whitespace-pre-wrap">
              {template.lyrics ? (
                template.lyrics.substring(0, 100) + (template.lyrics.length > 100 ? '...' : '')
              ) : (
                <span className="italic">Нет текста</span>
              )}
            </p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {template.genre && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  {template.genre}
                </Badge>
              )}
              {template.mood && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {template.mood}
                </Badge>
              )}
              {template.structure && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                  {template.structure}
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => handleCopy(template.lyrics, e)}>
                <Copy className="w-4 h-4 mr-2" />
                Копировать
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }, [onSelect, onDelete, handleCopy]);

  return (
    <Virtuoso
      useWindowScroll
      totalCount={templates.length}
      overscan={400}
      components={{
        List: ListContainer,
      }}
      itemContent={(index) => renderLyricsItem(index, templates[index])}
    />
  );
}
