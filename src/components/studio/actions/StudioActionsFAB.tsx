/**
 * StudioActionsFAB - Floating Action Button with expandable menu
 * Primary action: Replace Section
 * Secondary actions: contextual based on track state
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Plus, X, Scissors, Split, Mic, Music, 
  Shuffle, ArrowRight, Clock, Wand2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  available: boolean;
  processing?: boolean;
  primary?: boolean;
  color?: string;
}

interface StudioActionsFABProps {
  canReplace?: boolean;
  canSeparate?: boolean;
  hasStems?: boolean;
  hasVocals?: boolean;
  isSeparating?: boolean;
  onReplaceSection?: () => void;
  onSeparateStems?: (mode: 'simple' | 'detailed') => void;
  onReplaceVocal?: () => void;
  onReplaceArrangement?: () => void;
  onRemix?: () => void;
  onExtend?: () => void;
  onTrim?: () => void;
}

export function StudioActionsFAB({
  canReplace,
  canSeparate,
  hasStems,
  hasVocals = true,
  isSeparating,
  onReplaceSection,
  onSeparateStems,
  onReplaceVocal,
  onReplaceArrangement,
  onRemix,
  onExtend,
  onTrim,
}: StudioActionsFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions: ActionItem[] = [
    {
      id: 'replace',
      icon: <Scissors className="w-5 h-5" />,
      label: 'Заменить секцию',
      onClick: onReplaceSection || (() => {}),
      available: !!canReplace && !!onReplaceSection,
      primary: true,
      color: 'from-primary to-primary/80',
    },
    {
      id: 'separate',
      icon: isSeparating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Split className="w-5 h-5" />,
      label: 'Разделить на стемы',
      onClick: () => onSeparateStems?.('simple'),
      available: !!canSeparate && !hasStems && !!onSeparateStems,
      processing: isSeparating,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'vocal',
      icon: <Mic className="w-5 h-5" />,
      label: 'Заменить вокал',
      onClick: onReplaceVocal || (() => {}),
      available: !!canReplace && hasVocals && !!onReplaceVocal,
      color: 'from-pink-500 to-pink-600',
    },
    {
      id: 'arrangement',
      icon: <Music className="w-5 h-5" />,
      label: 'Заменить аранжировку',
      onClick: onReplaceArrangement || (() => {}),
      available: !!canReplace && !!onReplaceArrangement,
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'remix',
      icon: <Shuffle className="w-5 h-5" />,
      label: 'Создать ремикс',
      onClick: onRemix || (() => {}),
      available: !!onRemix,
      color: 'from-amber-500 to-amber-600',
    },
    {
      id: 'extend',
      icon: <ArrowRight className="w-5 h-5" />,
      label: 'Расширить трек',
      onClick: onExtend || (() => {}),
      available: !!onExtend,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      id: 'trim',
      icon: <Clock className="w-5 h-5" />,
      label: 'Обрезать',
      onClick: onTrim || (() => {}),
      available: !!onTrim,
      color: 'from-slate-500 to-slate-600',
    },
  ];

  const availableActions = actions.filter(a => a.available);
  const primaryAction = availableActions.find(a => a.primary);
  const secondaryActions = availableActions.filter(a => !a.primary);

  if (availableActions.length === 0) return null;

  return (
    <div className="relative">
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setIsExpanded(false)}
            />

            {/* Action Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute bottom-16 right-0 z-50 flex flex-col gap-2 items-end"
            >
              {secondaryActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <span className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-medium shadow-lg whitespace-nowrap">
                    {action.label}
                  </span>
                  <Button
                    size="icon"
                    onClick={() => {
                      action.onClick();
                      setIsExpanded(false);
                    }}
                    disabled={action.processing}
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg",
                      "bg-gradient-to-br", action.color,
                      "hover:shadow-xl hover:scale-105 transition-all"
                    )}
                  >
                    {action.icon}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        animate={isExpanded ? { rotate: 45 } : { rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isExpanded ? (
          <Button
            size="icon"
            onClick={() => setIsExpanded(false)}
            className={cn(
              "h-14 w-14 rounded-full shadow-xl z-50",
              "bg-muted hover:bg-muted/80"
            )}
          >
            <X className="w-6 h-6" />
          </Button>
        ) : primaryAction ? (
          <div className="flex flex-col gap-2 items-end">
            {/* Primary Action Button */}
            <Button
              size="icon"
              onClick={primaryAction.onClick}
              className={cn(
                "h-14 w-14 rounded-full shadow-xl",
                "bg-gradient-to-br", primaryAction.color,
                "hover:shadow-2xl hover:scale-105 transition-all"
              )}
            >
              {primaryAction.icon}
            </Button>
            
            {/* Expand Button */}
            {secondaryActions.length > 0 && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsExpanded(true)}
                className="h-10 w-10 rounded-full shadow-lg bg-background/80 backdrop-blur"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <Button
            size="icon"
            onClick={() => setIsExpanded(true)}
            className={cn(
              "h-14 w-14 rounded-full shadow-xl",
              "bg-gradient-to-br from-primary to-primary/80",
              "hover:shadow-2xl hover:scale-105 transition-all"
            )}
          >
            <Wand2 className="w-6 h-6" />
          </Button>
        )}
      </motion.div>
    </div>
  );
}
