import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music2, Sliders, FileText, Scissors, Zap,
  ChevronLeft, Play, Pause, SkipBack, SkipForward
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MobileTab = 'stems' | 'effects' | 'lyrics' | 'edit' | 'actions';

interface StemStudioMobileLayoutProps {
  trackTitle: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onBack: () => void;
  canReplaceSection: boolean;
  stemsPanelContent: React.ReactNode;
  effectsPanelContent: React.ReactNode;
  lyricsPanelContent: React.ReactNode;
  editPanelContent: React.ReactNode;
  actionsPanelContent?: React.ReactNode;
}

const tabs: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: 'stems', label: 'Стемы', icon: Music2 },
  { id: 'effects', label: 'Эффекты', icon: Sliders },
  { id: 'lyrics', label: 'Текст', icon: FileText },
  { id: 'edit', label: 'Редактор', icon: Scissors },
  { id: 'actions', label: 'Действия', icon: Zap },
];

export function StemStudioMobileLayout({
  trackTitle,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onBack,
  canReplaceSection,
  stemsPanelContent,
  effectsPanelContent,
  lyricsPanelContent,
  editPanelContent,
  actionsPanelContent,
}: StemStudioMobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('stems');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const availableTabs = tabs.filter(tab => 
    (tab.id !== 'edit' || canReplaceSection) && 
    (tab.id !== 'actions' || actionsPanelContent)
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'stems':
        return stemsPanelContent;
      case 'effects':
        return effectsPanelContent;
      case 'lyrics':
        return lyricsPanelContent;
      case 'edit':
        return editPanelContent;
      case 'actions':
        return actionsPanelContent;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Compact Header */}
      <header className="flex items-center gap-3 px-3 py-2 border-b border-border/30 bg-card/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{trackTitle}</h1>
          <p className="text-xs text-muted-foreground">Stem Studio</p>
        </div>
      </header>

      {/* Mini Player Bar */}
      <div className="px-3 py-2 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-3">
          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              className="h-8 w-8 rounded-full"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={onTogglePlay}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSeek(Math.min(duration, currentTime + 10))}
              className="h-8 w-8 rounded-full"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex-1">
            <div 
              className="h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percent = x / rect.width;
                onSeek(percent * duration);
              }}
            >
              <motion.div
                className="h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatTime(currentTime)}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <nav className="flex items-center border-t border-border/30 bg-card/80 backdrop-blur-sm">
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[56px] transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
