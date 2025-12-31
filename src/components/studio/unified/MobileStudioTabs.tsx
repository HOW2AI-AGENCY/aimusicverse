/**
 * MobileStudioTabs - Bottom tab navigation for mobile studio
 * Reusable tab bar component for mobile studio interface
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { 
  Music2, Layers, Mic2, Sparkles, Sliders, Wand2 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  { id: 'mixer', label: 'Микшер', icon: Sliders },
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
  // Telegram safe area bottom
  const safeAreaBottom = 'max(var(--tg-safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px))';

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
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all",
              "min-w-[56px] min-h-[48px]", // Touch target
              isActive
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <div className="relative">
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              {showBadge && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[9px]"
                >
                  {trackCount}
                </Badge>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
            
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
