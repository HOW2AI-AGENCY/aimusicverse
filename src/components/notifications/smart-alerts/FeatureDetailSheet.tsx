import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from '@/lib/motion';
import { Check, Lightbulb, ArrowRight } from 'lucide-react';
import { FEATURE_DESCRIPTIONS, FeatureKey } from './FeatureDescriptions';
import { cn } from '@/lib/utils';

interface FeatureDetailSheetProps {
  featureKey: FeatureKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: () => void;
  actionLabel?: string;
}

export function FeatureDetailSheet({ 
  featureKey, 
  open, 
  onOpenChange,
  onAction,
  actionLabel = 'Начать',
}: FeatureDetailSheetProps) {
  if (!featureKey) return null;
  
  const feature = FEATURE_DESCRIPTIONS[featureKey];
  if (!feature) return null;

  const Icon = feature.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4"
          >
            <Icon className="w-8 h-8 text-primary" />
          </motion.div>
          
          <SheetTitle className="text-xl font-bold">
            {feature.title}
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground">
            {feature.description}
          </SheetDescription>
        </SheetHeader>

        {/* Features list */}
        <div className="space-y-3 py-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Возможности
          </h4>
          {feature.features.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-green-500" />
              </div>
              <span className="text-sm text-foreground">{item}</span>
            </motion.div>
          ))}
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "p-4 rounded-xl mt-4",
            "bg-amber-500/10 border border-amber-500/20"
          )}
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                Совет
              </h5>
              <p className="text-sm text-muted-foreground">
                {feature.tips}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action button */}
        {onAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-6 pb-4"
          >
            <Button 
              onClick={() => {
                onAction();
                onOpenChange(false);
              }}
              className="w-full h-12 text-base group relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <span className="relative flex items-center gap-2">
                {actionLabel}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
}
