/**
 * ComingSoonModal - Beautiful modal for features not yet available
 */
import { motion } from '@/lib/motion';
import { Clock, Bell, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { FEATURE_METADATA, type FeatureKey } from '@/config/app.config';
import { toast } from 'sonner';

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureKey?: FeatureKey;
  customTitle?: string;
  customDescription?: string;
  customIcon?: React.ReactNode;
}

export function ComingSoonModal({
  open,
  onOpenChange,
  featureKey,
  customTitle,
  customDescription,
  customIcon,
}: ComingSoonModalProps) {
  const metadata = featureKey ? FEATURE_METADATA[featureKey] : null;
  
  const title = customTitle || metadata?.name || 'Скоро будет доступно';
  const description = customDescription || metadata?.description || 'Эта функция находится в разработке';
  const icon = customIcon || (metadata?.icon || '🚀');

  const handleNotify = () => {
    toast.success('Мы уведомим вас, когда функция станет доступна!', {
      icon: '🔔',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-primary/20">
        {/* Decorative header */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-generate/10 to-primary/5 overflow-hidden">
          {/* Animated particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full",
                i % 2 === 0 ? "bg-primary/40" : "bg-generate/40"
              )}
              style={{
                left: `${15 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}
          
          {/* Feature icon */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-background border-2 border-primary/30 shadow-xl flex items-center justify-center text-4xl">
              {typeof icon === 'string' ? icon : icon}
            </div>
          </motion.div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="pt-12 pb-6 px-6">
          <DialogHeader className="text-center space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
                  Скоро
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold">
                {title}
              </DialogTitle>
            </motion.div>
            
            <motion.p
              className="text-muted-foreground text-sm leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {description}
            </motion.p>
          </DialogHeader>

          {/* Progress indicator */}
          <motion.div
            className="mt-6 space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Разработка
              </span>
              <span>В процессе</span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-generate to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            className="mt-6 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleNotify}
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <Bell className="w-4 h-4" />
              Уведомить меня
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full gap-2 text-muted-foreground"
            >
              Понятно
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage coming soon modal state
 */
import { useState, useCallback } from 'react';

export function useComingSoon() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<{
    featureKey?: FeatureKey;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
  }>({});

  const showComingSoon = useCallback((
    featureKeyOrTitle: FeatureKey | string,
    description?: string,
    icon?: React.ReactNode
  ) => {
    const isFeatureKey = featureKeyOrTitle in FEATURE_METADATA;
    
    if (isFeatureKey) {
      setCurrentFeature({ featureKey: featureKeyOrTitle as FeatureKey });
    } else {
      setCurrentFeature({
        title: featureKeyOrTitle,
        description,
        icon,
      });
    }
    setIsOpen(true);
  }, []);

  const hideComingSoon = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    setIsOpen,
    showComingSoon,
    hideComingSoon,
    currentFeature,
    ComingSoonModalComponent: () => (
      <ComingSoonModal
        open={isOpen}
        onOpenChange={setIsOpen}
        featureKey={currentFeature.featureKey}
        customTitle={currentFeature.title}
        customDescription={currentFeature.description}
        customIcon={currentFeature.icon}
      />
    ),
  };
}
