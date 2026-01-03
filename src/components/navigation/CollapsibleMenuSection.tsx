/**
 * CollapsibleMenuSection - Expandable section for MoreMenuSheet
 */

import { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/contexts/TelegramContext';

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  description?: string;
}

interface CollapsibleMenuSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
  defaultExpanded?: boolean;
}

export const CollapsibleMenuSection = memo(function CollapsibleMenuSection({
  title,
  icon: SectionIcon,
  items,
  isActive,
  onNavigate,
  defaultExpanded = true,
}: CollapsibleMenuSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { hapticFeedback } = useTelegram();

  const toggleExpanded = () => {
    hapticFeedback?.('light');
    setExpanded(!expanded);
  };

  return (
    <div className="space-y-1">
      {/* Section Header - Clickable */}
      <button
        onClick={toggleExpanded}
        className="flex items-center justify-between w-full px-1 py-2 group"
      >
        <div className="flex items-center gap-2">
          <SectionIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
        </motion.div>
      </button>

      {/* Section Items */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid gap-1 pl-1">
              {items.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Button
                    variant={isActive(item.path) ? 'secondary' : 'ghost'}
                    className={cn(
                      "w-full justify-start h-auto py-2.5 px-3 gap-3",
                      isActive(item.path) && "bg-primary/10 text-primary border border-primary/20"
                    )}
                    onClick={() => onNavigate(item.path)}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      isActive(item.path) 
                        ? "bg-primary/20" 
                        : "bg-muted"
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0 flex-shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
