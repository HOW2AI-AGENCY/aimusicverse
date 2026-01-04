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
      
      <Button
        onClick={onReplace}
        disabled={!isValid || isSubmitting}
        className={`flex-1 gap-2 ${compact ? "h-8" : "h-9"}`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Генерация...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            Заменить секцию
          </>
        )}
      </Button>
    </div>
  );
}
