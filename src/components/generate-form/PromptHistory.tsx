import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, Search, Trash2, Copy, RefreshCw, 
  Clock, Music2, Bookmark, BookmarkPlus, Plus, Sparkles, X
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { INSPIRATION_PROMPTS } from './inspirationPrompts';

export interface PromptHistoryItem {
  id: string;
  timestamp: Date;
  lastUsed?: Date;
  usageCount: number;
  mode: 'simple' | 'custom';
  description?: string;
  title?: string;
  style?: string;
  lyrics?: string;
  model: string;
  tags?: string[];
  isBookmarked?: boolean;
}

export interface SavedPrompt {
  id: string;
  name: string;
  mode: 'simple' | 'custom';
  description?: string;
  title?: string;
  style?: string;
  lyrics?: string;
  model: string;
  createdAt: Date;
}

interface PromptHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectPrompt: (prompt: PromptHistoryItem) => void;
}

export function PromptHistory({ open, onOpenChange, onSelectPrompt }: PromptHistoryProps) {
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'inspiration' | 'saved'>('history');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Partial<SavedPrompt>>({
    mode: 'simple',
    model: 'V4_5ALL',
  });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        // Load history
        const storedHistory = localStorage.getItem('musicverse_prompt_history');
        if (storedHistory) {
          const parsed = JSON.parse(storedHistory) as Array<Omit<PromptHistoryItem, 'timestamp'> & { timestamp: string }>;
          const items = parsed.map((item) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
          setHistory(items);
        }

        // Load saved prompts
        const storedSaved = localStorage.getItem('musicverse_saved_prompts');
        if (storedSaved) {
          const parsed = JSON.parse(storedSaved) as Array<Omit<SavedPrompt, 'createdAt'> & { createdAt: string }>;
          const items = parsed.map((item) => ({
            ...item,
            createdAt: new Date(item.createdAt),
          }));
          setSavedPrompts(items);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Filter items based on search
  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.description?.toLowerCase().includes(query) ||
      item.title?.toLowerCase().includes(query) ||
      item.style?.toLowerCase().includes(query)
    );
  });

  const filteredInspiration = INSPIRATION_PROMPTS.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.description?.toLowerCase().includes(query) ||
      item.genre?.toLowerCase().includes(query) ||
      item.style?.toLowerCase().includes(query)
    );
  });

  const filteredSaved = savedPrompts.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.style?.toLowerCase().includes(query)
    );
  });

  const handleSelectHistory = (item: PromptHistoryItem) => {
    // Update usage count
    const updated = history.map(h => 
      h.id === item.id 
        ? { ...h, usageCount: h.usageCount + 1, lastUsed: new Date() }
        : h
    );
    setHistory(updated);
    localStorage.setItem('musicverse_prompt_history', JSON.stringify(updated));
    
    onSelectPrompt(item);
    onOpenChange(false);
    toast.success('Промпт загружен');
  };

  const handleSelectInspiration = (item: typeof INSPIRATION_PROMPTS[0]) => {
    const prompt: PromptHistoryItem = {
      id: `inspiration-${Date.now()}`,
      timestamp: new Date(),
      usageCount: 1,
      mode: 'simple',
      description: item.description,
      style: item.style,
      model: 'V4_5ALL',
    };
    onSelectPrompt(prompt);
    onOpenChange(false);
    toast.success('Промпт для вдохновения загружен');
  };

  const handleSelectSaved = (item: SavedPrompt) => {
    const prompt: PromptHistoryItem = {
      id: item.id,
      timestamp: item.createdAt,
      usageCount: 1,
      mode: item.mode,
      description: item.description,
      title: item.title,
      style: item.style,
      lyrics: item.lyrics,
      model: item.model,
    };
    onSelectPrompt(prompt);
    onOpenChange(false);
    toast.success('Сохраненный промпт загружен');
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('musicverse_prompt_history', JSON.stringify(updated));
    toast.success('Промпт удален из истории');
  };

  const handleDeleteSaved = (id: string) => {
    const updated = savedPrompts.filter(item => item.id !== id);
    setSavedPrompts(updated);
    localStorage.setItem('musicverse_saved_prompts', JSON.stringify(updated));
    toast.success('Промпт удален из закладок');
  };

  const handleSaveToBookmarks = (item: PromptHistoryItem) => {
    const newSaved: SavedPrompt = {
      id: `saved-${Date.now()}`,
      name: item.title || item.description?.substring(0, 50) || 'Без названия',
      mode: item.mode,
      description: item.description,
      title: item.title,
      style: item.style,
      lyrics: item.lyrics,
      model: item.model,
      createdAt: new Date(),
    };
    
    const updated = [newSaved, ...savedPrompts];
    setSavedPrompts(updated);
    localStorage.setItem('musicverse_saved_prompts', JSON.stringify(updated));
    toast.success('Промпт сохранен в закладки');
  };

  const handleAddNewPrompt = () => {
    if (!newPrompt.name || (!newPrompt.description && !newPrompt.style)) {
      toast.error('Заполните название и описание/стиль');
      return;
    }

    const saved: SavedPrompt = {
      id: `saved-${Date.now()}`,
      name: newPrompt.name || 'Без названия',
      mode: newPrompt.mode || 'simple',
      description: newPrompt.description,
      title: newPrompt.title,
      style: newPrompt.style,
      lyrics: newPrompt.lyrics,
      model: newPrompt.model || 'V4_5ALL',
      createdAt: new Date(),
    };

    const updated = [saved, ...savedPrompts];
    setSavedPrompts(updated);
    localStorage.setItem('musicverse_saved_prompts', JSON.stringify(updated));
    
    setNewPrompt({ mode: 'simple', model: 'V4_5ALL' });
    setShowAddDialog(false);
    toast.success('Промпт сохранен');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер');
  };

  const handleClearHistory = () => {
    if (confirm('Удалить всю историю промптов?')) {
      setHistory([]);
      localStorage.removeItem('musicverse_prompt_history');
      toast.success('История очищена');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Промпты
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
            <TabsTrigger value="inspiration" className="gap-1.5 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Вдохновение</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 text-xs sm:text-sm">
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Сохраненные</span>
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {activeTab === 'history' && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearHistory}
                disabled={history.length === 0}
                title="Очистить историю"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {activeTab === 'saved' && (
              <Button
                variant="default"
                size="icon"
                onClick={() => setShowAddDialog(true)}
                title="Добавить промпт"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 h-[50vh]">
            {/* History Tab */}
            <TabsContent value="history" className="mt-0">
              {filteredHistory.length > 0 ? (
                <div className="space-y-2 pr-4">
                  {filteredHistory.map((item) => (
                    <PromptCard
                      key={item.id}
                      title={item.title || item.description?.substring(0, 50)}
                      description={item.description}
                      style={item.style}
                      mode={item.mode}
                      model={item.model}
                      footer={
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(item.lastUsed || item.timestamp, 'dd MMM, HH:mm', { locale: ru })}
                          <Badge variant="outline" className="text-[10px] ml-1">{item.usageCount}x</Badge>
                        </div>
                      }
                      onSelect={() => handleSelectHistory(item)}
                      onCopy={() => handleCopy(item.description || item.style || '')}
                      onDelete={() => handleDeleteHistory(item.id)}
                      onBookmark={() => handleSaveToBookmarks(item)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={History}
                  text={searchQuery ? 'Ничего не найдено' : 'История промптов пуста'}
                  subtext="Создайте первый трек, чтобы начать"
                />
              )}
            </TabsContent>

            {/* Inspiration Tab */}
            <TabsContent value="inspiration" className="mt-0">
              {filteredInspiration.length > 0 ? (
                <div className="space-y-2 pr-4">
                  {filteredInspiration.map((item) => (
                    <Card 
                      key={item.id}
                      className="glass-card border-primary/20 hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectInspiration(item)}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-gradient-to-r from-primary to-primary/70">
                                {item.genre}
                              </Badge>
                              {item.mood && (
                                <Badge variant="outline" className="text-xs">
                                  {item.mood}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(item.description);
                              }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {item.description}
                          </p>
                          {item.style && (
                            <p className="text-xs text-primary/80">
                              Стиль: {item.style}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Sparkles}
                  text="Ничего не найдено"
                />
              )}
            </TabsContent>

            {/* Saved Tab */}
            <TabsContent value="saved" className="mt-0">
              {filteredSaved.length > 0 ? (
                <div className="space-y-2 pr-4">
                  {filteredSaved.map((item) => (
                    <PromptCard
                      key={item.id}
                      title={item.name}
                      description={item.description}
                      style={item.style}
                      mode={item.mode}
                      model={item.model}
                      footer={
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(item.createdAt, 'dd MMM yyyy', { locale: ru })}
                        </div>
                      }
                      onSelect={() => handleSelectSaved(item)}
                      onCopy={() => handleCopy(item.description || item.style || '')}
                      onDelete={() => handleDeleteSaved(item.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  icon={Bookmark}
                  text={searchQuery ? 'Ничего не найдено' : 'Нет сохраненных промптов'}
                  subtext="Сохраняйте промпты из истории или создавайте новые"
                />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Add New Prompt Dialog */}
        {showAddDialog && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Новый промпт
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddDialog(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                <div>
                  <Label>Название</Label>
                  <Input
                    value={newPrompt.name || ''}
                    onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                    placeholder="Название для быстрого поиска"
                  />
                </div>

                <div>
                  <Label>Режим</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={newPrompt.mode === 'simple' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewPrompt({ ...newPrompt, mode: 'simple' })}
                    >
                      Simple
                    </Button>
                    <Button
                      variant={newPrompt.mode === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewPrompt({ ...newPrompt, mode: 'custom' })}
                    >
                      Custom
                    </Button>
                  </div>
                </div>

                {newPrompt.mode === 'simple' ? (
                  <div>
                    <Label>Описание музыки</Label>
                    <Textarea
                      value={newPrompt.description || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                      placeholder="Опишите желаемую музыку: жанр, настроение, инструменты, темп..."
                      rows={4}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Название трека</Label>
                      <Input
                        value={newPrompt.title || ''}
                        onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                        placeholder="Название будущего трека"
                      />
                    </div>
                    <div>
                      <Label>Стиль</Label>
                      <Textarea
                        value={newPrompt.style || ''}
                        onChange={(e) => setNewPrompt({ ...newPrompt, style: e.target.value })}
                        placeholder="Описание стиля: жанр, инструменты, настроение..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Лирика (опционально)</Label>
                      <Textarea
                        value={newPrompt.lyrics || ''}
                        onChange={(e) => setNewPrompt({ ...newPrompt, lyrics: e.target.value })}
                        placeholder="Текст песни..."
                        rows={4}
                      />
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleAddNewPrompt}>
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Reusable Prompt Card Component
interface PromptCardProps {
  title?: string;
  description?: string;
  style?: string;
  mode: 'simple' | 'custom';
  model: string;
  footer: React.ReactNode;
  onSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onBookmark?: () => void;
}

function PromptCard({ title, description, style, mode, model, footer, onSelect, onCopy, onDelete, onBookmark }: PromptCardProps) {
  return (
    <Card 
      className="glass-card border-primary/20 hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={mode === 'simple' ? 'default' : 'secondary'}>
                {mode === 'simple' ? 'Simple' : 'Custom'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {model}
              </Badge>
            </div>
            
            <div className="flex gap-1 shrink-0">
              {onBookmark && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark();
                  }}
                  title="Сохранить в закладки"
                >
                  <BookmarkPlus className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
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
                  onDelete();
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            {title && <p className="font-medium text-sm">{title}</p>}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            )}
            {style && (
              <p className="text-xs text-muted-foreground line-clamp-1">Стиль: {style}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            {footer}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <RefreshCw className="w-3 h-3" />
              Использовать
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, text, subtext }: { icon: React.ElementType; text: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
      <p className="text-muted-foreground">{text}</p>
      {subtext && <p className="text-sm text-muted-foreground mt-2">{subtext}</p>}
    </div>
  );
}

// Helper function to save prompt to history
export function savePromptToHistory(prompt: Omit<PromptHistoryItem, 'id' | 'timestamp' | 'usageCount' | 'lastUsed'>) {
  try {
    const stored = localStorage.getItem('musicverse_prompt_history');
    type StoredHistoryItem = Omit<PromptHistoryItem, 'timestamp' | 'lastUsed'> & { 
      timestamp: string; 
      lastUsed?: string;
    };
    const history: PromptHistoryItem[] = stored ? (JSON.parse(stored) as StoredHistoryItem[]).map((item) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      lastUsed: item.lastUsed ? new Date(item.lastUsed) : undefined,
    })) : [];
    
    // Check for duplicate
    const isDuplicate = (a: PromptHistoryItem, b: typeof prompt) => {
      if (a.mode !== b.mode) return false;
      if (a.mode === 'simple') {
        return a.description?.trim() === b.description?.trim();
      } else {
        return (
          a.title?.trim() === b.title?.trim() &&
          a.style?.trim() === b.style?.trim() &&
          a.lyrics?.trim() === b.lyrics?.trim()
        );
      }
    };
    
    const existingIndex = history.findIndex(item => isDuplicate(item, prompt));
    
    if (existingIndex !== -1) {
      history[existingIndex] = {
        ...history[existingIndex],
        usageCount: history[existingIndex].usageCount + 1,
        lastUsed: new Date(),
        model: prompt.model,
      };
      const [updated] = history.splice(existingIndex, 1);
      history.unshift(updated);
    } else {
      const newItem: PromptHistoryItem = {
        ...prompt,
        id: `prompt-${Date.now()}`,
        timestamp: new Date(),
        usageCount: 1,
      };
      history.unshift(newItem);
    }
    
    const updated = history.slice(0, 50);
    localStorage.setItem('musicverse_prompt_history', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}

// Helper function to save prompt to bookmarks (exported for use from TrackDetails)
export function savePromptToBookmarks(prompt: {
  name: string;
  mode: 'simple' | 'custom';
  description?: string;
  title?: string;
  style?: string;
  lyrics?: string;
  model?: string;
}) {
  try {
    const stored = localStorage.getItem('musicverse_saved_prompts');
    const savedPrompts: SavedPrompt[] = stored ? JSON.parse(stored) : [];
    
    const newSaved: SavedPrompt = {
      id: `saved-${Date.now()}`,
      name: prompt.name,
      mode: prompt.mode,
      description: prompt.description,
      title: prompt.title,
      style: prompt.style,
      lyrics: prompt.lyrics,
      model: prompt.model || 'V4_5ALL',
      createdAt: new Date(),
    };
    
    const updated = [newSaved, ...savedPrompts];
    localStorage.setItem('musicverse_saved_prompts', JSON.stringify(updated));
    toast.success('Промпт сохранен в закладки');
    return true;
  } catch (error) {
    console.error('Failed to save to bookmarks:', error);
    toast.error('Не удалось сохранить промпт');
    return false;
  }
}
