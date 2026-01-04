/**
 * AIActionsFAB - Floating Action Button for AI Actions
 * 
 * A floating action button that expands to show AI-powered actions:
 * - Generate new track
 * - Extend track
 * - Create cover
 * - Add vocals
 * - Separate stems
 * - Save as new version (when stems block operations)
 * 
 * Supports operation locking - disabled buttons show reasons via tooltips.
 * 
 * @see ADR-011 for architecture decisions
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { StudioOperation } from '@/hooks/studio/useStudioOperationLock';
import {
  Sparkles,
  X,
  ArrowRight,
  Music2,
  Mic,
  Mic2,
  Layers,
  Wand2,
  Save,
  Lock,
  Guitar,
} from 'lucide-react';

interface AIActionsFABProps {
  onGenerate?: () => void;
  onExtend?: () => void;
  onCover?: () => void;
  onAddVocals?: () => void;
  onSeparateStems?: () => void;
  onSaveAsVersion?: () => void;
  /** Record audio/guitar/instrument */
  onRecord?: () => void;
  /** Add instrumental AI-generated */
  onAddInstrumental?: () => void;
  
  /** Operations that are currently disabled */
  disabledOperations?: StudioOperation[];
  /** Function to get reason why operation is disabled */
  getDisabledReason?: (op: StudioOperation) => string | null;
  /** Whether user can save as new version to bypass blocks */
  canSaveAsNewVersion?: boolean;
  
  disabled?: boolean;
  className?: string;
}

interface ActionItem {
  id: StudioOperation;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  color: string;
  disabledColor: string;
}

export const AIActionsFAB = memo(function AIActionsFAB({
  onGenerate,
  onExtend,
  onCover,
  onAddVocals,
  onSeparateStems,
  onSaveAsVersion,
  onRecord,
  onAddInstrumental,
  disabledOperations = [],
  getDisabledReason,
  canSaveAsNewVersion = false,
  disabled = false,
  className,
}: AIActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const haptic = useHapticFeedback();

  const isOperationDisabled = useCallback((op: StudioOperation): boolean => {
    return disabled || disabledOperations.includes(op);
  }, [disabled, disabledOperations]);

  const actions: ActionItem[] = useMemo(() => {
    const baseActions: ActionItem[] = [
      // Record action - always first for quick access
      ...(onRecord ? [{
        id: 'record' as StudioOperation,
        label: 'Записать',
        icon: <Mic className="w-5 h-5" />,
        onClick: onRecord,
        color: 'bg-red-500 text-white',
        disabledColor: 'bg-muted text-muted-foreground',
      }] : []),
      {
        id: 'generate' as StudioOperation,
        label: 'Создать',
        icon: <Music2 className="w-5 h-5" />,
        onClick: onGenerate,
        color: 'bg-primary text-primary-foreground',
        disabledColor: 'bg-muted text-muted-foreground',
      },
      {
        id: 'extend' as StudioOperation,
        label: 'Расширить',
        icon: <ArrowRight className="w-5 h-5" />,
        onClick: onExtend,
        color: 'bg-blue-500 text-white',
        disabledColor: 'bg-muted text-muted-foreground',
      },
      {
        id: 'cover' as StudioOperation,
        label: 'Кавер',
        icon: <Wand2 className="w-5 h-5" />,
        onClick: onCover,
        color: 'bg-violet-500 text-white',
        disabledColor: 'bg-muted text-muted-foreground',
      },
      {
        id: 'add_vocals' as StudioOperation,
        label: 'Вокал',
        icon: <Mic2 className="w-5 h-5" />,
        onClick: onAddVocals,
        color: 'bg-pink-500 text-white',
        disabledColor: 'bg-muted text-muted-foreground',
      },
      // Add instrumental action
      ...(onAddInstrumental ? [{
        id: 'add_instrumental' as StudioOperation,
        label: 'Инструментал',
        icon: <Guitar className="w-5 h-5" />,
        onClick: onAddInstrumental,
        color: 'bg-orange-500 text-white',
        disabledColor: 'bg-muted text-muted-foreground',
      }] : []),
      {
        id: 'separate_stems' as StudioOperation,
        label: 'Стемы',
        icon: <Layers className="w-5 h-5" />,
        onClick: onSeparateStems,
        color: 'bg-emerald-500 text-white',
        disabledColor: 'bg-muted text-muted-foreground',
      },
    ];

    // Add "Save as Version" button when stems block operations
    if (canSaveAsNewVersion && onSaveAsVersion) {
      baseActions.push({
        id: 'save_as_version' as StudioOperation,
        label: 'Новая версия',
        icon: <Save className="w-5 h-5" />,
        onClick: onSaveAsVersion,
        color: 'bg-amber-500 text-white',
        disabledColor: 'bg-muted text-muted-foreground',
      });
    }

    // Filter out actions without callbacks
    return baseActions.filter(action => action.onClick);
  }, [onGenerate, onExtend, onCover, onAddVocals, onSeparateStems, onSaveAsVersion, onRecord, onAddInstrumental, canSaveAsNewVersion]);

  const toggleOpen = useCallback(() => {
    haptic.tap();
    setIsOpen(prev => !prev);
  }, [haptic]);

  const handleAction = useCallback((action: ActionItem) => {
    const isDisabled = isOperationDisabled(action.id);
    
    if (isDisabled) {
      haptic.error();
      return;
    }
    
    haptic.select();
    setIsOpen(false);
    action.onClick?.();
  }, [haptic, isOperationDisabled]);

  const handleBackdropClick = useCallback(() => {
    haptic.tap();
    setIsOpen(false);
  }, [haptic]);

  const renderActionButton = useCallback((action: ActionItem, index: number) => {
    const isDisabled = isOperationDisabled(action.id);
    const disabledReason = isDisabled && getDisabledReason ? getDisabledReason(action.id) : null;

    const button = (
      <motion.div
        key={action.id}
        initial={{ opacity: 0, scale: 0.3, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          transition: { 
            delay: index * 0.05,
            type: 'spring',
            stiffness: 400,
            damping: 20
          }
        }}
        exit={{ 
          opacity: 0, 
          scale: 0.3, 
          y: 20,
          transition: { 
            delay: (actions.length - index - 1) * 0.03,
            duration: 0.15
          }
        }}
        className="flex items-center gap-2"
      >
        {/* Label */}
        <motion.span
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 + 0.1 } }}
          exit={{ opacity: 0, x: 10 }}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-1.5",
            isDisabled 
              ? "bg-muted text-muted-foreground" 
              : "bg-card text-card-foreground"
          )}
        >
          {isDisabled && <Lock className="w-3 h-3" />}
          {action.label}
        </motion.span>
        
        {/* Button */}
        <Button
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shadow-lg transition-all",
            isDisabled 
              ? cn(action.disabledColor, "opacity-50 cursor-not-allowed") 
              : action.color
          )}
          onClick={() => handleAction(action)}
          disabled={disabled}
        >
          {action.icon}
        </Button>
      </motion.div>
    );

    // Wrap with tooltip if disabled
    if (isDisabled && disabledReason) {
      return (
        <TooltipProvider key={action.id}>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent 
              side="left" 
              className="max-w-[200px] text-center"
            >
              {disabledReason}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return button;
  }, [actions.length, disabled, getDisabledReason, handleAction, isOperationDisabled]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className={cn(
        "fixed bottom-24 right-4 z-50 flex flex-col-reverse items-end gap-3",
        className
      )}>
        {/* Action buttons */}
        <AnimatePresence>
          {isOpen && actions.map((action, index) => renderActionButton(action, index))}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Button
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full shadow-xl",
              isOpen 
                ? "bg-muted text-muted-foreground" 
                : "bg-primary text-primary-foreground"
            )}
            onClick={toggleOpen}
            disabled={disabled}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </Button>
        </motion.div>
      </div>
    </>
  );
});

AIActionsFAB.displayName = 'AIActionsFAB';
