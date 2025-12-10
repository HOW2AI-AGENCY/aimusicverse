/**
 * Validation warning for section duration
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionValidationProps {
  isValid: boolean;
  sectionDuration: number;
  maxDuration: number;
  compact?: boolean;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SectionValidation({
  isValid,
  sectionDuration,
  maxDuration,
  compact = false,
}: SectionValidationProps) {
  return (
    <AnimatePresence mode="wait">
      {!isValid ? (
        <motion.div 
          key="invalid"
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            "flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg overflow-hidden",
            compact ? "p-2 text-xs" : "p-3 text-sm"
          )}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AlertTriangle className={cn(
              "text-destructive flex-shrink-0",
              compact ? "w-3.5 h-3.5" : "w-4 h-4"
            )} />
          </motion.div>
          <div>
            <p className="font-medium text-destructive">Секция слишком длинная</p>
            <p className="text-muted-foreground text-xs">
              Сейчас: {formatTime(sectionDuration)} • Максимум: {formatTime(maxDuration)} (50% трека)
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="valid"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            "flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400",
            compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
          )}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <Check className="w-3.5 h-3.5" />
          </motion.div>
          <span>Готово к замене • {formatTime(sectionDuration)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
