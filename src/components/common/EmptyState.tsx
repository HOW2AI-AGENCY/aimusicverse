/**
 * EmptyState - Reusable animated empty state component
 */
import { motion } from '@/lib/motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
  variant?: 'default' | 'compact' | 'card';
  animated?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
  variant = 'default',
  animated = true,
}: EmptyStateProps) {
  const Container = animated ? motion.div : 'div';

  const containerProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4 },
      }
    : {};

  if (variant === 'compact') {
    return (
      <Container
        {...containerProps}
        className={cn(
          "flex flex-col items-center justify-center text-center py-8",
          className
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
        )}
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3">
            {actions.map((action, i) => (
              <Button
                key={i}
                size="sm"
                variant={action.variant || 'default'}
                onClick={action.onClick}
                className="gap-1.5 h-8 text-xs"
              >
                {action.icon && <action.icon className="w-3.5 h-3.5" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </Container>
    );
  }

  if (variant === 'card') {
    return (
      <Container
        {...containerProps}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          "p-8 rounded-2xl",
          "bg-gradient-to-br from-muted/30 via-background to-muted/20",
          "border border-dashed border-muted-foreground/20",
          className
        )}
      >
        <motion.div
          className="relative mb-5"
          animate={animated ? { y: [0, -5, 0] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-generate/5 flex items-center justify-center border border-primary/20">
            <Icon className="w-8 h-8 text-primary/60" />
          </div>
        </motion.div>
        
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
        )}
        
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {actions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant || (i === 0 ? 'default' : 'outline')}
                onClick={action.onClick}
                className="gap-2"
              >
                {action.icon && <action.icon className="w-4 h-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </Container>
    );
  }

  // Default variant - Full featured
  return (
    <Container
      {...containerProps}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "p-8 sm:p-12 rounded-3xl relative overflow-hidden",
        "bg-gradient-to-br from-primary/5 via-background to-generate/5",
        "border border-dashed border-primary/20",
        className
      )}
    >
      {/* Background decorations */}
      {animated && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-1/4 -left-10 w-40 h-40 rounded-full bg-primary/8 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-10 w-48 h-48 rounded-full bg-generate/8 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>
      )}

      {/* Icon with effects */}
      <motion.div
        className="relative mb-6 z-10"
        initial={animated ? { scale: 0.8 } : undefined}
        animate={animated ? { scale: 1 } : undefined}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
      >
        <motion.div
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-generate/10 flex items-center justify-center shadow-xl border border-primary/20"
          animate={animated ? { rotate: [0, 3, -3, 0] } : undefined}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <motion.div
            animate={animated ? { scale: [1, 1.1, 1] } : undefined}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Icon className="w-12 h-12 text-primary" />
          </motion.div>
        </motion.div>

        {/* Floating particles */}
        {animated && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute w-2.5 h-2.5 rounded-full",
                  i % 2 === 0 ? "bg-generate/40" : "bg-primary/40"
                )}
                style={{
                  top: `${20 + (i % 2) * 60}%`,
                  left: i < 2 ? '-15%' : '115%',
                }}
                animate={{
                  y: [-8, 8, -8],
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        className="space-y-3 mb-6 z-10"
        initial={animated ? { opacity: 0 } : undefined}
        animate={animated ? { opacity: 1 } : undefined}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h3>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        )}
      </motion.div>

      {/* Actions */}
      {actions && actions.length > 0 && (
        <motion.div
          className="flex flex-wrap justify-center gap-3 z-10"
          initial={animated ? { opacity: 0, y: 10 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={{ delay: 0.3 }}
        >
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={i}
                size="lg"
                variant={action.variant || (i === 0 ? 'default' : 'outline')}
                onClick={action.onClick}
                className={cn(
                  "gap-2 rounded-xl",
                  i === 0 && "bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20"
                )}
              >
                {ActionIcon && <ActionIcon className="w-4 h-4" />}
                {action.label}
              </Button>
            );
          })}
        </motion.div>
      )}
    </Container>
  );
}
