import { motion } from 'framer-motion';
import { 
  Play, Sliders, Scissors, Wrench, Download, BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore, selectActiveTab, selectMode } from '@/stores/useStudioStore';
import type { StudioTab } from '@/stores/useStudioStore';

/**
 * StudioTabNavigation - Tab navigation for Studio
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface TabConfig {
  id: StudioTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  stemOnly?: boolean;
}

const tabs: TabConfig[] = [
  { id: 'player', label: 'Плеер', shortLabel: 'Плеер', icon: Play },
  { id: 'mixer', label: 'Микшер', shortLabel: 'Микс', icon: Sliders, stemOnly: true },
  { id: 'editor', label: 'Редактор', shortLabel: 'Ред.', icon: Scissors },
  { id: 'tools', label: 'Инструменты', shortLabel: 'Инстр.', icon: Wrench },
  { id: 'export', label: 'Экспорт', shortLabel: 'Эксп.', icon: Download },
  { id: 'ai', label: 'AI Анализ', shortLabel: 'AI', icon: BrainCircuit },
];

interface StudioTabNavigationProps {
  className?: string;
  variant?: 'default' | 'compact' | 'pills';
}

export function StudioTabNavigation({ 
  className,
  variant = 'default',
}: StudioTabNavigationProps) {
  const activeTab = useStudioStore(selectActiveTab);
  const mode = useStudioStore(selectMode);
  const setActiveTab = useStudioStore((state) => state.setActiveTab);

  // Filter tabs based on mode
  const availableTabs = tabs.filter(tab => !tab.stemOnly || mode === 'stem');

  if (variant === 'pills') {
    return (
      <div className={cn("flex gap-1.5 p-1.5 overflow-x-auto scrollbar-hide", className)}>
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-full",
                "text-xs font-medium whitespace-nowrap transition-colors",
                "min-h-[36px] touch-manipulation",
                isActive 
                  ? "text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="studio-tab-pill"
                  className="absolute inset-0 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex border-b border-border/50", className)}>
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 flex flex-col items-center gap-0.5 py-2",
                "text-xs transition-colors min-h-[52px] touch-manipulation",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.shortLabel}</span>
              {isActive && (
                <motion.div
                  layoutId="studio-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex gap-1 p-1 bg-muted/30 rounded-lg", className)}>
      {availableTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex items-center justify-center gap-2 px-3 py-2 rounded-md",
              "text-sm font-medium transition-colors flex-1",
              "min-h-[40px] touch-manipulation",
              isActive 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="studio-tab-bg"
                className="absolute inset-0 bg-background shadow-sm rounded-md"
                initial={false}
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
