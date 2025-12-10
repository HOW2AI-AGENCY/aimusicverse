/**
 * Action buttons for section replacement
 */

import { motion } from '@/lib/motion';
import { Wand2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionActionsProps {
  onReplace: () => void;
  onCancel: () => void;
  isValid: boolean;
  isSubmitting: boolean;
  compact?: boolean;
}

export function SectionActions({
  onReplace,
  onCancel,
  isValid,
  isSubmitting,
  compact = false,
}: SectionActionsProps) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'pt-2' : 'pt-3'}`}>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          onClick={onCancel}
          disabled={isSubmitting}
          className={compact ? "h-8" : "h-9"}
        >
          <X className="w-4 h-4 mr-1.5" />
          Отмена
        </Button>
      </motion.div>
      
      <motion.div 
        className="flex-1"
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onReplace}
          disabled={!isValid || isSubmitting}
          className={`w-full gap-2 ${compact ? "h-8" : "h-9"}`}
        >
          {isSubmitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
              Генерация...
            </>
          ) : (
            <>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Wand2 className="w-4 h-4" />
              </motion.div>
              Заменить секцию
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
