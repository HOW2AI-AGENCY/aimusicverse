/**
 * StudioTabsMobile - Tab-based mobile studio interface
 * Progressive disclosure with context-aware controls
 */

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SlidersHorizontal, 
  Scissors, 
  Download,
  Music,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useGestures } from '@/hooks/useGestures';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { studioAnimations, getStemColor } from '@/lib/studio-animations';

interface StudioTabsMobileProps {
  trackTitle: string;
  audioUrl: string;
  stems?: Array<{
    id: string;
    type: string;
    url: string;
    volume: number;
    muted: boolean;
    solo: boolean;
  }>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onBack: () => void;
  onStemVolumeChange?: (stemId: string, volume: number) => void;
  onStemMuteToggle?: (stemId: string) => void;
  onStemSoloToggle?: (stemId: string) => void;
}

const tabs = [
  { id: 'player', label: 'Плеер', icon: Play },
  { id: 'mixer', label: 'Микшер', icon: SlidersHorizontal },
  { id: 'editor', label: 'Редактор', icon: Scissors },
  { id: 'export', label: 'Экспорт', icon: Download },
];

export const StudioTabsMobile = memo(function StudioTabsMobile({
  trackTitle,
  audioUrl,
  stems = [],
  currentTime,
  duration,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onBack,
  onStemVolumeChange,
  onStemMuteToggle,
  onStemSoloToggle,
}: StudioTabsMobileProps) {
  const haptic = useHapticFeedback();
  const [activeTab, setActiveTab] = useState('player');
  const [masterVolume, setMasterVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [expandedStem, setExpandedStem] = useState<string | null>(null);

  // Gesture handling
  const { gestureHandlers } = useGestures({
    onSwipeLeft: () => {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id);
        haptic.selectionChanged();
      }
    },
    onSwipeRight: () => {
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1].id);
        haptic.selectionChanged();
      }
    },
  });

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
    haptic.impact('light');
  }, [isPlaying, onPlay, onPause, haptic]);

  const skip = useCallback((seconds: number) => {
    onSeek(Math.max(0, Math.min(duration, currentTime + seconds)));
    haptic.selectionChanged();
  }, [currentTime, duration, onSeek, haptic]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <h1 className="font-semibold truncate">{trackTitle}</h1>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div 
          className="flex-1 overflow-auto"
          {...gestureHandlers}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* Player Tab */}
              <TabsContent value="player" className="mt-0 p-4 space-y-6">
                {/* Waveform placeholder */}
                <div className="h-32 rounded-xl bg-muted/30 flex items-center justify-center">
                  <div className="flex items-end gap-1 h-20">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-primary/60"
                        style={{
                          height: `${20 + Math.random() * 60}%`,
                        }}
                        animate={isPlaying ? {
                          height: [`${20 + Math.random() * 60}%`, `${20 + Math.random() * 60}%`],
                        } : {}}
                        transition={{ duration: 0.3, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </div>

                {/* Time display */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Progress slider */}
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={([value]) => onSeek(value)}
                  className="w-full"
                />

                {/* Playback controls */}
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => skip(-10)}
                    className="h-12 w-12"
                  >
                    <SkipBack className="h-6 w-6" />
                  </Button>

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={togglePlay}
                    className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg"
                    style={{
                      boxShadow: '0 4px 20px hsl(var(--primary) / 0.4)',
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-primary-foreground" />
                    ) : (
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    )}
                  </motion.button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => skip(10)}
                    className="h-12 w-12"
                  >
                    <SkipForward className="h-6 w-6" />
                  </Button>
                </div>

                {/* Volume control */}
                <div className="flex items-center gap-4 px-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : masterVolume * 100]}
                    max={100}
                    onValueChange={([value]) => {
                      setMasterVolume(value / 100);
                      setIsMuted(false);
                    }}
                    className="flex-1"
                  />
                </div>
              </TabsContent>

              {/* Mixer Tab */}
              <TabsContent value="mixer" className="mt-0 p-4 space-y-4">
                {/* Master volume */}
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Master</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(masterVolume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[masterVolume * 100]}
                    max={100}
                    onValueChange={([value]) => setMasterVolume(value / 100)}
                    className="w-full"
                  />
                </div>

                {/* Stem channels */}
                <div className="space-y-3">
                  {stems.map((stem) => {
                    const colors = getStemColor(stem.type);
                    const isExpanded = expandedStem === stem.id;

                    return (
                      <motion.div
                        key={stem.id}
                        layout
                        className={`rounded-xl border overflow-hidden bg-gradient-to-r ${colors.bg}`}
                      >
                        {/* Stem header */}
                        <div
                          className="p-4 flex items-center gap-3 cursor-pointer"
                          onClick={() => setExpandedStem(isExpanded ? null : stem.id)}
                        >
                          <span className="text-2xl">{colors.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium capitalize">{stem.type}</div>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(stem.volume * 100)}%
                            </div>
                          </div>
                          
                          {/* Quick controls */}
                          <Button
                            variant={stem.muted ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStemMuteToggle?.(stem.id);
                            }}
                          >
                            M
                          </Button>
                          <Button
                            variant={stem.solo ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStemSoloToggle?.(stem.id);
                            }}
                          >
                            S
                          </Button>
                          
                          <ChevronRight 
                            className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                          />
                        </div>

                        {/* Expanded controls */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-4 pb-4 space-y-4"
                            >
                              {/* Volume */}
                              <div>
                                <div className="text-xs text-muted-foreground mb-2">Volume</div>
                                <Slider
                                  value={[stem.volume * 100]}
                                  max={100}
                                  onValueChange={([value]) => onStemVolumeChange?.(stem.id, value / 100)}
                                />
                              </div>

                              {/* Effect placeholders */}
                              <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm" className="h-10">
                                  EQ
                                </Button>
                                <Button variant="outline" size="sm" className="h-10">
                                  Comp
                                </Button>
                                <Button variant="outline" size="sm" className="h-10">
                                  Reverb
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {stems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Нет доступных стемов</p>
                      <p className="text-sm">Разделите трек на стемы для микширования</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Editor Tab */}
              <TabsContent value="editor" className="mt-0 p-4">
                <div className="space-y-4">
                  {/* Section timeline placeholder */}
                  <div className="h-24 rounded-xl bg-muted/30 border flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Таймлайн секций</p>
                  </div>

                  {/* Editor tools */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Scissors className="h-6 w-6" />
                      <span className="text-xs">Обрезать</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col gap-2">
                      <Music className="h-6 w-6" />
                      <span className="text-xs">Заменить секцию</span>
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Export Tab */}
              <TabsContent value="export" className="mt-0 p-4">
                <div className="space-y-4">
                  {/* Export options */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Экспорт стемов</h3>
                    {stems.map((stem) => (
                      <div
                        key={stem.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <span className="capitalize">{stem.type}</span>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          MP3
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Скачать все стемы
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Экспорт микса
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tab Bar */}
        <TabsList className="mx-4 mb-4 grid grid-cols-4 h-14">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/10"
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px]">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
});
