/**
 * CreativePresetsSection - Unified section for all creative presets
 * 
 * Three tabs: ТЕКСТ (Lyrics), ТРЕКИ (Tracks), ПРОЕКТЫ (Projects)
 * Mobile-optimized with smooth tab switching
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Folder, PenTool, Music, Sparkles } from 'lucide-react';
import { ProjectPresetsCarousel } from './ProjectPresetsCarousel';
import { LyricsPresetsRow } from './LyricsPresetsRow';
import { TrackPresetsRow, type TrackPreset } from './TrackPresetsRow';
import { useTelegram } from '@/contexts/TelegramContext';

interface CreativePresetsSectionProps {
  className?: string;
  defaultTab?: TabId;
  onTrackPresetSelect?: (preset: TrackPreset) => void;
}

type TabId = 'lyrics' | 'tracks' | 'projects';

const TABS: { id: TabId; label: string; shortLabel: string; icon: typeof Folder }[] = [
  { id: 'lyrics', label: 'Тексты', shortLabel: 'Текст', icon: PenTool },
  { id: 'tracks', label: 'Треки', shortLabel: 'Треки', icon: Music },
  { id: 'projects', label: 'Проекты', shortLabel: 'Проект', icon: Folder },
];

export const CreativePresetsSection = memo(function CreativePresetsSection({
  className,
  defaultTab = 'tracks',
  onTrackPresetSelect,
}: CreativePresetsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const { hapticFeedback } = useTelegram();

  const handleTabChange = useCallback((tab: TabId) => {
    if (tab !== activeTab) {
      hapticFeedback('light');
      setActiveTab(tab);
    }
  }, [activeTab, hapticFeedback]);

  const handleTrackPreset = useCallback((preset: TrackPreset) => {
    if (onTrackPresetSelect) {
      onTrackPresetSelect(preset);
    } else {
      // Default behavior: store in sessionStorage and trigger generation
      sessionStorage.setItem('quickGenrePreset', JSON.stringify({
        description: preset.description,
        hasVocals: preset.hasVocals,
        presetId: preset.id,
      }));
      // Dispatch custom event to open GenerateSheet
      window.dispatchEvent(new CustomEvent('openGenerateSheet'));
    }
  }, [onTrackPresetSelect]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Быстрый старт</span>
        </div>
        
        {/* Tab switcher - 3 tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50 border border-border/30">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative px-2 sm:px-2.5 py-1.5 rounded-md text-xs font-medium",
                  "flex items-center gap-1 sm:gap-1.5 transition-colors",
                  "touch-manipulation min-h-[32px]",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="creativeActiveTab"
                    className="absolute inset-0 bg-background rounded-md shadow-sm border border-border/50"
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                <span className="relative z-10 sm:hidden">{tab.shortLabel}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'lyrics' && <LyricsPresetsRow variant="cards" />}
          {activeTab === 'tracks' && <TrackPresetsRow onSelectPreset={handleTrackPreset} variant="cards" />}
          {activeTab === 'projects' && <ProjectPresetsCarousel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
