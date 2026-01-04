/**
 * EnhancedTrackActionMenu Component
 * 
 * Improved track action menu with better organization and visual feedback.
 * Features:
 * - Grouped actions by category
 * - Visual icons for each action
 * - Keyboard shortcuts display
 * - Confirmation for destructive actions
 * - Loading states
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import {
  MoreHorizontal,
  Play,
  ListPlus,
  Heart,
  Download,
  Share2,
  Edit,
  Copy,
  Scissors,
  Music,
  Layers,
  Settings,
  Trash2,
  FolderPlus,
  Radio,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TrackAction {
  id: string;
  label: string;
  icon: typeof Play;
  action: () => void | Promise<void>;
  shortcut?: string;
  destructive?: boolean;
  disabled?: boolean;
  group: 'playback' | 'library' | 'edit' | 'share' | 'danger';
}

interface EnhancedTrackActionMenuProps {
  /** Track ID */
  trackId: string;
  /** Track title for confirmation dialogs */
  trackTitle: string;
  /** Available actions */
  actions: {
    onPlay?: () => void;
    onPlayNext?: () => void;
    onAddToQueue?: () => void;
    onToggleLike?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onAddToProject?: () => void;
    onOpenStudio?: () => void;
    onSeparateStems?: () => void;
    onViewVersions?: () => void;
    onDelete?: () => void;
  };
  /** Current state */
  state?: {
    isLiked?: boolean;
    hasStems?: boolean;
    hasVersions?: boolean;
    isProcessing?: boolean;
  };
  /** Trigger button variant */
  variant?: 'default' | 'ghost' | 'outline';
  /** Trigger button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Custom trigger element */
  trigger?: React.ReactNode;
}

export function EnhancedTrackActionMenu({
  trackId,
  trackTitle,
  actions,
  state = {},
  variant = 'ghost',
  size = 'icon',
  trigger,
}: EnhancedTrackActionMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleAction = async (action: () => void | Promise<void>, closeMenu = true) => {
    setIsExecuting(true);
    try {
      await action();
    } catch (error) {
      logger.error('Action error', error instanceof Error ? error : new Error(String(error)));
      toast.error('Не удалось выполнить действие');
    } finally {
      setIsExecuting(false);
    }
  };

  const trackActions: TrackAction[] = [
    // Playback group
    ...(actions.onPlay ? [{
      id: 'play',
      label: 'Воспроизвести',
      icon: Play,
      action: actions.onPlay,
      shortcut: 'Space',
      group: 'playback' as const,
    }] : []),
    ...(actions.onPlayNext ? [{
      id: 'play-next',
      label: 'Воспроизвести следующим',
      icon: Radio,
      action: actions.onPlayNext,
      group: 'playback' as const,
    }] : []),
    ...(actions.onAddToQueue ? [{
      id: 'add-to-queue',
      label: 'Добавить в очередь',
      icon: ListPlus,
      action: actions.onAddToQueue,
      shortcut: 'Q',
      group: 'playback' as const,
    }] : []),

    // Library group
    ...(actions.onToggleLike ? [{
      id: 'toggle-like',
      label: state.isLiked ? 'Убрать из избранного' : 'Добавить в избранное',
      icon: Heart,
      action: actions.onToggleLike,
      shortcut: 'L',
      group: 'library' as const,
    }] : []),
    ...(actions.onDownload ? [{
      id: 'download',
      label: 'Скачать',
      icon: Download,
      action: actions.onDownload,
      shortcut: 'D',
      group: 'library' as const,
    }] : []),
    ...(actions.onAddToProject ? [{
      id: 'add-to-project',
      label: 'Добавить в проект',
      icon: FolderPlus,
      action: actions.onAddToProject,
      group: 'library' as const,
    }] : []),

    // Edit group
    ...(actions.onEdit ? [{
      id: 'edit',
      label: 'Редактировать',
      icon: Edit,
      action: actions.onEdit,
      shortcut: 'E',
      group: 'edit' as const,
    }] : []),
    ...(actions.onDuplicate ? [{
      id: 'duplicate',
      label: 'Дублировать',
      icon: Copy,
      action: actions.onDuplicate,
      group: 'edit' as const,
    }] : []),
    ...(actions.onOpenStudio ? [{
      id: 'open-studio',
      label: 'Открыть в студии',
      icon: Music,
      action: actions.onOpenStudio,
      shortcut: 'S',
      group: 'edit' as const,
    }] : []),
    ...(actions.onSeparateStems ? [{
      id: 'separate-stems',
      label: state.hasStems ? 'Управлять стемами' : 'Разделить на стемы',
      icon: Layers,
      action: actions.onSeparateStems,
      disabled: state.isProcessing,
      group: 'edit' as const,
    }] : []),
    ...(actions.onViewVersions ? [{
      id: 'view-versions',
      label: 'Просмотреть версии',
      icon: Radio,
      action: actions.onViewVersions,
      disabled: !state.hasVersions,
      group: 'edit' as const,
    }] : []),

    // Share group
    ...(actions.onShare ? [{
      id: 'share',
      label: 'Поделиться',
      icon: Share2,
      action: actions.onShare,
      group: 'share' as const,
    }] : []),

    // Danger group
    ...(actions.onDelete ? [{
      id: 'delete',
      label: 'Удалить',
      icon: Trash2,
      action: () => setDeleteDialogOpen(true),
      destructive: true,
      group: 'danger' as const,
    }] : []),
  ];

  const groupedActions = trackActions.reduce((acc, action) => {
    if (!acc[action.group]) acc[action.group] = [];
    acc[action.group].push(action);
    return acc;
  }, {} as Record<string, TrackAction[]>);

  const groupLabels: Record<string, string> = {
    playback: 'Воспроизведение',
    library: 'Библиотека',
    edit: 'Редактирование',
    share: 'Общий доступ',
    danger: 'Удаление',
  };

  const groupOrder: Array<keyof typeof groupedActions> = ['playback', 'library', 'edit', 'share', 'danger'];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button
              variant={variant}
              size={size}
              disabled={isExecuting}
              className={cn(
                "touch-manipulation",
                size === 'icon' && "h-9 w-9 sm:h-8 sm:w-8"
              )}
              data-menu-trigger
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Открыть меню действий</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {groupOrder.map((groupKey, groupIndex) => {
            const group = groupedActions[groupKey];
            if (!group || group.length === 0) return null;

            return (
              <div key={groupKey}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  {groupLabels[groupKey]}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  {group.map((action) => {
                    const Icon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={() => handleAction(action.action)}
                        disabled={action.disabled || isExecuting}
                        className={cn(
                          "cursor-pointer gap-2",
                          action.destructive && "text-destructive focus:text-destructive"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{action.label}</span>
                        {action.shortcut && (
                          <DropdownMenuShortcut className="text-xs">
                            {action.shortcut}
                          </DropdownMenuShortcut>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить трек?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить трек "{trackTitle}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actions.onDelete) {
                  handleAction(actions.onDelete);
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
