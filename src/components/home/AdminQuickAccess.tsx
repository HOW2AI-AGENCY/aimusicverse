/**
 * AdminQuickAccess - Quick access button to admin panel
 * 
 * Displayed only for administrators in the header
 * Uses useAdminAuth hook for permission check
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useTelegram } from '@/contexts/TelegramContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdminQuickAccessProps {
  className?: string;
}

export const AdminQuickAccess = memo(function AdminQuickAccess({ 
  className 
}: AdminQuickAccessProps) {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const { data: adminAuth, isLoading } = useAdminAuth();

  // Don't render if not admin or loading
  if (isLoading || !adminAuth?.isAdmin) {
    return null;
  }

  const handleClick = () => {
    hapticFeedback('medium');
    navigate('/admin');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={handleClick}
            className={cn(
              "relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl",
              "flex items-center justify-center",
              "bg-destructive/10 hover:bg-destructive/20",
              "border border-destructive/30 hover:border-destructive/50",
              "transition-all duration-200 touch-manipulation",
              className
            )}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Админ-панель"
          >
            <Shield className="w-5 h-5 text-destructive" />
            
            {/* Pulsing indicator */}
            <motion.span
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Админ-панель
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
