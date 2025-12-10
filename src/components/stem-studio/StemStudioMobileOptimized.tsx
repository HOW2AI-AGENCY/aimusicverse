/**
 * Optimized Mobile Stem Studio Layout
 * 
 * Minimalist tab-based interface with:
 * - Fixed header (48px)
 * - Tab navigation (44px)
 * - Scrollable content area
 * - Fixed player controls (64px)
 * 
 * Total chrome: ~156px, leaving max screen space for content
 */

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  Music2, Sliders, FileText, Scissors, Settings,
  ChevronLeft, Play, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

type Tab = 'stems' | 'effects' | 'lyrics' | 'editor' | 'settings';

interface StemStudioMobileOptimizedProps {
  trackTitle: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onBack: () => void;
  stemsContent: React.ReactNode;
  effectsContent: React.ReactNode;
  lyricsContent: React.ReactNode;
  editorContent?: React.ReactNode;
  settingsContent: React.ReactNode;
  hasEditor: boolean;
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'stems', label: 'Стемы', icon: Music2 },
  { id: 'effects', label: 'FX', icon: Sliders },
  { id: 'lyrics', label: 'Текст', icon: FileText },
  { id: 'editor', label: 'Редактор', icon: Scissors },
  { id: 'settings', label: 'Еще', icon: Settings },
];

export function StemStudioMobileOptimized({
  trackTitle,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onBack,
  stemsContent,
  effectsContent,
  lyricsContent,
  editorContent,
  settingsContent,
  hasEditor,
}: StemStudioMobileOptimizedProps) {
  const [activeTab, setActiveTab] = useState<Tab>('stems');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const availableTabs = tabs.filter(tab => 
    tab.id !== 'editor' || (hasEditor && editorContent)
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'stems':
        return stemsContent;
      case 'effects':
        return effectsContent;
      case 'lyrics':
        return lyricsContent;
      case 'editor':
        return editorContent;
      case 'settings':
        return settingsContent;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Minimal Header - 48px */}
      <header className="h-12 flex items-center gap-2 px-3 border-b border-border/30 bg-card/50 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{trackTitle}</h1>
        </div>
      </header>

      {/* Tab Navigation - 44px */}
      <nav className="h-11 flex items-center border-b border-border/30 bg-card/30 shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex h-full">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-4 h-full shrink-0 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Compact Player Controls - 64px */}
      <footer className="h-16 shrink-0 bg-card/95 backdrop-blur border-t border-border/50 px-4 safe-area-pb">
        <div className="h-full flex flex-col justify-center gap-2">
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono w-9 shrink-0">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={(v) => onSeek(v[0])}
                className="w-full h-1"
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono w-9 shrink-0 text-right">
              {formatTime(duration)}
            </span>
          </div>

          {/* Play button */}
          <div className="flex justify-center">
            <Button
              onClick={onTogglePlay}
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
