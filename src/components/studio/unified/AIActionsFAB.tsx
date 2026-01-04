/**
 * AIActionsFAB - Floating Action Button for AI Actions
 * 
 * A floating action button that expands to show AI-powered actions:
 * - Generate new track
 * - Extend track
 * - Create cover
 * - Add vocals
 * - Separate stems
 * 
 * Designed for mobile-first experience with touch-friendly targets.
 * 
 * @see ADR-011 for architecture decisions
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  Sparkles,
  Plus,
  X,
  ArrowRight,
  Music2,
  Mic2,
  Layers,
  Wand2,
} from 'lucide-react';

interface AIActionsFABProps {
  onGenerate?: () => void;
  onExtend?: () => void;
  onCover?: () => void;
  onAddVocals?: () => void;
  onSeparateStems?: () => void;
  disabled?: boolean;
  className?: string;
}

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  color: string;
}

export const AIActionsFAB = memo(function AIActionsFAB({
  onGenerate,
  onExtend,
  onCover,
  onAddVocals,
  onSeparateStems,
  disabled = false,
  className,
}: AIActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const haptic = useHapticFeedback();

  const actions: ActionItem[] = [
    {
      id: 'generate',
      label: 'Создать',
      icon: <Music2 className="w-5 h-5" />,
      onClick: onGenerate,
      color: 'bg-primary text-primary-foreground',
    },
    {
      id: 'extend',
      label: 'Расширить',
      icon: <ArrowRight className="w-5 h-5" />,
      onClick: onExtend,
      color: 'bg-blue-500 text-white',
    },
    {
      id: 'cover',
      label: 'Кавер',
      icon: <Wand2 className="w-5 h-5" />,
      onClick: onCover,
      color: 'bg-violet-500 text-white',
    },
    {
      id: 'vocals',
      label: 'Вокал',
      icon: <Mic2 className="w-5 h-5" />,
      onClick: onAddVocals,
      color: 'bg-pink-500 text-white',
    },
    {
      id: 'stems',
      label: 'Стемы',
      icon: <Layers className="w-5 h-5" />,
      onClick: onSeparateStems,
      color: 'bg-emerald-500 text-white',
    },
  ].filter(action => action.onClick);

  const toggleOpen = useCallback(() => {
    haptic.tap();
    setIsOpen(prev => !prev);
  }, [haptic]);

  const handleAction = useCallback((action: ActionItem) => {
    haptic.select();
    setIsOpen(false);
    action.onClick?.();
  }, [haptic]);

  const handleBackdropClick = useCallback(() => {
    haptic.tap();
    setIsOpen(false);
  }, [haptic]);

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
          {isOpen && actions.map((action, index) => (
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
                className="px-3 py-1.5 rounded-full bg-card text-card-foreground text-sm font-medium shadow-lg"
              >
                {action.label}
              </motion.span>
              
              {/* Button */}
              <Button
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full shadow-lg",
                  action.color
                )}
                onClick={() => handleAction(action)}
                disabled={disabled}
              >
                {action.icon}
              </Button>
            </motion.div>
          ))}
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
