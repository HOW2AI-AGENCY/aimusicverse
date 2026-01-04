/**
 * LyricsVersionsPanel - Panel showing saved versions history
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  History, 
  RotateCcw, 
  Trash2, 
  ChevronRight, 
  Filter,
  Clock,
  Sparkles,
  Edit3,
  Plus,
  Minus,
  ArrowUpDown,
  Save,
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  LyricsVersion, 
  ChangeType, 
  changeTypeLabels, 
  changeTypeIcons 
} from '@/hooks/useLyricsVersioning';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';
import { formatDistanceToNow, ru } from '@/lib/date-utils';

interface LyricsVersionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: LyricsVersion[];
  currentVersion: LyricsVersion | null;
  isLoading: boolean;
  onRestore: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onPreview?: (version: LyricsVersion) => void;
}

const changeTypeFilters: ChangeType[] = [
  'manual_edit',
  'ai_generated',
  'ai_improved',
  'autosave',
  'restore',
  'section_add',
  'section_delete',
  'section_reorder',
];

function getChangeTypeIcon(type: string) {
  switch (type) {
    case 'ai_generated':
    case 'ai_improved':
      return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
    case 'manual_edit':
      return <Edit3 className="w-3.5 h-3.5 text-blue-500" />;
    case 'section_add':
      return <Plus className="w-3.5 h-3.5 text-green-500" />;
    case 'section_delete':
      return <Minus className="w-3.5 h-3.5 text-red-500" />;
    case 'section_reorder':
      return <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />;
    case 'autosave':
      return <Save className="w-3.5 h-3.5 text-muted-foreground" />;
    case 'restore':
      return <RotateCcw className="w-3.5 h-3.5 text-primary" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function VersionItem({
  version,
  isCurrent,
  onRestore,
  onDelete,
  onPreview,
}: {
  version: LyricsVersion;
  isCurrent: boolean;
  onRestore: () => void;
  onDelete: () => void;
  onPreview?: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const timeAgo = formatDistanceToNow(new Date(version.created_at), {
    addSuffix: true,
    locale: ru,
  });

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card 
          className={cn(
            'p-3 transition-colors hover:bg-muted/50',
            isCurrent && 'border-primary/50 bg-primary/5'
          )}
        >
          <div className="flex items-start gap-3">
            {/* Version indicator */}
            <div className="flex flex-col items-center gap-1 pt-0.5">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                isCurrent 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              )}>
                v{version.version_number}
              </div>
              {getChangeTypeIcon(version.change_type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {version.version_name ? (
                  <p className="font-medium text-sm truncate">
                    {version.version_name}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {changeTypeLabels[version.change_type as ChangeType] || version.change_type}
                  </p>
                )}
                {isCurrent && (
                  <Badge variant="default" className="text-[10px] h-4">
                    Текущая
                  </Badge>
                )}
              </div>

              {version.change_description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {version.change_description}
                </p>
              )}

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
                {version.ai_model_used && (
                  <>
                    <span>•</span>
                    <Sparkles className="w-3 h-3" />
                    <span>{version.ai_model_used}</span>
                  </>
                )}
              </div>

              {/* Preview of lyrics */}
              <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-2 bg-muted/50 rounded px-2 py-1">
                {version.lyrics.substring(0, 100)}...
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 shrink-0">
              {onPreview && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    hapticImpact('light');
                    onPreview();
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              )}
              {!isCurrent && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary"
                    onClick={() => {
                      hapticImpact('medium');
                      onRestore();
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive/70 hover:text-destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить версию?</AlertDialogTitle>
            <AlertDialogDescription>
              Версия {version.version_number} будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                hapticImpact('medium');
                onDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VersionsContent({
  versions,
  currentVersion,
  isLoading,
  onRestore,
  onDelete,
  onPreview,
  onClose,
}: LyricsVersionsPanelProps & { onClose: () => void }) {
  const [activeFilters, setActiveFilters] = useState<ChangeType[]>([]);

  const filteredVersions = useMemo(() => {
    if (activeFilters.length === 0) return versions;
    return versions.filter(v => 
      activeFilters.includes(v.change_type as ChangeType)
    );
  }, [versions, activeFilters]);

  const toggleFilter = (type: ChangeType) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with filter */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {filteredVersions.length} версий
          </Badge>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                'h-7 text-xs gap-1.5',
                activeFilters.length > 0 && 'border-primary'
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Фильтр
              {activeFilters.length > 0 && (
                <Badge variant="default" className="ml-1 h-4 w-4 p-0 text-[10px]">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            {changeTypeFilters.map(type => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={activeFilters.includes(type)}
                onCheckedChange={() => toggleFilter(type)}
                className="text-xs"
              >
                <span className="mr-2">{changeTypeIcons[type]}</span>
                {changeTypeLabels[type]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Versions list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredVersions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {versions.length === 0 
                  ? 'Нет сохраненных версий'
                  : 'Нет версий по выбранным фильтрам'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredVersions.map(version => (
                <VersionItem
                  key={version.id}
                  version={version}
                  isCurrent={currentVersion?.id === version.id}
                  onRestore={() => onRestore(version.id)}
                  onDelete={() => onDelete(version.id)}
                  onPreview={onPreview ? () => onPreview(version) : undefined}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function LyricsVersionsPanel(props: LyricsVersionsPanelProps) {
  const isMobile = useIsMobile();
  const { open, onOpenChange } = props;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b pb-3">
            <DrawerTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              История версий
            </DrawerTitle>
          </DrawerHeader>
          <VersionsContent {...props} onClose={() => onOpenChange(false)} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            История версий
          </SheetTitle>
        </SheetHeader>
        <VersionsContent {...props} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
