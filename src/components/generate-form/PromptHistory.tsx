import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  History, Search, Trash2, Copy, 
  Clock, Music2, Bookmark, BookmarkPlus, Plus, Sparkles, X, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { INSPIRATION_PROMPTS, getPromptUsageCount, incrementPromptUsage } from './inspirationPrompts';
import { cn } from '@/lib/utils';

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

// Custom scrollbar styles
const scrollbarStyles = `
  [data-prompt-scroll]::-webkit-scrollbar {
    width: 4px;
  }
  [data-prompt-scroll]::-webkit-scrollbar-track {
    background: transparent;
  }
  [data-prompt-scroll]::-webkit-scrollbar-thumb {
    background: hsl(var(--muted-foreground) / 0.3);
    border-radius: 2px;
  }
  [data-prompt-scroll]::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--muted-foreground) / 0.5);
  }
  [data-prompt-scroll] {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
  }
`;

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
  const [inspirationUsage, setInspirationUsage] = useState<Record<string, number>>({});

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

        // Load inspiration usage
        const usage: Record<string, number> = {};
        INSPIRATION_PROMPTS.forEach(p => {
          usage[p.id] = getPromptUsageCount(p.id);
        });
        setInspirationUsage(usage);
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
      item.style?.toLowerCase().includes(query) ||
      item.mood?.toLowerCase().includes(query)
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
    incrementPromptUsage(item.id);
    setInspirationUsage(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));

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

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('musicverse_prompt_history', JSON.stringify(updated));
    toast.success('Промпт удален из истории');
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedPrompts.filter(item => item.id !== id);
    setSavedPrompts(updated);
    localStorage.setItem('musicverse_saved_prompts', JSON.stringify(updated));
    toast.success('Промпт удален из закладок');
  };

  const handleSaveToBookmarks = (e: React.MouseEvent, item: PromptHistoryItem) => {
    e.stopPropagation();
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

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
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
    <>
      <style>{scrollbarStyles}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] max-h-[700px] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Music2 className="w-5 h-5 text-primary" />
              Промпты
            </DialogTitle>
          </DialogHeader>

          <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as typeof activeTab)} 
            className="flex-1 flex flex-col overflow-hidden px-4"
          >
            <TabsList className="grid w-full grid-cols-3 mb-3 shrink-0">
              <TabsTrigger value="history" className="gap-1 text-xs px-2">
                <History className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">История</span>
              </TabsTrigger>
              <TabsTrigger value="inspiration" className="gap-1 text-xs px-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Вдохновение</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-1 text-xs px-2">
                <Bookmark className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Сохраненные</span>
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="flex gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {activeTab === 'history' && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClearHistory}
                  disabled={history.length === 0}
                  title="Очистить историю"
                  className="h-9 w-9 shrink-0"
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
                  className="h-9 w-9 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Content with custom scrollbar */}
            <div className="flex-1 overflow-hidden pb-4">
              {/* History Tab */}
              <TabsContent value="history" className="mt-0 h-full">
                <div 
                  data-prompt-scroll 
                  className="h-full overflow-y-auto pr-1"
                >
                  {filteredHistory.length > 0 ? (
                    <div className="space-y-2">
                      {filteredHistory.map((item) => (
                        <Card 
                          key={item.id}
                          className="glass-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => handleSelectHistory(item)}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {item.title || item.description?.substring(0, 40) || 'Без названия'}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      {item.mode === 'simple' ? 'Simple' : 'Custom'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                      {item.model}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => handleCopy(e, item.description || item.style || '')}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => handleSaveToBookmarks(e, item)}
                                  >
                                    <BookmarkPlus className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={(e) => handleDeleteHistory(e, item.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(item.lastUsed || item.timestamp, 'dd MMM, HH:mm', { locale: ru })}
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {item.usageCount}x
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState 
                      icon={History}
                      text={searchQuery ? 'Ничего не найдено' : 'История промптов пуста'}
                      subtext="Создайте первый трек, чтобы начать"
                    />
                  )}
                </div>
              </TabsContent>

              {/* Inspiration Tab */}
              <TabsContent value="inspiration" className="mt-0 h-full">
                <div 
                  data-prompt-scroll 
                  className="h-full overflow-y-auto pr-1"
                >
                  {filteredInspiration.length > 0 ? (
                    <div className="space-y-2">
                      {filteredInspiration.map((item) => (
                        <Card 
                          key={item.id}
                          className="glass-card border-primary/20 hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => handleSelectInspiration(item)}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge className="bg-gradient-to-r from-primary to-primary/70 text-xs h-5">
                                    {item.genre}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {item.mood}
                                  </Badge>
                                  {inspirationUsage[item.id] > 0 && (
                                    <Badge variant="secondary" className="text-[10px] h-5 gap-0.5">
                                      <TrendingUp className="w-2.5 h-2.5" />
                                      {inspirationUsage[item.id]}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={(e) => handleCopy(e, item.description)}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-3">
                                {item.description}
                              </p>
                              {item.style && (
                                <p className="text-[10px] text-primary/80 truncate">
                                  {item.style}
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
                </div>
              </TabsContent>

              {/* Saved Tab */}
              <TabsContent value="saved" className="mt-0 h-full">
                <div 
                  data-prompt-scroll 
                  className="h-full overflow-y-auto pr-1"
                >
                  {filteredSaved.length > 0 ? (
                    <div className="space-y-2">
                      {filteredSaved.map((item) => (
                        <Card 
                          key={item.id}
                          className="glass-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => handleSelectSaved(item)}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{item.name}</p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      {item.mode === 'simple' ? 'Simple' : 'Custom'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => handleCopy(e, item.description || item.style || '')}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={(e) => handleDeleteSaved(e, item.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(item.createdAt, 'dd MMM yyyy', { locale: ru })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState 
                      icon={Bookmark}
                      text={searchQuery ? 'Ничего не найдено' : 'Нет сохраненных промптов'}
                      subtext="Сохраняйте промпты из истории или создавайте новые"
                    />
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Add New Prompt Dialog */}
          {showAddDialog && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2 text-base">
                  <Plus className="w-4 h-4" />
                  Новый промпт
                </h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div 
                data-prompt-scroll
                className="flex-1 overflow-y-auto p-4"
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Название</Label>
                    <Input
                      value={newPrompt.name || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                      placeholder="Название для быстрого поиска"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Режим</Label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant={newPrompt.mode === 'simple' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewPrompt({ ...newPrompt, mode: 'simple' })}
                        className="flex-1"
                      >
                        Simple
                      </Button>
                      <Button
                        variant={newPrompt.mode === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewPrompt({ ...newPrompt, mode: 'custom' })}
                        className="flex-1"
                      >
                        Custom
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Описание</Label>
                    <Textarea
                      value={newPrompt.description || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                      placeholder="Опишите желаемый трек..."
                      className="min-h-[100px] mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Стиль / Теги</Label>
                    <Input
                      value={newPrompt.style || ''}
                      onChange={(e) => setNewPrompt({ ...newPrompt, style: e.target.value })}
                      placeholder="pop, electronic, energetic..."
                      className="mt-1"
                    />
                  </div>

                  {newPrompt.mode === 'custom' && (
                    <>
                      <div>
                        <Label className="text-sm">Название трека</Label>
                        <Input
                          value={newPrompt.title || ''}
                          onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                          placeholder="Название"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Текст песни</Label>
                        <Textarea
                          value={newPrompt.lyrics || ''}
                          onChange={(e) => setNewPrompt({ ...newPrompt, lyrics: e.target.value })}
                          placeholder="[Verse 1]..."
                          className="min-h-[120px] mt-1 font-mono text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-4 border-t shrink-0">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                    Отмена
                  </Button>
                  <Button onClick={handleAddNewPrompt} className="flex-1">
                    Сохранить
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Empty state component
function EmptyState({ 
  icon: Icon, 
  text, 
  subtext 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center py-8">
      <Icon className="w-10 h-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
      {subtext && (
        <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
      )}
    </div>
  );
}

// Helper functions for external use
export function savePromptToHistory(prompt: Omit<PromptHistoryItem, 'id' | 'timestamp' | 'usageCount'>): void {
  try {
    const stored = localStorage.getItem('musicverse_prompt_history');
    const history: PromptHistoryItem[] = stored ? JSON.parse(stored) : [];
    
    const newItem: PromptHistoryItem = {
      ...prompt,
      id: `history-${Date.now()}`,
      timestamp: new Date(),
      usageCount: 1,
    };
    
    const updated = [newItem, ...history].slice(0, 50); // Keep last 50 prompts
    localStorage.setItem('musicverse_prompt_history', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save prompt to history:', error);
  }
}

export function savePromptToBookmarks(prompt: Omit<SavedPrompt, 'id' | 'createdAt'>): void {
  try {
    const stored = localStorage.getItem('musicverse_saved_prompts');
    const saved: SavedPrompt[] = stored ? JSON.parse(stored) : [];
    
    const newItem: SavedPrompt = {
      ...prompt,
      id: `saved-${Date.now()}`,
      createdAt: new Date(),
    };
    
    const updated = [newItem, ...saved];
    localStorage.setItem('musicverse_saved_prompts', JSON.stringify(updated));
    toast.success('Промпт сохранен в закладки');
  } catch (error) {
    console.error('Failed to save prompt to bookmarks:', error);
    toast.error('Не удалось сохранить промпт');
  }
}
