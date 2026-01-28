/**
 * MobileStudioQuickActions - Quick action buttons for mobile studio
 * Floating action buttons with gesture support
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Plus,
  Wand2,
  Mic,
  Music,
  Scissors,
  Download,
  Share2,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color?: string;
  onClick: () => void;
}

interface MobileStudioQuickActionsProps {
  onAddTrack: () => void;
  onSeparateStems: () => void;
  onAddVocals: () => void;
  onAIAssist: () => void;
  onExport: () => void;
  onShare: () => void;
  isProcessing?: boolean;
  className?: string;
}

export const MobileStudioQuickActions = memo(function MobileStudioQuickActions({
  onAddTrack,
  onSeparateStems,
  onAddVocals,
  onAIAssist,
  onExport,
  onShare,
  isProcessing = false,
  className,
}: MobileStudioQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const haptic = useHapticFeedback();

  const toggle = useCallback(() => {
    haptic.impact('medium');
    setIsOpen(prev => !prev);
  }, [haptic]);

  const handleAction = useCallback((action: () => void) => {
    haptic.impact('light');
    setIsOpen(false);
    action();
  }, [haptic]);

  const actions: QuickAction[] = [
    {
      id: 'add-track',
      icon: Music,
      label: 'Добавить дорожку',
      color: 'bg-blue-500',
      onClick: () => handleAction(onAddTrack),
    },
    {
      id: 'separate',
      icon: Scissors,
      label: 'Разделить стемы',
      color: 'bg-violet-500',
      onClick: () => handleAction(onSeparateStems),
    },
    {
      id: 'add-vocals',
      icon: Mic,
      label: 'Добавить вокал',
      color: 'bg-pink-500',
      onClick: () => handleAction(onAddVocals),
    },
    {
      id: 'ai-assist',
      icon: Sparkles,
      label: 'AI Ассистент',
      color: 'bg-amber-500',
      onClick: () => handleAction(onAIAssist),
    },
    {
      id: 'export',
      icon: Download,
      label: 'Экспорт',
      color: 'bg-emerald-500',
      onClick: () => handleAction(onExport),
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Поделиться',
      color: 'bg-cyan-500',
      onClick: () => handleAction(onShare),
    },
  ];

  return (
    <div className={cn('fixed bottom-24 right-4 z-50', className)}>
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-2 items-end"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: 20, y: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <span className="px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-xs font-medium shadow-lg border border-border/50">
                    {action.label}
                  </span>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={action.onClick}
                    disabled={isProcessing}
                    className={cn(
                      'h-12 w-12 rounded-full shadow-lg min-w-12 min-h-12',
                      action.color,
                      'hover:opacity-90 transition-opacity'
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="default"
          size="icon"
          onClick={toggle}
          disabled={isProcessing}
          className={cn(
            'h-14 w-14 rounded-full shadow-xl min-w-14 min-h-14',
            'bg-primary hover:bg-primary/90',
            isOpen && 'bg-destructive hover:bg-destructive/90'
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Processing indicator */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-1 -right-1"
        >
          <span className="flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
          </span>
        </motion.div>
      )}
    </div>
  );
});
