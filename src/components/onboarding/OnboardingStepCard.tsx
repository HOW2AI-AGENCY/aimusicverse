import { motion } from '@/lib/motion';
import { Check, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { hapticImpact } from '@/lib/haptic';

interface OnboardingStepCardProps {
  step: {
    id: string;
    title: string;
    description: string;
    icon: any;
    route?: string;
    features?: string[];
    tip?: string;
  };
  index: number;
  isActive: boolean;
  isCompleted: boolean;
}

export function OnboardingStepCard({
  step,
  index,
  isActive,
  isCompleted,
}: OnboardingStepCardProps) {
  const navigate = useNavigate();
  const Icon = step.icon;

  const handleTryNow = () => {
    hapticImpact('medium');
    if (step.route) {
      navigate(step.route);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-md mx-auto"
    >
      <div
        className={cn(
          'relative p-6 rounded-2xl border transition-all duration-300',
          isActive
            ? 'bg-card border-primary/30 shadow-lg shadow-primary/5'
            : 'bg-card/50 border-border/50'
        )}
      >
        {/* Step number badge */}
        <Badge
          variant="outline"
          className={cn(
            'absolute -top-3 left-4 px-3',
            isCompleted
              ? 'bg-green-500/10 text-green-500 border-green-500/30'
              : isActive
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isCompleted ? (
            <Check className="w-3 h-3 mr-1" />
          ) : (
            <span className="text-xs font-medium">Шаг {index + 1}</span>
          )}
          {isCompleted && <span className="text-xs">Готово</span>}
        </Badge>

        {/* Icon with animated background */}
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          {isActive && (
            <motion.div
              className="absolute top-8 left-8 w-4 h-4 rounded-full bg-primary/30 blur-md"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl font-bold mb-2"
        >
          {step.title}
        </motion.h3>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-sm leading-relaxed mb-4"
        >
          {step.description}
        </motion.p>

        {/* Features list */}
        {step.features && step.features.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-2 mb-4"
          >
            {step.features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="flex items-start gap-2 text-sm"
              >
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
                <span className="text-muted-foreground">{feature}</span>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {/* Tip callout */}
        {step.tip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/10 mb-4"
          >
            <p className="text-xs text-primary/80">
              💡 <span className="font-medium">Совет:</span> {step.tip}
            </p>
          </motion.div>
        )}

        {/* Try now button */}
        {step.route && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleTryNow}
              className="w-full rounded-xl border-primary/30 hover:bg-primary/10 gap-2"
            >
              <Play className="w-3.5 h-3.5" />
              Попробовать сейчас
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
