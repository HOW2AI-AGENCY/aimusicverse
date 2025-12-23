/**
 * BetaDisclaimer - Banner showing beta status with feedback link
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app.config';
import { cn } from '@/lib/utils';

interface BetaDisclaimerProps {
  className?: string;
  variant?: 'banner' | 'compact' | 'floating';
}

const STORAGE_KEY = 'beta-disclaimer-dismissed';

export function BetaDisclaimer({ className, variant = 'banner' }: BetaDisclaimerProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (!APP_CONFIG.beta.disclaimerDismissable) return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  if (!APP_CONFIG.beta.showDisclaimer || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleFeedback = () => {
    window.open(APP_CONFIG.beta.feedbackUrl, '_blank');
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-amber-500/10 border border-amber-500/20",
          "text-amber-500 text-xs font-medium",
          className
        )}
      >
        <Sparkles className="w-3 h-3" />
        <span>Beta {APP_CONFIG.version}</span>
      </motion.div>
    );
  }

  if (variant === 'floating') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={cn(
            "fixed bottom-20 left-4 right-4 z-40",
            "p-4 rounded-2xl",
            "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10",
            "border border-amber-500/20 backdrop-blur-xl",
            "shadow-xl shadow-amber-500/5",
            className
          )}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground">Beta-версия</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                  v{APP_CONFIG.version}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Это бета-версия приложения. Некоторые функции могут работать нестабильно.
                Мы будем благодарны за обратную связь!
              </p>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFeedback}
                className="mt-2 gap-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 p-0 h-auto"
              >
                <MessageCircle className="w-4 h-4" />
                Отправить отзыв
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>

            {APP_CONFIG.beta.disclaimerDismissable && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="shrink-0 h-8 w-8 rounded-full hover:bg-amber-500/10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default banner variant with Telegram safe area support
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden",
        "bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10",
        "border-b border-amber-500/20",
        className
      )}
      style={{
        paddingTop: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px)), env(safe-area-inset-top, 0px))'
      }}
    >
      {/* Animated background shimmer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      
      <div className="relative flex items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </motion.div>
            <span className="text-sm font-medium text-amber-500">
              Beta v{APP_CONFIG.version}
            </span>
          </div>
          
          <span className="hidden sm:inline text-sm text-muted-foreground truncate">
            Некоторые функции могут работать нестабильно
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFeedback}
            className="gap-1.5 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 h-7 text-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Отзыв</span>
          </Button>

          {APP_CONFIG.beta.disclaimerDismissable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-7 w-7 rounded-full hover:bg-amber-500/10"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
