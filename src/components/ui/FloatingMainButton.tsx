/**
 * Floating Main Button Component
 * 
 * A fixed-position button that mimics Telegram's MainButton for web/dev environments.
 * Properly handles safe areas and fullscreen mode.
 */

import { ReactNode } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Z_INDEX, getBottomSafeAreaWithNav } from '@/lib/toast-position';

interface FloatingMainButtonProps {
  visible: boolean;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function FloatingMainButton({
  visible,
  text,
  onClick,
  disabled = false,
  loading = false,
  icon,
  className,
}: FloatingMainButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 pointer-events-none"
          style={{
            zIndex: Z_INDEX.floatingButton,
            paddingBottom: getBottomSafeAreaWithNav(),
          }}
        >
          <div className="px-4 pointer-events-auto">
            <Button
              onClick={onClick}
              disabled={disabled || loading}
              className={cn(
                'w-full h-14 text-base font-semibold',
                'bg-primary hover:bg-primary/90 text-primary-foreground',
                'shadow-xl shadow-primary/25',
                'rounded-2xl',
                'transition-all duration-200',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {text}
                </>
              ) : (
                <>
                  {icon && <span className="mr-2">{icon}</span>}
                  {text}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
