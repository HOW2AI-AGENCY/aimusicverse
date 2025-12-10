/**
 * GuitarAnalysisFullscreen - Full-screen mobile guitar analysis interface
 * Hero waveform + swipeable tabs + micro-animations
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  Music2, 
  Piano, 
  Guitar, 
  BarChart3,
  Download,
  Wand2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { InteractiveChordWheel } from './InteractiveChordWheel';
import { NoteFlowVisualization } from './NoteFlowVisualization';
import { GuitarFretboardInteractive } from './GuitarFretboardInteractive';
import { ChordTimelineMobile } from './ChordTimelineMobile';
import { useGestures } from '@/hooks/useGestures';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { studioAnimations, getChordColor } from '@/lib/studio-animations';
import type { GuitarRecording } from '@/types/guitar';
import type { Database } from '@/integrations/supabase/types';

interface GuitarAnalysisFullscreenProps {
  recording: GuitarRecording;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseForGeneration?: () => void;
}

const tabs = [
  { id: 'chords', label: 'Аккорды', icon: Music2 },
  { id: 'notes', label: 'Ноты', icon: Piano },
  { id: 'fretboard', label: 'Гриф', icon: Guitar },
  { id: 'analysis', label: 'Анализ', icon: BarChart3 },
];

export const GuitarAnalysisFullscreen = memo(function GuitarAnalysisFullscreen({
  recording,
  open,
  onOpenChange,
  onUseForGeneration,
}: GuitarAnalysisFullscreenProps) {
  const haptic = useHapticFeedback();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [activeTab, setActiveTab] = useState('chords');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(recording.duration_seconds || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentChord, setCurrentChord] = useState<string | null>(null);

  // Parse chord data
  const chords = Array.isArray(recording.chords) ? recording.chords : [];
  const notes = Array.isArray(recording.notes) ? recording.notes : [];

  // Gesture handling for tab switching
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

  // Audio controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  // Update current chord
  useEffect(() => {
    const chord = chords.find(
      (c: any) => currentTime >= c.start && currentTime < c.end
    );
    if (chord && chord.chord !== currentChord) {
      setCurrentChord(chord.chord);
      haptic.selectionChanged();
    }
  }, [currentTime, chords, currentChord, haptic]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    haptic.impact('light');
  }, [isPlaying, haptic]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[95vh] p-0 rounded-t-3xl overflow-hidden"
      >
        <audio ref={audioRef} src={recording.audio_url} preload="metadata" />

        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-b from-background to-background/80 backdrop-blur-xl px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center flex-1">
              <h2 className="font-semibold truncate">
                {recording.title || 'Анализ записи'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {recording.key && `${recording.key} • `}
                {recording.bpm && `${recording.bpm} BPM`}
              </p>
            </div>
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Hero Section - Current Chord + Mini Waveform */}
        <div className="px-4 py-6 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="relative">
            {/* Current chord display */}
            <AnimatePresence mode="wait">
              {currentChord && (
                <motion.div
                  key={currentChord}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="text-center mb-4"
                >
                  <motion.div
                    className="inline-block px-8 py-4 rounded-2xl text-4xl font-bold"
                    style={{
                      backgroundColor: getChordColor(currentChord).replace(')', ', 0.15)').replace('hsl', 'hsla'),
                      color: getChordColor(currentChord),
                      boxShadow: `0 4px 30px ${getChordColor(currentChord).replace(')', ', 0.3)').replace('hsl', 'hsla')}`,
                    }}
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {currentChord}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mini chord timeline */}
            <ChordTimelineMobile
              chords={chords}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          </div>
        </div>

        {/* Playback Controls */}
        <div className="px-4 py-3 flex items-center gap-4 border-b">
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(currentTime)}
          </span>
          
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={([value]) => handleSeek(value)}
            className="flex-1"
          />
          
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(duration)}
          </span>
        </div>

        <div className="px-4 py-3 flex items-center justify-center gap-6 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
            style={{
              boxShadow: '0 4px 20px hsl(var(--primary) / 0.4)',
            }}
          >
            {isPlaying ? (
              <Pause className="h-7 w-7 text-primary-foreground" />
            ) : (
              <Play className="h-7 w-7 text-primary-foreground ml-1" />
            )}
          </motion.button>

          <Slider
            value={[volume * 100]}
            max={100}
            onValueChange={([value]) => {
              setVolume(value / 100);
              if (audioRef.current) {
                audioRef.current.volume = value / 100;
              }
            }}
            className="w-20"
          />
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-3 grid grid-cols-4 h-12">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-1 py-2 data-[state=active]:bg-primary/10"
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-[10px]">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab Content */}
          <div 
            className="flex-1 overflow-auto px-4 py-4"
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
                <TabsContent value="chords" className="mt-0 h-full">
                  <div className="flex flex-col items-center gap-6">
                    <InteractiveChordWheel
                      chords={chords}
                      currentTime={currentTime}
                      duration={duration}
                      onSeek={handleSeek}
                      size={Math.min(280, window.innerWidth - 80)}
                    />
                    
                    {/* Chord progression list */}
                    <div className="w-full space-y-2 pb-20">
                      <h3 className="font-semibold text-sm mb-3">Прогрессия аккордов</h3>
                      <div className="flex flex-wrap gap-2">
                        {chords.map((chord: any, i: number) => (
                          <motion.button
                            key={i}
                            onClick={() => handleSeek(chord.start)}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                              backgroundColor: currentTime >= chord.start && currentTime < chord.end
                                ? getChordColor(chord.chord).replace(')', ', 0.2)').replace('hsl', 'hsla')
                                : 'hsl(var(--muted))',
                              color: currentTime >= chord.start && currentTime < chord.end
                                ? getChordColor(chord.chord)
                                : 'hsl(var(--muted-foreground))',
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {chord.chord}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 h-full">
                  <NoteFlowVisualization
                    notes={notes}
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                  />
                </TabsContent>

                <TabsContent value="fretboard" className="mt-0 h-full">
                  <GuitarFretboardInteractive
                    notes={notes.map((n: any) => ({
                      string: n.string ?? Math.floor(n.pitch / 12) % 6,
                      fret: n.fret ?? n.pitch % 12,
                      time: n.time,
                      duration: n.duration,
                    }))}
                    currentNotes={notes.filter(
                      (n: any) => currentTime >= n.time && currentTime < n.time + (n.duration || 0.5)
                    ).map((n: any) => ({
                      string: n.string ?? Math.floor(n.pitch / 12) % 6,
                      fret: n.fret ?? n.pitch % 12,
                    }))}
                  />
                </TabsContent>

                <TabsContent value="analysis" className="mt-0 space-y-4 pb-20">
                  {/* Analysis metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="text-2xl font-bold">{recording.key || '—'}</div>
                      <div className="text-xs text-muted-foreground">Тональность</div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="text-2xl font-bold">{recording.bpm || '—'}</div>
                      <div className="text-xs text-muted-foreground">BPM</div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="text-2xl font-bold">{recording.time_signature || '4/4'}</div>
                      <div className="text-xs text-muted-foreground">Размер</div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="text-2xl font-bold">{chords.length}</div>
                      <div className="text-xs text-muted-foreground">Аккордов</div>
                    </div>
                  </div>

                  {/* Style description */}
                  {recording.style_description && (
                    <div className="p-4 rounded-xl bg-muted/50">
                      <h4 className="font-medium mb-2">Описание стиля</h4>
                      <p className="text-sm text-muted-foreground">
                        {recording.style_description}
                      </p>
                    </div>
                  )}

                  {/* Generated tags */}
                  {recording.generated_tags && recording.generated_tags.length > 0 && (
                    <div className="p-4 rounded-xl bg-muted/50">
                      <h4 className="font-medium mb-2">Теги для генерации</h4>
                      <div className="flex flex-wrap gap-2">
                        {recording.generated_tags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>

        {/* Bottom Action */}
        {onUseForGeneration && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
            <Button
              className="w-full h-12 text-base"
              onClick={onUseForGeneration}
            >
              <Wand2 className="h-5 w-5 mr-2" />
              Использовать для генерации
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
});
