/**
 * MobileStudioTabs - Bottom tab navigation for mobile studio
 * Reusable tab bar component for mobile studio interface
 * With haptic feedback and smooth animations
 */

import { memo, useCallback } from 'react';
import { motion } from '@/lib/motion';
import { 
  Music2, Layers, Sparkles, Sliders, Wand2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useHaptic } from '@/hooks/useHaptic';

export type MobileStudioTab = 'player' | 'tracks' | 'sections' | 'vocals' | 'mixer' | 'actions';

interface TabConfig {
  id: MobileStudioTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const TABS: TabConfig[] = [
  { id: 'player', label: 'Плеер', icon: Music2 },
  { id: 'tracks', label: 'Треки', icon: Layers },
  { id: 'sections', label: 'Секции', icon: Sparkles },
  { id: 'mixer', label: 'Микс', icon: Sliders },
  { id: 'actions', label: 'Ещё', icon: Wand2 },
];

interface MobileStudioTabsProps {
  activeTab: MobileStudioTab;
  onTabChange: (tab: MobileStudioTab) => void;
  trackCount?: number;
  className?: string;
}

export const MobileStudioTabs = memo(function MobileStudioTabs({
  activeTab,
  onTabChange,
  trackCount,
  className,
}: MobileStudioTabsProps) {
  const { patterns } = useHaptic();
  
  // Telegram safe area bottom
  const safeAreaBottom = 'max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))';

  const handleTabChange = useCallback((tab: MobileStudioTab) => {
    if (tab !== activeTab) {
      patterns.select();
      onTabChange(tab);
    }
  }, [activeTab, onTabChange, patterns]);

  return (
    <nav
      className={cn(
        "flex items-center justify-around px-1 py-1.5 border-t border-border/50",
        "bg-card/95 backdrop-blur-md shrink-0",
        className
      )}
      style={{ paddingBottom: `calc(${safeAreaBottom} + 0.25rem)` }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const showBadge = tab.id === 'tracks' && trackCount && trackCount > 0;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all",
              "min-w-[52px] min-h-[52px]", // Increased touch target
              isActive
                ? "text-primary bg-primary/15"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <motion.div 
              className="relative"
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Icon className={cn(
                "w-6 h-6 transition-colors", // Increased icon size from w-5 h-5
                isActive && "text-primary"
              )} />
              {showBadge && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 flex items-center justify-center text-[9px] bg-primary text-primary-foreground"
                >
                  {trackCount}
                </Badge>
              )}
            </motion.div>
            <span className={cn(
              "text-[11px] font-medium", // Slightly larger text
              isActive && "text-primary"
            )}>{tab.label}</span>
            
            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="mobile-tab-indicator"
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
});
