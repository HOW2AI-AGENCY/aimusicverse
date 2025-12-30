/**
 * UnifiedStudioMobile - Unified mobile interface for all studio functions
 *
 * Features:
 * - Tab-based navigation (Player, Sections, Vocals, MIDI, Mixer, Actions)
 * - Touch-optimized controls (44x44px minimum)
 * - Swipe gestures for navigation
 * - Telegram safe area support
 * - Haptic feedback
 * - Lazy-loaded tabs for performance
 */

import { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from '@/lib/motion';
import {
  ChevronLeft, Play, Pause, SkipBack, SkipForward,
  Music2, Mic2, Layers, Wand2, Sliders, Sparkles,
  Volume2, VolumeX, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';
import { useTracks } from '@/hooks/useTracks';
import { useUnifiedStudioStore } from '@/stores/useUnifiedStudioStore';
import { useMobileHaptic } from '@/hooks/telegram/useMobileHaptic';

// Lazy-loaded tabs for performance
const LazyPlayerTab = lazy(() => import('./tabs/MobilePlayerTab'));
const LazySectionsTab = lazy(() => import('./tabs/MobileSectionsTab'));
const LazyVocalsTab = lazy(() => import('./tabs/MobileVocalsTab'));
const LazyMidiTab = lazy(() => import('./tabs/MobileMidiTab'));
const LazyMixerTab = lazy(() => import('./tabs/MobileMixerTab'));
const LazyActionsTab = lazy(() => import('./tabs/MobileActionsTab'));

// Tab configuration
type MobileTab = 'player' | 'sections' | 'vocals' | 'midi' | 'mixer' | 'actions';

interface MobileTabConfig {
  id: MobileTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const ALL_TABS: MobileTabConfig[] = [
  { id: 'player', label: 'Плеер', icon: Music2 },
  { id: 'sections', label: 'Секции', icon: Layers },
  { id: 'vocals', label: 'Вокал', icon: Mic2 },
  { id: 'midi', label: 'MIDI', icon: Sparkles },
  { id: 'mixer', label: 'Микшер', icon: Sliders },
  { id: 'actions', label: 'Действия', icon: Wand2 },
];

// Props
interface UnifiedStudioMobileProps {
  mode: 'track' | 'project';
  trackId?: string;
  projectId?: string;
}

// Swipe threshold (px)
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 500;

export function UnifiedStudioMobile({
  mode,
  trackId,
  projectId
}: UnifiedStudioMobileProps) {
  const navigate = useNavigate();
  const haptic = useMobileHaptic();

  // Track mode data
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);

  // Project mode data
  const project = useUnifiedStudioStore(state => state.project);

  // Tab state
  const [activeTab, setActiveTab] = useState<MobileTab>('player');
  const [loadedTabs, setLoadedTabs] = useState<Set<MobileTab>>(new Set(['player']));

  // Player state (shared between track and project modes)
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);

  // Get title based on mode
  const title = mode === 'track'
    ? track?.title || 'Без названия'
    : project?.name || 'Проект';

  // Get available tabs based on mode and track state
  const availableTabs = ALL_TABS.filter(tab => {
    if (mode === 'project') {
      // All tabs available in project mode
      return true;
    }

    // Track mode - filter based on track capabilities
    if (tab.id === 'sections' && (!track?.suno_id || !track?.suno_task_id)) {
      return false; // Section replacement requires Suno data
    }

    if (tab.id === 'vocals' && track?.has_vocals !== false && !track?.is_instrumental) {
      return false; // Vocals tab only for instrumental tracks
    }

    return true;
  });

  // Preload next tab when switching
  useEffect(() => {
    const currentIndex = availableTabs.findIndex(t => t.id === activeTab);
    const nextTab = availableTabs[currentIndex + 1]?.id;

    if (nextTab && !loadedTabs.has(nextTab)) {
      setLoadedTabs(prev => new Set([...prev, nextTab]));
    }
  }, [activeTab, availableTabs, loadedTabs]);

  // Handle tab change with haptic feedback
  const handleTabChange = useCallback((tabId: MobileTab) => {
    if (tabId !== activeTab) {
      haptic.selectionChanged();
      setActiveTab(tabId);
    }
  }, [activeTab, haptic]);

  // Handle swipe navigation between tabs
  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentIndex = availableTabs.findIndex(t => t.id === activeTab);
    let newIndex = currentIndex;

    if (direction === 'left' && currentIndex < availableTabs.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex !== currentIndex) {
      handleTabChange(availableTabs[newIndex].id);
    }
  }, [activeTab, availableTabs, handleTabChange]);

  // Pan gesture handler
  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    const { offset, velocity } = info;

    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD) {
      handleSwipe(offset.x > 0 ? 'right' : 'left');
    }
  }, [handleSwipe]);

  // Player controls
  const togglePlay = useCallback(() => {
    haptic.impact('light');
    setIsPlaying(!isPlaying);
  }, [isPlaying, haptic]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSkip = useCallback((direction: 'back' | 'forward') => {
    haptic.impact('light');
    const skipAmount = 10;
    const newTime = direction === 'back'
      ? Math.max(0, currentTime - skipAmount)
      : Math.min(duration, currentTime + skipAmount);
    handleSeek(newTime);
  }, [currentTime, duration, handleSeek, haptic]);

  const toggleMute = useCallback(() => {
    haptic.impact('light');
    setMuted(!muted);
  }, [muted, haptic]);

  const handleBack = useCallback(() => {
    haptic.impact('light');
    navigate(mode === 'track' ? '/library' : '/studio-v2');
  }, [mode, navigate, haptic]);

  // Render tab content
  const renderTabContent = () => {
    const tabProps = {
      trackId,
      projectId,
      mode,
      isPlaying,
      currentTime,
      duration,
      onSeek: handleSeek,
      onTogglePlay: togglePlay,
    };

    const tabContent = (() => {
      switch (activeTab) {
        case 'player':
          return <LazyPlayerTab {...tabProps} />;
        case 'sections':
          return <LazySectionsTab {...tabProps} />;
        case 'vocals':
          return <LazyVocalsTab {...tabProps} />;
        case 'midi':
          return <LazyMidiTab {...tabProps} />;
        case 'mixer':
          return <LazyMixerTab {...tabProps} />;
        case 'actions':
          return <LazyActionsTab {...tabProps} />;
        default:
          return null;
      }
    })();

    return (
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }>
        {tabContent}
      </Suspense>
    );
  };

  // Telegram safe area styles
  const safeAreaTop = 'max(calc(var(--tg-content-safe-area-inset-top, 0px) + 0.5rem), calc(env(safe-area-inset-top, 0px) + 0.5rem))';
  const safeAreaBottom = 'max(calc(var(--tg-safe-area-inset-bottom, 0px) + 0.5rem), calc(env(safe-area-inset-bottom, 0px) + 0.5rem))';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header with safe area */}
      <header
        className="flex-shrink-0 border-b border-border/30 bg-card/50 backdrop-blur-sm"
        style={{ paddingTop: safeAreaTop }}
      >
        {/* Centered Logo */}
        <div className="flex justify-center py-1.5">
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/e2a6a5f1-c3e6-42bc-95c6-fd65dcb9defe.png"
              alt="MusicVerse AI"
              className="h-8 w-8 rounded-lg shadow-sm"
            />
            <span className="text-xs font-bold text-gradient">MusicVerse AI</span>
          </div>
        </div>

        {/* Title row */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9 rounded-full shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">
              {title}
            </h1>
            {mode === 'project' && project && (
              <p className="text-xs text-muted-foreground">
                {project.tracks.length} дорожек
              </p>
            )}
          </div>

          {mode === 'track' && track?.cover_url && (
            <img
              src={track.cover_url}
              alt=""
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          )}
        </div>
      </header>

      {/* Mini Player Bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-border/30 bg-card/30">
        <div className="flex items-center gap-2">
          {/* Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSkip('back')}
            className="h-8 w-8 shrink-0"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            onClick={togglePlay}
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
            onClick={() => handleSkip('forward')}
            className="h-8 w-8 shrink-0"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Progress */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={(val) => handleSeek(val[0])}
              className="flex-1 min-w-0"
            />
            <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 shrink-0"
          >
            {muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Tab Content with Swipe */}
      <motion.div
        className="flex-1 overflow-hidden"
        onPanEnd={handlePanEnd}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full overflow-y-auto"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Bottom Tab Navigation with safe area */}
      <nav
        className="flex items-center justify-around px-2 py-1 border-t border-border/50 bg-card/80 backdrop-blur-sm shrink-0"
        style={{ paddingBottom: safeAreaBottom }}
      >
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors min-w-[48px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
              style={{ minHeight: '48px', minWidth: '48px' }} // Touch target
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {tab.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
