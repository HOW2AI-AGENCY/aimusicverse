/**
 * Collapsible Section Component
 * Feature: 032-professional-ui
 * 
 * Animated collapsible sections with smooth transitions
 */

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import { triggerHapticFeedback } from '@/lib/mobile-utils';

interface CollapsibleProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  variant?: 'default' | 'card' | 'ghost';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
  badge,
  disabled = false,
  variant = 'default',
  className,
  headerClassName,
  contentClassName,
  onToggle,
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (disabled) return;
    triggerHapticFeedback('light');
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const variantStyles = {
    default: {
      container: 'border-b border-border',
      header: 'py-3',
      content: 'pb-4',
    },
    card: {
      container: 'bg-card border border-border rounded-lg overflow-hidden',
      header: 'p-4 bg-muted/30',
      content: 'p-4 pt-0',
    },
    ghost: {
      container: '',
      header: 'py-2',
      content: 'pb-2',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(styles.container, className)}>
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={cn(
          "w-full flex items-center gap-3",
          "text-left transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          styles.header,
          !disabled && "hover:bg-accent/50",
          disabled && "opacity-50 cursor-not-allowed",
          headerClassName
        )}
      >
        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>

        {/* Icon */}
        {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}

        {/* Title */}
        <span className="flex-1 font-medium text-foreground">
          {title}
        </span>

        {/* Badge */}
        {badge !== undefined && (
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            "bg-muted text-muted-foreground"
          )}>
            {badge}
          </span>
        )}
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div 
              ref={contentRef}
              className={cn(styles.content, contentClassName)}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Accordion Component
 * Multiple collapsible sections with optional single-open mode
 */
interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  singleOpen?: boolean;
  variant?: 'default' | 'card' | 'ghost';
  className?: string;
}

export function Accordion({
  items,
  defaultOpenId,
  singleOpen = false,
  variant = 'default',
  className,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    defaultOpenId ? new Set([defaultOpenId]) : new Set()
  );

  const handleToggle = (id: string, isOpen: boolean) => {
    if (singleOpen) {
      setOpenIds(isOpen ? new Set([id]) : new Set());
    } else {
      const newIds = new Set(openIds);
      if (isOpen) {
        newIds.add(id);
      } else {
        newIds.delete(id);
      }
      setOpenIds(newIds);
    }
  };

  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item) => (
        <Collapsible
          key={item.id}
          title={item.title}
          icon={item.icon}
          badge={item.badge}
          disabled={item.disabled}
          defaultOpen={openIds.has(item.id)}
          variant={variant}
          onToggle={(isOpen) => handleToggle(item.id, isOpen)}
        >
          {item.content}
        </Collapsible>
      ))}
    </div>
  );
}

/**
 * Expandable Text Component
 * Show more/less for long text content
 */
interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableText({
  text,
  maxLines = 3,
  className,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      const lineHeight = parseInt(getComputedStyle(element).lineHeight) || 20;
      const maxHeight = lineHeight * maxLines;
      setNeedsExpansion(element.scrollHeight > maxHeight);
    }
  }, [text, maxLines]);

  const toggle = () => {
    triggerHapticFeedback('light');
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={className}>
      <p
        ref={textRef}
        className={cn(
          "text-muted-foreground transition-all duration-200",
          !isExpanded && needsExpansion && `line-clamp-${maxLines}`
        )}
        style={{
          WebkitLineClamp: !isExpanded && needsExpansion ? maxLines : undefined,
        }}
      >
        {text}
      </p>
      
      {needsExpansion && (
        <button
          type="button"
          onClick={toggle}
          className="text-sm text-primary font-medium mt-1 hover:underline"
        >
          {isExpanded ? 'Свернуть' : 'Показать ещё'}
        </button>
      )}
    </div>
  );
}

export default Collapsible;
