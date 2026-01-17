/**
 * StemsActionButton - Unified stems action with mode selector dialog
 * Replaces separate stems_simple and stems_detailed buttons
 */

import { useState } from 'react';
import { Scissors, Wand2, Layers } from 'lucide-react';
import { IconGridButton } from '../IconGridButton';
import { ActionId } from '@/config/trackActionsConfig';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

interface StemsActionButtonProps {
  onAction: (actionId: ActionId) => void;
  isProcessing?: boolean;
  variant?: 'icon' | 'button';
}

export function StemsActionButton({ 
  onAction, 
  isProcessing,
  variant = 'icon'
}: StemsActionButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    hapticImpact('light');
    setDialogOpen(true);
  };

  const handleSelectMode = (mode: 'simple' | 'detailed') => {
    hapticImpact('medium');
    setDialogOpen(false);
    onAction(mode === 'simple' ? 'stems_simple' : 'stems_detailed');
  };

  return (
    <>
      {variant === 'icon' ? (
        <IconGridButton
          icon={Layers}
          label="Стемы"
          color="green"
          onClick={handleOpenDialog}
          disabled={isProcessing}
        />
      ) : (
        <Button
          size="sm"
          onClick={handleOpenDialog}
          disabled={isProcessing}
          className="shrink-0"
        >
          <Layers className="w-4 h-4 mr-1" />
          Разделить
        </Button>
      )}

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Разделить на стемы
            </AlertDialogTitle>
            <AlertDialogDescription>
              Выберите режим разделения трека на отдельные дорожки
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3 py-4">
            {/* Simple mode */}
            <button
              onClick={() => handleSelectMode('simple')}
              disabled={isProcessing}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                "hover:border-primary hover:bg-primary/5",
                "active:scale-[0.98]"
              )}
            >
              <div className="p-2 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">Быстрый (2 дорожки)</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Вокал + инструментал. Быстро и бесплатно.
                </div>
              </div>
            </button>

            {/* Detailed mode */}
            <button
              onClick={() => handleSelectMode('detailed')}
              disabled={isProcessing}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                "hover:border-primary hover:bg-primary/5",
                "active:scale-[0.98]"
              )}
            >
              <div className="p-2 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <Wand2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">Детальный (6+ дорожек)</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  Вокал, бас, барабаны, гитара, пиано и другие.
                </div>
              </div>
            </button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
