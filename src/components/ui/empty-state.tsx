/**
 * EmptyState - Unified empty state component
 * Replaces scattered empty state patterns with consistent design
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Music2}
 *   title="Нет треков"
 *   description="Создайте свой первый трек"
 *   action={{ label: "Создать", onClick: () => {} }}
 * />
 * ```
 */

import { memo, ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { emptyStates } from '@/lib/design-tokens';
import { LucideIcon, Sparkles } from 'lucide-react';

// Predefined illustration variants
export type EmptyStateVariant = 
  | 'default' 
  | 'search' 
  | 'error' 
  | 'success' 
  | 'music' 
  | 'loading';

interface EmptyStateProps {
  /** Icon component - required unless emoji is provided */
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
  /** Show compact version for inline use */
  compact?: boolean;
  /** Animate entrance */
  animate?: boolean;
  /** Visual variant for different contexts */
  variant?: EmptyStateVariant;
  /** Custom emoji instead of LucideIcon */
  emoji?: string;
}

const variantStyles: Record<EmptyStateVariant, { iconBg: string; iconColor: string }> = {
  default: { iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
  search: { iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  error: { iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
  success: { iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
  music: { iconBg: 'bg-primary/15', iconColor: 'text-primary' },
  loading: { iconBg: 'bg-muted animate-pulse', iconColor: 'text-muted-foreground' },
};

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  children,
  compact = false,
  animate = true,
  variant = 'default',
  emoji,
}: EmptyStateProps) {
  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {};

  const styles = variantStyles[variant];
  const ActionIcon = action?.icon;
  const IconComponent = Icon || Sparkles;
  
  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        emptyStates.container,
        compact && 'py-6',
        className
      )}
    >
      {/* Icon container with variant styling */}
      <div className={cn(
        emptyStates.icon,
        styles.iconBg,
        compact && 'w-12 h-12 mb-3'
      )}>
        {emoji ? (
          <span className={cn('text-2xl', compact && 'text-xl')}>{emoji}</span>
        ) : (
          <IconComponent className={cn('w-8 h-8', styles.iconColor, compact && 'w-6 h-6')} />
        )}
      </div>
      
      <h3 className={cn(emptyStates.title, compact && 'text-base mb-1')}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(emptyStates.description, compact && 'mb-4')}>
          {description}
        </p>
      )}
      
      {children}
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="gap-2"
            >
              {ActionIcon && <ActionIcon className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Wrapper>
  );
});

/**
 * Specialized empty state presets for common use cases
 */
export const EmptyStatePresets = {
  NoTracks: (props: { onAction: () => void }) => (
    <EmptyState
      emoji="🎵"
      title="Пока нет треков"
      description="Создайте свой первый AI-трек за несколько секунд"
      action={{
        label: "Создать трек",
        onClick: props.onAction,
        icon: Sparkles,
      }}
      variant="music"
    />
  ),
  
  NoSearchResults: (props: { query: string; onClear?: () => void }) => (
    <EmptyState
      emoji="🔍"
      title="Ничего не найдено"
      description={`По запросу "${props.query}" нет результатов`}
      action={props.onClear ? {
        label: "Очистить поиск",
        onClick: props.onClear,
        variant: "outline",
      } : undefined}
      variant="search"
      compact
    />
  ),
  
  NoPlaylists: (props: { onAction: () => void }) => (
    <EmptyState
      emoji="📂"
      title="Нет плейлистов"
      description="Создайте плейлист для организации треков"
      action={{
        label: "Создать плейлист",
        onClick: props.onAction,
      }}
      variant="default"
    />
  ),
  
  Error: (props: { message?: string; onRetry?: () => void }) => (
    <EmptyState
      emoji="😔"
      title="Что-то пошло не так"
      description={props.message || "Попробуйте обновить страницу"}
      action={props.onRetry ? {
        label: "Повторить",
        onClick: props.onRetry,
        variant: "outline",
      } : undefined}
      variant="error"
    />
  ),
  
  NoStems: (props: { onAction: () => void }) => (
    <EmptyState
      emoji="🎚️"
      title="Стемы не разделены"
      description="Разделите трек на вокал, ударные, бас и другие инструменты"
      action={{
        label: "Разделить на стемы",
        onClick: props.onAction,
      }}
      variant="music"
    />
  ),
  
  Offline: () => (
    <EmptyState
      emoji="📡"
      title="Нет подключения"
      description="Проверьте интернет-соединение и попробуйте снова"
      variant="error"
      compact
    />
  ),
};

export default EmptyState;
