/**
 * AppHeader - Unified header with centered logo for all pages
 * Accounts for Telegram safe area and native buttons
 */

import { motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  /** Custom title element to replace the default title text */
  titleElement?: React.ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function AppHeader({ 
  title, 
  subtitle, 
  icon,
  leftAction, 
  rightAction,
  titleElement,
  className,
  showLogo = true,
}: AppHeaderProps) {
  return (
    <motion.header 
      className={cn(
        "sticky top-0 z-20 -mx-4 px-3",
        // Telegram content safe area for native buttons - reduced base padding
        "pt-[max(calc(var(--tg-content-safe-area-inset-top,0px)+0.5rem),calc(env(safe-area-inset-top,0px)+0.5rem))] pb-2",
        "backdrop-blur-xl bg-background/90 border-b border-border/50",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Centered Logo - compact */}
      {showLogo && (
        <motion.div 
          className="flex justify-center mb-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div
            className="flex flex-col items-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="relative"
              animate={{ 
                boxShadow: [
                  '0 0 15px hsl(207 90% 54% / 0.2)',
                  '0 0 25px hsl(207 90% 54% / 0.3)',
                  '0 0 15px hsl(207 90% 54% / 0.2)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img 
                src={logo} 
                alt="MusicVerse AI" 
                className="h-10 w-10 rounded-xl shadow-md" 
              />
            </motion.div>
            <h1 className="text-xs font-bold text-gradient leading-tight mt-1">
              MusicVerse AI
            </h1>
          </motion.div>
        </motion.div>
      )}

      {/* Page header row */}
      <motion.div 
        className="flex items-center justify-between gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {/* Left action or spacer */}
        <div className="flex items-center gap-2 flex-shrink-0 min-w-[40px]">
          {leftAction}
        </div>

        {/* Title section - center */}
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          {icon && (
            <motion.div 
              className="flex-shrink-0 p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              {icon}
            </motion.div>
          )}
          <div className="text-center min-w-0 flex-1">
            {titleElement || (
              <h2 className="text-base sm:text-lg font-bold truncate">{title}</h2>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right action or spacer */}
        <div className="flex items-center gap-1.5 flex-shrink-0 min-w-[40px] justify-end">
          {rightAction}
        </div>
      </motion.div>
    </motion.header>
  );
}
