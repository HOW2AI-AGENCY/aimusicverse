/**
 * Animated Payment Button
 * Premium button with loading states and animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Loader2, Lock, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  price: string;
  className?: string;
}

export function PaymentButton({
  onClick,
  disabled = false,
  isLoading = false,
  isSuccess = false,
  price,
  className,
}: PaymentButtonProps) {
  const buttonContent = () => {
    if (isSuccess) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Успешно!</span>
        </motion.div>
      );
    }

    if (isLoading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Переход к оплате...</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3"
      >
        <CreditCard className="w-5 h-5" />
        <span>Оплатить {price}</span>
        <ArrowRight className="w-4 h-4" />
      </motion.div>
    );
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading || isSuccess}
      className={cn(
        'relative w-full py-4 px-6 rounded-2xl font-semibold text-lg',
        'transition-all duration-300 overflow-hidden',
        'touch-manipulation',
        isSuccess
          ? 'bg-success text-white'
          : 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground',
        disabled && !isLoading && !isSuccess && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled ? { scale: 1.02, boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.5)' } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {/* Shimmer effect */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10 opacity-0"
        whileHover={{ opacity: 1 }}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isSuccess ? 'success' : isLoading ? 'loading' : 'default'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative z-10 flex items-center justify-center"
        >
          {buttonContent()}
        </motion.div>
      </AnimatePresence>

      {/* Secure badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] text-primary-foreground/60"
      >
        <Lock className="w-3 h-3" />
        <span>Защищённая оплата</span>
      </motion.div>
    </motion.button>
  );
}
