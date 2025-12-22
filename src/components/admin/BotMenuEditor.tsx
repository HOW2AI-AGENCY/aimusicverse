/**
 * Bot Menu Editor Component
 * Admin interface for managing Telegram bot menu structure
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  ExternalLink,
  MousePointer,
  Folder
} from 'lucide-react';
import { useBotMenuItems, useToggleMenuItem, useDeleteMenuItem, type BotMenuItem } from '@/hooks/useBotMenuItems';
import { BotMenuItemForm } from './BotMenuItemForm';
import { BotMenuPreview } from './BotMenuPreview';
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

function getActionIcon(actionType: string) {
  switch (actionType) {
    case 'webapp':
      return <ExternalLink className="h-3 w-3" />;
    case 'submenu':
      return <Folder className="h-3 w-3" />;
    case 'url':
      return <ExternalLink className="h-3 w-3" />;
    case 'callback':
    default:
      return <MousePointer className="h-3 w-3" />;
  }
}

function getActionLabel(actionType: string) {
  switch (actionType) {
    case 'webapp':
      return 'WebApp';
    case 'submenu':
      return 'Подменю';
    case 'url':
      return 'Ссылка';
    case 'callback':
    default:
      return 'Callback';
  }
}

interface MenuItemRowProps {
  item: BotMenuItem;
  depth: number;
  childCount: number;
  onEdit: (item: BotMenuItem) => void;
  onDelete: (item: BotMenuItem) => void;
  onToggle: (item: BotMenuItem) => void;
}

function MenuItemRow({ item, depth, childCount, onEdit, onDelete, onToggle }: MenuItemRowProps) {
  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg border bg-card
        ${!item.is_enabled ? 'opacity-50' : ''}
        hover:border-primary/30 transition-colors
      `}
      style={{ marginLeft: depth * 24 }}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      
      <span className="text-xl">{item.icon_emoji || '📄'}</span>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{item.title}</span>
          {childCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {childCount} пунктов
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px] px-1 py-0 gap-1">
            {getActionIcon(item.action_type)}
            {getActionLabel(item.action_type)}
          </Badge>
          {item.action_data && (
            <span className="truncate max-w-[150px]">
              → {item.action_data}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          checked={item.is_enabled}
          onCheckedChange={() => onToggle(item)}
          aria-label="Включить/выключить"
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function BotMenuEditor() {
  const { data: items = [], isLoading } = useBotMenuItems();
  const toggleMutation = useToggleMenuItem();
  const deleteMutation = useDeleteMenuItem();
  
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [selectedParent, setSelectedParent] = useState<string | null>('main');
  const [editingItem, setEditingItem] = useState<BotMenuItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<BotMenuItem | null>(null);
  
  // Group items by parent
  const groupedItems = useMemo(() => {
    const groups = new Map<string | null, BotMenuItem[]>();
    
    for (const item of items) {
      const parent = item.parent_key;
      if (!groups.has(parent)) {
        groups.set(parent, []);
      }
      groups.get(parent)!.push(item);
    }
    
    // Sort each group by sort_order
    for (const [, groupItems] of groups) {
      groupItems.sort((a, b) => a.sort_order - b.sort_order);
    }
    
    return groups;
  }, [items]);
  
  // Get parent menu items for tabs
  const parentItems = useMemo(() => {
    return items.filter(item => 
      item.parent_key === null || 
      item.action_type === 'submenu'
    );
  }, [items]);
  
  // Get items for current view
  const currentItems = groupedItems.get(selectedParent) || [];
  
  const getChildCount = (menuKey: string) => {
    return groupedItems.get(menuKey)?.length || 0;
  };
  
  const handleEdit = (item: BotMenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };
  
  const handleCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };
  
  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };
  
  const handleToggle = (item: BotMenuItem) => {
    toggleMutation.mutate({ id: item.id, is_enabled: !item.is_enabled });
  };
  
  const handleDeleteConfirm = () => {
    if (deleteItem) {
      deleteMutation.mutate(deleteItem.id);
      setDeleteItem(null);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="editor">
              <Pencil className="h-4 w-4 mr-2" />
              Редактор
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Превью
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'editor' && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить пункт
            </Button>
          )}
        </div>
        
        <TabsContent value="editor" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Parent selector */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Разделы меню</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    <Button
                      variant={selectedParent === 'main' ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setSelectedParent('main')}
                    >
                      <span className="mr-2">🏠</span>
                      Главное меню
                      <Badge variant="outline" className="ml-auto">
                        {getChildCount('main')}
                      </Badge>
                    </Button>
                    
                    {parentItems
                      .filter(item => item.action_type === 'submenu')
                      .map(item => (
                        <Button
                          key={item.id}
                          variant={selectedParent === item.menu_key ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => setSelectedParent(item.menu_key)}
                        >
                          <span className="mr-2">{item.icon_emoji || '📁'}</span>
                          {item.title}
                          <Badge variant="outline" className="ml-auto">
                            {getChildCount(item.menu_key)}
                          </Badge>
                        </Button>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Items list */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {selectedParent === 'main' ? '🏠 Главное меню' : (
                    <>
                      {items.find(i => i.menu_key === selectedParent)?.icon_emoji || '📁'}
                      {items.find(i => i.menu_key === selectedParent)?.title || selectedParent}
                    </>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-normal">
                    {currentItems.length} пунктов
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {currentItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Нет пунктов меню</p>
                        <Button
                          variant="outline"
                          className="mt-2"
                          onClick={handleCreate}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить первый пункт
                        </Button>
                      </div>
                    ) : (
                      currentItems.map(item => (
                        <MenuItemRow
                          key={item.id}
                          item={item}
                          depth={0}
                          childCount={getChildCount(item.menu_key)}
                          onEdit={handleEdit}
                          onDelete={setDeleteItem}
                          onToggle={handleToggle}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <BotMenuPreview items={items} />
        </TabsContent>
      </Tabs>
      
      {/* Edit/Create form dialog */}
      <BotMenuItemForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={editingItem}
        parentKey={selectedParent}
        existingKeys={items.map(i => i.menu_key)}
        onClose={handleFormClose}
      />
      
      {/* Delete confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пункт меню?</AlertDialogTitle>
            <AlertDialogDescription>
              Пункт "{deleteItem?.title}" будет удалён. 
              {getChildCount(deleteItem?.menu_key || '') > 0 && (
                <span className="text-destructive block mt-2">
                  Внимание: у этого пункта есть вложенные элементы!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
