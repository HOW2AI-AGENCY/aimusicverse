/**
 * CreativePresetsSection - Combined section for project and lyrics presets
 * 
 * Unified creative presets area with tabs for Projects and Lyrics
 * Integrates ProjectPresetsCarousel and LyricsPresetsRow
 */

import { memo, useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Folder, PenTool, Sparkles } from 'lucide-react';
import { ProjectPresetsCarousel } from './ProjectPresetsCarousel';
import { LyricsPresetsRow } from './LyricsPresetsRow';
import { useTelegram } from '@/contexts/TelegramContext';

interface CreativePresetsSectionProps {
  className?: string;
  defaultTab?: 'projects' | 'lyrics';
}

type TabId = 'projects' | 'lyrics';

const TABS: { id: TabId; label: string; icon: typeof Folder }[] = [
  { id: 'projects', label: 'Проекты', icon: Folder },
  { id: 'lyrics', label: 'Тексты', icon: PenTool },
];

export const CreativePresetsSection = memo(function CreativePresetsSection({
  className,
  defaultTab = 'projects',
}: CreativePresetsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const { hapticFeedback } = useTelegram();

  const handleTabChange = (tab: TabId) => {
    if (tab !== activeTab) {
      hapticFeedback('light');
      setActiveTab(tab);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Быстрый старт</span>
        </div>
        
        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative px-2.5 py-1.5 rounded-md text-xs font-medium",
                  "flex items-center gap-1.5 transition-colors",
                  "touch-manipulation min-h-[32px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-background rounded-md shadow-sm"
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'projects' && <ProjectPresetsCarousel />}
          {activeTab === 'lyrics' && <LyricsPresetsRow variant="cards" />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
