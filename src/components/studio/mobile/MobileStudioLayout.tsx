/**
 * Mobile Studio Layout
 * Unified mobile interface for both stem and non-stem modes
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  ChevronLeft, Play, Pause, SkipBack, SkipForward,
  Music2, Mic2, Layers, Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

type MobileTab = 'player' | 'lyrics' | 'sections' | 'actions' | 'mixer';

interface MobileTabConfig {
  id: MobileTab;
  label: string;
  icon: React.ElementType;
  requiresStems?: boolean;
}

const TABS: MobileTabConfig[] = [
  { id: 'player', label: 'Плеер', icon: Music2 },
  { id: 'lyrics', label: 'Текст', icon: Mic2 },
  { id: 'sections', label: 'Секции', icon: Layers },
  { id: 'actions', label: 'Действия', icon: Wand2 },
  { id: 'mixer', label: 'Микшер', icon: Layers, requiresStems: true },
];

interface MobileStudioLayoutProps {
  trackTitle: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasStems?: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkip: (direction: 'back' | 'forward') => void;
  onBack: () => void;
  
  // Tab content
  playerContent: React.ReactNode;
  lyricsContent?: React.ReactNode;
  sectionsContent?: React.ReactNode;
  actionsContent: React.ReactNode;
  mixerContent?: React.ReactNode;
  
  // Optional section replacement availability
  canReplaceSection?: boolean;
}

export function MobileStudioLayout({
  trackTitle,
  isPlaying,
  currentTime,
  duration,
  hasStems = false,
  onTogglePlay,
  onSeek,
  onSkip,
  onBack,
  playerContent,
  lyricsContent,
  sectionsContent,
  actionsContent,
  mixerContent,
  canReplaceSection = true,
}: MobileStudioLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('player');

  // Filter tabs based on available content and stems
  const availableTabs = TABS.filter(tab => {
    if (tab.requiresStems && !hasStems) return false;
    if (tab.id === 'sections' && !canReplaceSection) return false;
    if (tab.id === 'lyrics' && !lyricsContent) return false;
    if (tab.id === 'mixer' && !mixerContent) return false;
    return true;
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'player':
        return playerContent;
      case 'lyrics':
        return lyricsContent;
      case 'sections':
        return sectionsContent;
      case 'actions':
        return actionsContent;
      case 'mixer':
        return mixerContent;
      default:
        return playerContent;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Compact Header */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/50 backdrop-blur shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-sm truncate flex-1">
          {trackTitle}
        </h1>
      </header>

      {/* Mini Player Bar */}
      <div className="px-3 py-2 border-b border-border/30 bg-card/30 shrink-0">
        <div className="flex items-center gap-2">
          {/* Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('back')}
            className="h-8 w-8 shrink-0"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            onClick={onTogglePlay}
            className="h-10 w-10 rounded-full shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip('forward')}
            className="h-8 w-8 shrink-0"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(val) => onSeek(val[0])}
              className="flex-1"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="flex items-center justify-around px-2 py-1 border-t border-border/50 bg-card/80 backdrop-blur shrink-0 safe-area-pb">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
