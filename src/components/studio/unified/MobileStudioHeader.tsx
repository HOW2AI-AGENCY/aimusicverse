/**
 * MobileStudioHeader - Optimized header for mobile studio
 * Compact controls with essential actions
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import {
  ArrowLeft,
  Save,
  MoreVertical,
  Undo2,
  Redo2,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MobileStudioHeaderProps {
  title: string;
  hasUnsavedChanges: boolean;
  isSaving?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onBack: () => void;
  onSave: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  className?: string;
}

export const MobileStudioHeader = memo(function MobileStudioHeader({
  title,
  hasUnsavedChanges,
  isSaving = false,
  canUndo = false,
  canRedo = false,
  onBack,
  onSave,
  onUndo,
  onRedo,
  onSettings,
  onHelp,
  className,
}: MobileStudioHeaderProps) {
  const haptic = useHapticFeedback();

  const handleBack = useCallback(() => {
    haptic.impact('light');
    onBack();
  }, [haptic, onBack]);

  const handleSave = useCallback(() => {
    haptic.impact('medium');
    onSave();
  }, [haptic, onSave]);

  const handleUndo = useCallback(() => {
    if (canUndo && onUndo) {
      haptic.impact('light');
      onUndo();
    }
  }, [haptic, canUndo, onUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo && onRedo) {
      haptic.impact('light');
      onRedo();
    }
  }, [haptic, canRedo, onRedo]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'sticky top-0 z-40 px-2 py-2',
        'bg-background/80 backdrop-blur-xl border-b border-border/50',
        'safe-area-top',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-10 w-10 rounded-full shrink-0 min-w-10 min-h-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Title & status */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <h1 className="font-semibold text-base truncate">{title}</h1>
          {hasUnsavedChanges && !isSaving && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">
              •
            </Badge>
          )}
          {isSaving && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                ⏳
              </motion.span>
              Сохранение...
            </span>
          )}
        </div>

        {/* Undo/Redo */}
        {(onUndo || onRedo) && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-9 w-9 rounded-full min-w-9 min-h-9"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-9 w-9 rounded-full min-w-9 min-h-9"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Save button */}
        <Button
          variant={hasUnsavedChanges ? 'default' : 'ghost'}
          size="icon"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'h-10 w-10 rounded-full shrink-0 min-w-10 min-h-10',
            hasUnsavedChanges && 'shadow-lg'
          )}
        >
          <Save className="h-5 w-5" />
        </Button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full shrink-0 min-w-10 min-h-10"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onSettings && (
              <DropdownMenuItem onClick={onSettings}>
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </DropdownMenuItem>
            )}
            {onHelp && (
              <DropdownMenuItem onClick={onHelp}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Помощь
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
});
