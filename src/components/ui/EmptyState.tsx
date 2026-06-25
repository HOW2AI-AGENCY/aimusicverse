/**
 * @deprecated Use `UnifiedEmptyState` from `@/components/ui/unified-empty-state`.
 * Kept temporarily for backwards compatibility — will be removed in Phase 10
 * of the UI unification (`docs/UI_AUDIT.md`).
 *
 * EmptyState - Unified empty state component
 * Feature: UX Improvements
 *
 * Provides consistent empty states across the application
 */

import { memo, type ReactNode } from 'react';
import { motion } from '@/lib/motion';
import { fadeInUp } from '@/lib/motion-variants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Music2, 
  Search, 
  Library, 
  Mic2, 
  Plus,
  type LucideIcon 
} from 'lucide-react';

type EmptyStateVariant = 
  | 'search'
  | 'library'
  | 'tracks'
  | 'projects'
  | 'lyrics'
  | 'custom';

interface EmptyStateProps {
  /** Predefined variant or custom */
  variant?: EmptyStateVariant;
  /** Custom icon */
  icon?: LucideIcon | ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Children for fully custom content */
  children?: ReactNode;
}

const presets: Record<Exclude<EmptyStateVariant, 'custom'>, {
  icon: LucideIcon;
  title: string;
  description: string;
}> = {
  search: {
    icon: Search,
    title: 'Ничего не найдено',
    description: 'Попробуйте изменить поисковый запрос или фильтры',
  },
  library: {
    icon: Library,
    title: 'Библиотека пуста',
    description: 'Создайте свой первый трек с помощью AI',
  },
  tracks: {
    icon: Music2,
    title: 'Нет треков',
    description: 'Здесь будут отображаться ваши музыкальные треки',
  },
  projects: {
    icon: Library,
    title: 'Нет проектов',
    description: 'Создайте проект для организации ваших треков',
  },
  lyrics: {
    icon: Mic2,
    title: 'Нет текстов',
    description: 'Сохранённые тексты песен появятся здесь',
  },
};

export const EmptyState = memo(function EmptyState({
  variant = 'custom',
  icon: customIcon,
  title: customTitle,
  description: customDescription,
  action,
  secondaryAction,
  size = 'md',
  className,
  children,
}: EmptyStateProps) {
  const preset = variant !== 'custom' ? presets[variant] : null;
  
  const Icon = customIcon || preset?.icon;
  const title = customTitle || preset?.title || 'Пусто';
  const description = customDescription || preset?.description;

  const sizeClasses = {
    sm: {
      container: 'py-6 px-4',
      icon: 'w-10 h-10',
      iconWrapper: 'w-16 h-16',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-10 px-6',
      icon: 'w-12 h-12',
      iconWrapper: 'w-20 h-20',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'w-16 h-16',
      iconWrapper: 'w-28 h-28',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
    >
      {/* Icon */}
      {Icon && (
        <div className={cn(
          "rounded-full bg-muted/50 flex items-center justify-center mb-4",
          sizes.iconWrapper
        )}>
          {typeof Icon === 'function' ? (
            <Icon className={cn("text-muted-foreground/70", sizes.icon)} />
          ) : (
            Icon
          )}
        </div>
      )}

      {/* Text content */}
      <h3 className={cn("font-semibold text-foreground mb-1", sizes.title)}>
        {title}
      </h3>
      
      {description && (
        <p className={cn("text-muted-foreground max-w-xs", sizes.description)}>
          {description}
        </p>
      )}

      {/* Custom children */}
      {children}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          {action && (
            <Button
              onClick={action.onClick}
              variant="default"
              size={size === 'sm' ? 'sm' : 'default'}
              haptic="light"
            >
              {action.icon && <action.icon className="w-4 h-4 mr-1.5" />}
              {action.label}
            </Button>
          )}
          
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === 'sm' ? 'sm' : 'default'}
              haptic="light"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
});

/**
 * Compact inline empty state
 */
interface InlineEmptyProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const InlineEmpty = memo(function InlineEmpty({
  message,
  action,
  className,
}: InlineEmptyProps) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-2 py-4 px-3",
      "text-sm text-muted-foreground",
      className
    )}>
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-primary hover:underline font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
});

export default EmptyState;
