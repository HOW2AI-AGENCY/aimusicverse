/**
 * AIAgentTabs - Tab-based navigation for AI tools
 * Categories: Создание | Анализ | Оптимизация
 */

import { memo } from 'react';
import { motion } from '@/lib/motion';
import { PenLine, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticImpact } from '@/lib/haptic';

export type AITabId = 'create' | 'analyze' | 'optimize';

interface AIAgentTabsProps {
  activeTab: AITabId;
  onTabChange: (tab: AITabId) => void;
  hasLyrics: boolean;
  disabled?: boolean;
}

const TABS = [
  { 
    id: 'create' as AITabId, 
    label: 'Создать', 
    icon: PenLine,
    color: 'text-blue-400',
    activeColor: 'bg-blue-500/20 border-blue-500/50',
  },
  { 
    id: 'analyze' as AITabId, 
    label: 'Анализ', 
    icon: BarChart3,
    color: 'text-purple-400',
    activeColor: 'bg-purple-500/20 border-purple-500/50',
    requiresLyrics: true,
  },
  { 
    id: 'optimize' as AITabId, 
    label: 'Оптимизация', 
    icon: Sparkles,
    color: 'text-emerald-400',
    activeColor: 'bg-emerald-500/20 border-emerald-500/50',
    requiresLyrics: true,
  },
];

export const AIAgentTabs = memo(function AIAgentTabs({
  activeTab,
  onTabChange,
  hasLyrics,
  disabled = false,
}: AIAgentTabsProps) {
  const handleTabClick = (tabId: AITabId, requiresLyrics?: boolean) => {
    if (disabled) return;
    if (requiresLyrics && !hasLyrics) return;
    
    hapticImpact('light');
    onTabChange(tabId);
  };

  return (
    <div className="flex gap-1.5 p-2 bg-muted/30 rounded-xl">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isDisabled = disabled || (tab.requiresLyrics && !hasLyrics);
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.requiresLyrics)}
            disabled={isDisabled}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg",
              "text-sm font-medium transition-all touch-manipulation",
              isActive 
                ? `${tab.activeColor} border` 
                : "hover:bg-muted/50",
              isDisabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-background/50 rounded-lg"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={cn("w-4 h-4 relative z-10", isActive ? tab.color : "text-muted-foreground")} />
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
});

export default AIAgentTabs;
