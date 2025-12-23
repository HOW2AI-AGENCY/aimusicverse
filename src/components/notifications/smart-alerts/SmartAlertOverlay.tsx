import { motion, AnimatePresence } from '@/lib/motion';
import { X, AlertTriangle, Info, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartAlert } from './types';
import { illustrations } from './AlertIllustrations';
import { cn } from '@/lib/utils';

interface SmartAlertOverlayProps {
  alert: SmartAlert | null;
  onDismiss: () => void;
}

const typeStyles: Record<SmartAlert['type'], { bg: string; border: string; icon: React.ReactNode }> = {
  error: {
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    icon: <AlertCircle className="w-5 h-5 text-destructive" />,
  },
  warning: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: <Info className="w-5 h-5 text-blue-500" />,
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  },
  onboarding: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: <Sparkles className="w-5 h-5 text-primary" />,
  },
};

const typeAnimations: Record<SmartAlert['type'], object> = {
  error: {
    initial: { x: [-5, 5, -5, 5, 0] },
    animate: { x: 0 },
    transition: { duration: 0.4 },
  },
  warning: {
    initial: { scale: 0.95 },
    animate: { scale: 1 },
    transition: { type: 'spring', stiffness: 400 },
  },
  info: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
  },
  success: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  onboarding: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
};

export function SmartAlertOverlay({ alert, onDismiss }: SmartAlertOverlayProps) {
  if (!alert) return null;

  const style = typeStyles[alert.type];
  const animation = typeAnimations[alert.type];
  const IllustrationComponent = alert.illustration ? illustrations[alert.illustration] : null;

  return (
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

          {/* Alert Card */}
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[201] w-[90vw] max-w-md"
          >
            <motion.div
              {...animation}
              className={cn(
                'relative rounded-2xl border p-4 shadow-2xl',
                style.bg,
                style.border,
                'backdrop-blur-md'
              )}
            >
              {/* Dismiss button */}
              {alert.dismissible !== false && (
                <button
                  onClick={onDismiss}
                  className="absolute top-3 right-3 p-1 rounded-full hover:bg-foreground/10 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              <div className="flex gap-4">
                {/* Icon/Illustration */}
                <div className="flex-shrink-0">
                  {IllustrationComponent ? (
                    <IllustrationComponent />
                  ) : (
                    <motion.div
                      animate={alert.type === 'error' ? { scale: [1, 1.1, 1] } : undefined}
                      transition={{ duration: 1, repeat: Infinity }}
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
                  {alert.actions && alert.actions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex gap-2 mt-4"
                    >
                      {alert.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || 'default'}
                          size="sm"
                          onClick={() => {
                            action.onClick();
                            onDismiss();
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Decorative elements for success/achievement */}
              {alert.type === 'success' && (
                <motion.div
                  className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-yellow-400"
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                      }}
                      animate={{
                        x: `${20 + Math.random() * 60}%`,
                        y: `${20 + Math.random() * 60}%`,
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.1,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
