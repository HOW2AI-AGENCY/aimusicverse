/**
 * SectionHeader - Unified section header component
 * Feature: 032-professional-ui
 *
 * Updated with design system typography components.
 * Replaces duplicate header patterns across the app.
 */

import { memo, ReactNode } from 'react';
import { LucideIcon, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Heading, Text } from '@/components/ui/typography';

interface SectionHeaderProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Icon color class (e.g., "text-primary", "text-amber-500") */
  iconColor?: string;
  /** Gradient classes for icon background */
  iconGradient?: string;
  /** Main title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Link to navigate when "See All" is clicked */
  showMoreLink?: string;
  /** Custom label for "See All" button (default: "Все") */
  showMoreLabel?: string;
  /** Custom click handler instead of navigation */
  onShowMore?: () => void;
  /** Whether to show the "See All" button */
  showShowMore?: boolean;
  /** Badge to display next to title */
  badge?: {
    label: string | number;
    icon?: LucideIcon;
    variant?: 'default' | 'secondary' | 'outline';
    className?: string;
  };
  /** Custom right slot content */
  rightSlot?: ReactNode;
  /** Size variant */
  variant?: 'default' | 'compact' | 'large';
  /** Animation variant for icon */
  iconAnimation?: 'hover' | 'rotate' | 'none';
  /** Custom icon element instead of LucideIcon */
  customIcon?: ReactNode;
  /** Additional className */
  className?: string;
}

const ICON_SIZES = {
  default: { container: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  compact: { container: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
  large: { container: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
};

export const SectionHeader = memo(function SectionHeader({
  icon: Icon,
  iconColor = 'text-primary',
  iconGradient = 'from-primary/20 to-primary/5',
  title,
  subtitle,
  showMoreLink,
  showMoreLabel = 'Все',
  onShowMore,
  showShowMore = true,
  badge,
  rightSlot,
  variant = 'default',
  iconAnimation = 'hover',
  customIcon,
  className,
}: SectionHeaderProps) {
  const navigate = useNavigate();
  const sizes = ICON_SIZES[variant];

  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore();
    } else if (showMoreLink) {
      navigate(showMoreLink);
    }
  };

  const shouldShowMoreButton = showShowMore && (showMoreLink || onShowMore);
  const ArrowIcon = variant === 'compact' ? ChevronRight : ArrowRight;

  const iconElement = customIcon || (
    <Icon className={cn(sizes.icon, iconColor)} />
  );

  const iconWrapper = iconAnimation === 'rotate' ? (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      {iconElement}
    </motion.div>
  ) : iconElement;

  // Design system typography mapping
  const headingLevel = variant === 'large' ? 'h3' as const : 'h4' as const;
  const textSize = variant === 'compact' ? 'caption' as const : 'caption' as const;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <motion.div
          className={cn(
            sizes.container,
            "bg-gradient-to-br flex items-center justify-center shadow-soft",
            iconGradient
          )}
          whileHover={iconAnimation === 'hover' ? { scale: 1.05, rotate: -5 } : undefined}
        >
          {iconWrapper}
        </motion.div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Heading level={headingLevel} className="truncate">
              {title}
            </Heading>
            {badge && (
              <Badge
                variant={badge.variant || 'secondary'}
                className={cn(
                  "text-[10px] h-4 gap-0.5 shrink-0",
                  badge.className
                )}
              >
                {badge.icon && <badge.icon className="w-2.5 h-2.5" />}
                {badge.label}
              </Badge>
            )}
          </div>
          {subtitle && (
            <Text variant={textSize} className="truncate text-muted-foreground">
              {subtitle}
            </Text>
          )}
        </div>
      </div>

      {rightSlot ? (
        rightSlot
      ) : shouldShowMoreButton ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShowMore}
          className={cn(
            "text-xs text-muted-foreground hover:text-primary gap-1 sm:gap-1.5 rounded-xl shrink-0",
            variant === 'compact' && "h-7 px-2"
          )}
        >
          {showMoreLabel}
          <ArrowIcon className={cn(
            variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'
          )} />
        </Button>
      ) : null}
    </div>
  );
});
