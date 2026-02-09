/**
 * CreativePresetsSection - Unified section for all creative presets
 * Feature: 032-professional-ui
 * 
 * Three tabs: ТЕКСТ (Lyrics), ТРЕКИ (Tracks), ПРОЕКТЫ (Projects)
 * Mobile-optimized with smooth tab switching
 * Uses design system glass tokens
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Folder, PenTool, Music, Sparkles } from 'lucide-react';
import { ProjectPresetsCarousel } from './ProjectPresetsCarousel';
import { LyricsPresetsRow } from './LyricsPresetsRow';
import { TrackPresetsRow, type TrackPreset } from './TrackPresetsRow';
import { useTelegram } from '@/contexts/TelegramContext';
import { glass } from '@/lib/glass';

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
    <div className={cn("space-y-3 lg:space-y-4", className)}>
      {/* Section header with tabs */}
      <div className="flex items-center justify-between gap-2 lg:gap-4">
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <div className={cn(
            "w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/10",
            "shadow-sm"
          )}>
            <Sparkles className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm lg:text-base font-bold text-foreground">Быстрый старт</span>
            <span className="hidden lg:block text-xs text-muted-foreground">Выберите шаблон для создания</span>
          </div>
        </div>
        
        {/* Tab switcher - 3 tabs with glass styling */}
        <div className={cn("flex items-center gap-0.5 lg:gap-1 p-0.5 lg:p-1 rounded-xl lg:rounded-2xl", glass.subtle)}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "relative px-2.5 sm:px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium",
                  "flex items-center gap-1.5 lg:gap-2 transition-colors",
                  "touch-manipulation min-h-[34px] lg:min-h-[40px]",
                  isActive 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-foreground/80"
                )}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="creativeActiveTab"
                    className="absolute inset-0 bg-background rounded-lg lg:rounded-xl shadow-sm border border-border/60"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 relative z-10" />
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
