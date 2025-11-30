import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  History, Search, Trash2, Copy, RefreshCw, 
  Clock, Music2, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PromptHistoryItem {
  id: string;
  timestamp: Date;
  mode: 'simple' | 'custom';
  description?: string;
  title?: string;
  style?: string;
  lyrics?: string;
  model: string;
  tags?: string[];
}

interface PromptHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt: (prompt: PromptHistoryItem) => void;
}

export function PromptHistory({ open, onOpenChange, onSelectPrompt }: PromptHistoryProps) {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'simple' | 'custom'>('all');

  // Load history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem('musicverse_prompt_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          const items = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
          setHistory(items);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    if (open) {
      loadHistory();
    }
  }, [open]);

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      !searchQuery ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.style?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterMode === 'all' || 
      item.mode === filterMode;
    
    return matchesSearch && matchesFilter;
  });

  const handleSelect = (item: PromptHistoryItem) => {
    onSelectPrompt(item);
    onOpenChange(false);
    toast.success('Промпт загружен');
  };

  const handleDelete = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('musicverse_prompt_history', JSON.stringify(updated));
    toast.success('Промпт удален');
  };

  const handleCopy = (item: PromptHistoryItem) => {
    const text = item.mode === 'simple' 
      ? item.description || ''
      : `Название: ${item.title || 'Авто'}\nСтиль: ${item.style || ''}\nЛирика: ${item.lyrics || ''}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер');
  };

  const handleClearAll = () => {
    if (confirm('Удалить всю историю промптов?')) {
      setHistory([]);
      localStorage.removeItem('musicverse_prompt_history');
      toast.success('История очищена');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            История промптов
          </DialogTitle>
        </DialogHeader>

        {/* Filters and Search */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по истории..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearAll}
              disabled={history.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterMode === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('all')}
            >
              Все
            </Button>
            <Button
              variant={filterMode === 'simple' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('simple')}
            >
              Simple
            </Button>
            <Button
              variant={filterMode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterMode('custom')}
            >
              Custom
            </Button>
          </div>
        </div>

        {/* History List */}
        <ScrollArea className="h-[50vh]">
          {filteredHistory.length > 0 ? (
            <div className="space-y-3 pr-4">
              {filteredHistory.map((item) => (
                <Card 
                  key={item.id} 
                  className="glass-card border-primary/20 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleSelect(item)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.mode === 'simple' ? 'default' : 'secondary'}>
                            {item.mode === 'simple' ? 'Simple' : 'Custom'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.model}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item);
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        {item.title && (
                          <p className="font-medium text-sm">{item.title}</p>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.style && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            Стиль: {item.style}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(item.timestamp, 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(item);
                          }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Использовать
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music2 className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterMode !== 'all' 
                  ? 'Ничего не найдено' 
                  : 'История промптов пуста'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Создайте первый трек, чтобы начать
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to save prompt to history
export function savePromptToHistory(prompt: Omit<PromptHistoryItem, 'id' | 'timestamp'>) {
  try {
    const stored = localStorage.getItem('musicverse_prompt_history');
    const history: PromptHistoryItem[] = stored ? JSON.parse(stored) : [];
    
    const newItem: PromptHistoryItem = {
      ...prompt,
      id: `prompt-${Date.now()}`,
      timestamp: new Date(),
    };
    
    // Keep only last 50 items
    const updated = [newItem, ...history].slice(0, 50);
    localStorage.setItem('musicverse_prompt_history', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}
