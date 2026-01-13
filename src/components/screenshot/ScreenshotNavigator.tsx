import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Camera, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Minimize2, 
  Maximize2,
  Play,
  Pause,
  Eye,
  EyeOff,
  Home,
  Library,
  Wand2,
  FolderOpen,
  User,
  Mic,
  FileText,
  Users,
  Trophy,
  Settings,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGuestMode } from '@/contexts/GuestModeContext';
import { screenshotScreens } from '@/lib/screenshotMockData';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  library: Library,
  generate: Wand2,
  projects: FolderOpen,
  profile: User,
  studio: Mic,
  lyrics: FileText,
  community: Users,
  rewards: Trophy,
  settings: Settings,
  credits: Coins,
};

export const ScreenshotNavigator = () => {
  const { isScreenshotMode, disableScreenshotMode } = useGuestMode();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [autoTourDelay, setAutoTourDelay] = useState(3000);

  // Find current screen index
  const currentIndex = screenshotScreens.findIndex(s => s.path === location.pathname);
  const currentScreen = screenshotScreens[currentIndex] || screenshotScreens[0];

  // Auto-tour effect
  useEffect(() => {
    if (!isAutoTour) return;

    const timer = setTimeout(() => {
      if (currentIndex < screenshotScreens.length - 1) {
        navigate(screenshotScreens[currentIndex + 1].path);
      } else {
        setIsAutoTour(false);
      }
    }, autoTourDelay);

    return () => clearTimeout(timer);
  }, [isAutoTour, currentIndex, navigate, autoTourDelay]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isScreenshotMode) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < screenshotScreens.length - 1) {
          navigate(screenshotScreens[currentIndex + 1].path);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
          navigate(screenshotScreens[currentIndex - 1].path);
        }
      } else if (e.key === 'h' && e.ctrlKey) {
        e.preventDefault();
        setIsHidden(h => !h);
      } else if (e.key === 'Escape') {
        if (isAutoTour) {
          setIsAutoTour(false);
        } else {
          disableScreenshotMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScreenshotMode, currentIndex, navigate, isAutoTour, disableScreenshotMode]);

  if (!isScreenshotMode || isHidden) {
    // Show minimal toggle when hidden
    if (isScreenshotMode && isHidden) {
      return (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4 z-[9999] p-2 rounded-full bg-primary/90 text-primary-foreground shadow-lg"
          onClick={() => setIsHidden(false)}
        >
          <Eye className="w-4 h-4" />
        </motion.button>
      );
    }
    return null;
  }

  const goToPrev = () => {
    if (currentIndex > 0) {
      navigate(screenshotScreens[currentIndex - 1].path);
    }
  };

  const goToNext = () => {
    if (currentIndex < screenshotScreens.length - 1) {
      navigate(screenshotScreens[currentIndex + 1].path);
    }
  };

  const progress = ((currentIndex + 1) / screenshotScreens.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className={cn(
          "fixed z-[9999] bg-background/95 backdrop-blur-lg border border-border rounded-xl shadow-2xl",
          isCollapsed 
            ? "bottom-4 right-4 p-2" 
            : "bottom-4 left-1/2 -translate-x-1/2 p-3 w-[95%] max-w-2xl"
        )}
      >
        {isCollapsed ? (
          // Collapsed view
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">{currentIndex + 1}/{screenshotScreens.length}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCollapsed(false)}
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          // Expanded view
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Screenshot Mode</span>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1} / {screenshotScreens.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsHidden(true)}
                  title="Скрыть (Ctrl+H)"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsCollapsed(true)}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={disableScreenshotMode}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Screen list - horizontal scroll */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {screenshotScreens.map((screen, index) => {
                const Icon = iconMap[screen.id] || Home;
                const isActive = index === currentIndex;
                const isPassed = index < currentIndex;

                return (
                  <button
                    key={screen.id}
                    onClick={() => navigate(screen.path)}
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : isPassed
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium whitespace-nowrap">{screen.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Current screen info & navigation */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentScreen.label}</p>
                <p className="text-xs text-muted-foreground truncate">{currentScreen.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Auto-tour toggle */}
                <Button
                  variant={isAutoTour ? "default" : "outline"}
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setIsAutoTour(!isAutoTour)}
                >
                  {isAutoTour ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span className="text-xs">Стоп</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span className="text-xs">Авто-тур</span>
                    </>
                  )}
                </Button>

                {/* Navigation buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goToNext}
                    disabled={currentIndex === screenshotScreens.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span>← → навигация</span>
              <span>Ctrl+H скрыть</span>
              <span>Esc выход</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
