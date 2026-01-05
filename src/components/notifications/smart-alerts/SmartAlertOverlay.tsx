import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartAlert } from './types';
import { illustrations } from './AlertIllustrations';
import { FeatureDetailSheet } from './FeatureDetailSheet';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SmartAlertOverlayProps {
  alert: SmartAlert | null;
  onDismiss: () => void;
}

const typeStyles: Record<SmartAlert['type'], { bg: string; border: string; icon: React.ReactNode; glow?: string }> = {
  error: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: <AlertCircle className="w-5 h-5 text-destructive" />,
    glow: 'shadow-destructive/20',
  },
  warning: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    glow: 'shadow-orange-500/20',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: <Info className="w-5 h-5 text-blue-500" />,
    glow: 'shadow-blue-500/20',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    glow: 'shadow-green-500/20',
  },
  onboarding: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    glow: 'shadow-primary/20',
  },
};

export function SmartAlertOverlay({ alert, onDismiss }: SmartAlertOverlayProps) {
  const [showFeatureSheet, setShowFeatureSheet] = useState(false);
  const [progress, setProgress] = useState(100);
  const haptic = useHapticFeedback();

  // Haptic feedback on alert show
  useEffect(() => {
    if (alert) {
      switch (alert.type) {
        case 'error':
          haptic.error();
          break;
        case 'success':
          haptic.success();
          break;
        case 'warning':
          haptic.warning();
          break;
        default:
          haptic.tap();
          break;
      }
    }
  }, [alert, haptic]);

  // Progress bar for autoHide
  useEffect(() => {
    if (!alert?.autoHide) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = alert.autoHide;
    const interval = 50; // Update every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [alert?.autoHide, alert?.id]);

  const handleLearnMore = useCallback(() => {
    if (alert?.featureKey) {
      haptic.tap();
      setShowFeatureSheet(true);
    }
  }, [alert?.featureKey, haptic]);

  if (!alert) return null;

  const style = typeStyles[alert.type];
  const IllustrationComponent = alert.illustration ? illustrations[alert.illustration] : null;

  // Get action for feature sheet
  const primaryAction = alert.actions?.[0];

  return (
    <>
      <AnimatePresence>
        {alert && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[200]"
              onClick={alert.dismissible !== false ? onDismiss : undefined}
            />

            {/* Alert Card - centered on all screens */}
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed z-[201] left-4 right-4 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2"
              style={{
                top: 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + var(--tg-safe-area-inset-top, 0px) + 0.75rem), calc(env(safe-area-inset-top, 0px) + 0.75rem))',
              }}
            >
              {/* Shake animation wrapper for errors */}
              <motion.div
                animate={alert.type === 'error' ? { 
                  x: [0, -4, 4, -4, 4, -2, 2, 0] 
                } : undefined}
                transition={{ duration: 0.5 }}
              >
                <div
                  className={cn(
                    'relative rounded-2xl border p-4 shadow-2xl overflow-hidden',
                    style.bg,
                    style.border,
                    'backdrop-blur-md',
                    style.glow && `shadow-lg ${style.glow}`
                  )}
                >
                  {/* Pulse glow for success */}
                  {alert.type === 'success' && (
                    <motion.div
                      className="absolute inset-0 bg-green-500/10 rounded-2xl pointer-events-none"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  {/* Progress bar for autoHide */}
                  {alert.autoHide && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-foreground/5">
                      <motion.div
                        className={cn(
                          'h-full rounded-full',
                          alert.type === 'error' ? 'bg-destructive/50' :
                          alert.type === 'success' ? 'bg-green-500/50' :
                          alert.type === 'warning' ? 'bg-orange-500/50' :
                          'bg-primary/50'
                        )}
                        initial={{ width: '100%' }}
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>
                  )}

                  {/* Dismiss button - larger touch target */}
                  {alert.dismissible !== false && (
                    <button
                      onClick={onDismiss}
                      className="absolute top-2 right-2 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors z-10"
                      aria-label="Закрыть"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}

                  <div className="flex gap-4 relative z-[1]">
                    {/* Icon/Illustration */}
                    <div className="flex-shrink-0">
                      {IllustrationComponent ? (
                        <IllustrationComponent />
                      ) : (
                        <motion.div
                          animate={
                            alert.type === 'error' 
                              ? { scale: [1, 1.15, 1] }
                              : alert.type === 'onboarding'
                              ? { y: [0, -4, 0] }
                              : undefined
                          }
                          transition={{ 
                            duration: alert.type === 'onboarding' ? 1.5 : 1, 
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-background/50"
                        >
                          {alert.icon || style.icon}
                        </motion.div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <motion.h3
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="font-semibold text-foreground"
                      >
                        {alert.title}
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-muted-foreground mt-1"
                      >
                        {alert.message}
                      </motion.p>

                      {/* Actions */}
                      {(alert.actions && alert.actions.length > 0) || alert.featureKey ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center gap-2 mt-4 flex-wrap"
                        >
                          {alert.actions?.map((action, index) => (
                            <Button
                              key={index}
                              variant={action.variant || 'default'}
                              size="sm"
                              onClick={() => {
                                haptic.tap();
                                action.onClick();
                                onDismiss();
                              }}
                              className={cn(
                                "relative overflow-hidden group h-10 min-h-[44px] px-4",
                                index === 0 && "min-w-[100px]"
                              )}
                            >
                              {/* Shimmer effect for primary button */}
                              {index === 0 && (
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                              )}
                              <span className="relative">{action.label}</span>
                            </Button>
                          ))}
                          
                          {/* Learn More button */}
                          {alert.featureKey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleLearnMore}
                              className="text-muted-foreground hover:text-foreground gap-1.5 h-10 min-h-[44px] px-3"
                            >
                              <HelpCircle className="w-4 h-4" />
                              Подробнее
                            </Button>
                          )}
                        </motion.div>
                      ) : null}
                    </div>
                  </div>

                  {/* Decorative sparkles for success/achievement */}
                  {alert.type === 'success' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400"
                          initial={{
                            x: '50%',
                            y: '50%',
                            scale: 0,
                            opacity: 0,
                          }}
                          animate={{
                            x: `${10 + Math.random() * 80}%`,
                            y: `${10 + Math.random() * 80}%`,
                            scale: [0, 1.2, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.15,
                            repeat: Infinity,
                            repeatDelay: 1.5,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Feature Detail Sheet */}
      <FeatureDetailSheet
        featureKey={alert?.featureKey ?? null}
        open={showFeatureSheet}
        onOpenChange={setShowFeatureSheet}
        onAction={primaryAction?.onClick}
        actionLabel={primaryAction?.label}
      />
    </>
  );
}
