/**
 * Floating Studio Actions (FAB)
 * Quick access to main studio actions on mobile
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Plus, X, Scissors, Split, Mic, Music, 
  Shuffle, ArrowRight, Wand2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface FloatingStudioActionsProps {
  onReplaceSection?: () => void;
  onSeparateStems?: () => void;
  onReplaceVocal?: () => void;
  onReplaceArrangement?: () => void;
  onRemix?: () => void;
  onExtend?: () => void;
  disabled?: boolean;
  className?: string;
}

const actions = [
  { id: 'replace', icon: Scissors, label: 'Заменить секцию', color: 'bg-primary' },
  { id: 'separate', icon: Split, label: 'Разделить на стемы', color: 'bg-blue-500' },
  { id: 'vocal', icon: Mic, label: 'Заменить вокал', color: 'bg-purple-500' },
  { id: 'arrangement', icon: Music, label: 'Новая аранжировка', color: 'bg-orange-500' },
  { id: 'remix', icon: Shuffle, label: 'Создать ремикс', color: 'bg-pink-500' },
  { id: 'extend', icon: ArrowRight, label: 'Расширить', color: 'bg-green-500' },
] as const;

export function FloatingStudioActions({
  onReplaceSection,
  onSeparateStems,
  onReplaceVocal,
  onReplaceArrangement,
  onRemix,
  onExtend,
  disabled,
  className,
}: FloatingStudioActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const haptic = useHapticFeedback();

  const handleToggle = () => {
    haptic.tap();
    setIsOpen(!isOpen);
  };

  const handleAction = (actionId: string) => {
    haptic.select();
    setIsOpen(false);
    
    switch (actionId) {
      case 'replace':
        onReplaceSection?.();
        break;
      case 'separate':
        onSeparateStems?.();
        break;
      case 'vocal':
        onReplaceVocal?.();
        break;
      case 'arrangement':
        onReplaceArrangement?.();
        break;
      case 'remix':
        onRemix?.();
        break;
      case 'extend':
        onExtend?.();
        break;
    }
  };

  const availableActions = actions.filter(action => {
    switch (action.id) {
      case 'replace': return !!onReplaceSection;
      case 'separate': return !!onSeparateStems;
      case 'vocal': return !!onReplaceVocal;
      case 'arrangement': return !!onReplaceArrangement;
      case 'remix': return !!onRemix;
      case 'extend': return !!onExtend;
      default: return false;
    }
  });

  if (availableActions.length === 0) return null;

  return (
    <div className={cn("fixed right-4 bottom-24 z-40", className)}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Action buttons */}
            <div className="absolute bottom-16 right-0 space-y-2">
              {availableActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.5, 
                    y: 20,
                    transition: { delay: (availableActions.length - index) * 0.03 }
                  }}
                  className="flex items-center gap-3 justify-end"
                >
                  <motion.span 
                    className="px-3 py-1.5 bg-card rounded-lg text-sm font-medium shadow-lg whitespace-nowrap"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                  >
                    {action.label}
                  </motion.span>
                  <Button
                    size="icon"
                    disabled={disabled}
                    onClick={() => handleAction(action.id)}
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg",
                      action.color,
                      "hover:scale-105 transition-transform"
                    )}
                  >
                    <action.icon className="w-5 h-5 text-white" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          size="icon"
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            "h-14 w-14 rounded-full shadow-xl",
            isOpen 
              ? "bg-muted text-muted-foreground" 
              : "bg-primary text-primary-foreground",
            "hover:scale-105 transition-transform"
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Wand2 className="w-6 h-6" />
          )}
        </Button>
      </motion.div>
    </div>
  );
}
