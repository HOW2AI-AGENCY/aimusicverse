/**
 * QuickCompare - A/B/C Comparison Component for Section Replacement
 * 
 * Shows Original + Variant A + Variant B (if available) from Suno generation.
 * Coordinates audio playback to prevent overlap.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Play, Pause, RotateCcw, Check, X, Volume2, VolumeX, Sparkles, ChevronLeft, ChevronRight, Save, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStudioAudio, registerStudioAudio, unregisterStudioAudio } from '@/hooks/studio/useStudioAudio';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/player-utils';

type VersionType = 'original' | 'variantA' | 'variantB';
type SaveMode = 'apply' | 'newVersion' | 'newTrack';

interface QuickCompareProps {
  // For mobile sheet mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // For desktop panel mode
  onClose?: () => void;
  // Common props
  originalAudioUrl: string;
  variantAUrl: string;
  variantBUrl?: string; // Optional second variant
  sectionStart: number;
  sectionEnd: number;
  onApply: (selectedVariant: 'variantA' | 'variantB', saveMode?: SaveMode) => void;
  onDiscard: () => void;
}

const panelVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
  exit: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const }
  },
};

const VERSION_CONFIG: Record<VersionType, { label: string; shortLabel: string; color: string; bgColor: string }> = {
  original: { 
    label: 'Оригинал', 
    shortLabel: 'A',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  variantA: { 
    label: 'Вариант A', 
    shortLabel: 'B',
    color: 'text-primary',
    bgColor: 'bg-primary/20'
  },
  variantB: { 
    label: 'Вариант B', 
    shortLabel: 'C',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/20'
  },
};

export function QuickCompare({
  open = true,
  onOpenChange,
  onClose,
  originalAudioUrl,
  variantAUrl,
  variantBUrl,
  sectionStart,
  sectionEnd,
  onApply,
  onDiscard,
}: QuickCompareProps) {
  const isMobile = useIsMobile();
  const [activeVersion, setActiveVersion] = useState<VersionType>('variantA');
  const [selectedVariant, setSelectedVariant] = useState<'variantA' | 'variantB'>('variantA');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(sectionStart);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const haptic = useHapticFeedback();
  
  const { pauseAllAudio } = useStudioAudio('quick-compare');
  
  const originalRef = useRef<HTMLAudioElement | null>(null);
  const variantARef = useRef<HTMLAudioElement | null>(null);
  const variantBRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const sectionDuration = sectionEnd - sectionStart;
  const hasVariantB = !!variantBUrl;
  const versions: VersionType[] = hasVariantB 
    ? ['original', 'variantA', 'variantB'] 
    : ['original', 'variantA'];

  // Get audio ref for current version
  const getAudioRef = useCallback((version: VersionType) => {
    switch (version) {
      case 'original': return originalRef;
      case 'variantA': return variantARef;
      case 'variantB': return variantBRef;
    }
  }, []);

  // Initialize audio elements with proper loading handling
  useEffect(() => {
    if (isMobile && !open) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    // Pause all other studio audio first
    pauseAllAudio();
    
    const loadPromises: Promise<void>[] = [];
    
    // Create and setup original audio
    originalRef.current = new Audio(originalAudioUrl);
    loadPromises.push(new Promise<void>((resolve, reject) => {
      const audio = originalRef.current!;
      audio.oncanplaythrough = () => resolve();
      audio.onerror = () => reject(new Error('Failed to load original audio'));
    }));
    
    // Create and setup variant A audio
    variantARef.current = new Audio(variantAUrl);
    loadPromises.push(new Promise<void>((resolve, reject) => {
      const audio = variantARef.current!;
      audio.oncanplaythrough = () => resolve();
      audio.onerror = () => reject(new Error('Failed to load variant A'));
    }));
    
    // Create and setup variant B audio if available
    if (variantBUrl) {
      variantBRef.current = new Audio(variantBUrl);
      loadPromises.push(new Promise<void>((resolve, reject) => {
        const audio = variantBRef.current!;
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error('Failed to load variant B'));
      }));
    }

    // Set initial volume
    const audios = [originalRef.current, variantARef.current, variantBRef.current].filter(Boolean);
    audios.forEach(audio => {
      if (audio) audio.volume = isMuted ? 0 : volume;
    });

    // Wait for all audio to load
    Promise.all(loadPromises)
      .then(() => {
        setIsLoading(false);
        console.log('[QuickCompare] All audio loaded successfully');
      })
      .catch((error) => {
        console.error('[QuickCompare] Audio load error:', error);
        setLoadError(error.message);
        setIsLoading(false);
      });

    // Register pause handlers
    registerStudioAudio('compare-original', () => originalRef.current?.pause());
    registerStudioAudio('compare-variantA', () => variantARef.current?.pause());
    if (variantBUrl) {
      registerStudioAudio('compare-variantB', () => variantBRef.current?.pause());
    }

    return () => {
      originalRef.current?.pause();
      variantARef.current?.pause();
      variantBRef.current?.pause();
      unregisterStudioAudio('compare-original');
      unregisterStudioAudio('compare-variantA');
      unregisterStudioAudio('compare-variantB');
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [originalAudioUrl, variantAUrl, variantBUrl, isMobile, open, pauseAllAudio, volume, isMuted]);

  // Update volume
  useEffect(() => {
    const effectiveVolume = isMuted ? 0 : volume;
    [originalRef, variantARef, variantBRef].forEach(ref => {
      if (ref.current) ref.current.volume = effectiveVolume;
    });
  }, [volume, isMuted]);

  // For variants, we play from 0 because they are generated sections
  // For original, we play from sectionStart to sectionEnd
  const getStartTime = useCallback((version: VersionType) => {
    return version === 'original' ? sectionStart : 0;
  }, [sectionStart]);

  const getEndTime = useCallback((version: VersionType) => {
    return version === 'original' ? sectionEnd : sectionDuration;
  }, [sectionEnd, sectionDuration]);

  const updateProgress = useCallback(() => {
    const audioRef = getAudioRef(activeVersion);
    const audio = audioRef.current;
    if (audio) {
      const endTime = getEndTime(activeVersion);
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= endTime) {
        audio.pause();
        audio.currentTime = getStartTime(activeVersion);
        setIsPlaying(false);
        setCurrentTime(getStartTime(activeVersion));
      } else if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  }, [activeVersion, isPlaying, getAudioRef, getStartTime, getEndTime]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updateProgress]);

  const pauseAllVersions = useCallback(() => {
    originalRef.current?.pause();
    variantARef.current?.pause();
    variantBRef.current?.pause();
  }, []);

  const togglePlay = async () => {
    if (isLoading) return;
    
    const audioRef = getAudioRef(activeVersion);
    const audio = audioRef.current;
    if (!audio) {
      console.error('[QuickCompare] No audio element for version:', activeVersion);
      return;
    }
    
    haptic.tap();

    // Pause all other versions
    pauseAllVersions();

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Pause global player too
      pauseAllAudio();
      
      const startTime = getStartTime(activeVersion);
      const endTime = getEndTime(activeVersion);
      
      if (audio.currentTime < startTime || audio.currentTime >= endTime) {
        audio.currentTime = startTime;
      }
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('[QuickCompare] Playback failed', error);
      }
    }
  };

  const switchVersion = (version: VersionType) => {
    if (version === activeVersion) return;
    haptic.select();

    // Pause current audio
    pauseAllVersions();
    
    // For switching, calculate relative progress and map to new version's timeline
    const oldStart = getStartTime(activeVersion);
    const oldEnd = getEndTime(activeVersion);
    const newStart = getStartTime(version);
    const newEnd = getEndTime(version);
    
    // Calculate relative position (0-1) in current section
    const relativeProgress = (currentTime - oldStart) / (oldEnd - oldStart);
    // Map to new version's timeline
    const newTime = newStart + relativeProgress * (newEnd - newStart);
    
    const newAudioRef = getAudioRef(version);
    if (newAudioRef.current) {
      newAudioRef.current.currentTime = Math.max(newStart, Math.min(newTime, newEnd));
    }

    setActiveVersion(version);
    setCurrentTime(newTime);
    setIsPlaying(false);
    
    // If switching to a variant, select it
    if (version === 'variantA' || version === 'variantB') {
      setSelectedVariant(version);
    }
  };

  const restart = () => {
    haptic.tap();
    const audioRef = getAudioRef(activeVersion);
    const startTime = getStartTime(activeVersion);
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const toggleMute = () => {
    haptic.tap();
    setIsMuted(!isMuted);
  };

  const handleApply = (saveMode: SaveMode = 'apply') => {
    haptic.success();
    pauseAllVersions();
    onApply(selectedVariant, saveMode);
    if (isMobile && onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleDiscard = () => {
    if (isMobile) {
      haptic.warning();
    } else {
      haptic.tap();
    }
    pauseAllVersions();
    onDiscard();
    if (isMobile && onOpenChange) {
      onOpenChange(false);
    }
  };

  // Calculate progress relative to current version's timeline
  const startTime = getStartTime(activeVersion);
  const endTime = getEndTime(activeVersion);
  const progress = ((currentTime - startTime) / (endTime - startTime)) * 100;

  // Waveform bars visualization
  const waveformBars = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const base = 30;
      const variation = Math.sin(i * 0.4) * 20 + Math.cos(i * 0.8) * 15;
      return Math.max(15, Math.min(80, base + variation + ((i * 7919) % 100) / 100 * 10));
    });
  }, []);

  const getVersionColor = (version: VersionType) => {
    switch (version) {
      case 'original': return 'muted-foreground';
      case 'variantA': return 'primary';
      case 'variantB': return 'violet-500';
    }
  };

  // Mobile version using Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-3xl px-0">
          <SheetHeader className="px-6 pb-4">
            <SheetTitle className="text-center">
              <motion.span 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success text-sm"
              >
                <Sparkles className="w-4 h-4" />
                {hasVariantB ? '2 варианта готовы' : 'Секция заменена'}
              </motion.span>
            </SheetTitle>
          </SheetHeader>

          <div className="px-6 space-y-5 pb-8">
            {/* Time info */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-muted-foreground font-mono"
            >
              {formatTime(sectionStart)} — {formatTime(sectionEnd)}
            </motion.div>

            {/* Version Toggle - 2 or 3 buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn("grid gap-2", hasVariantB ? "grid-cols-3" : "grid-cols-2")}
            >
              {versions.map((version) => {
                const config = VERSION_CONFIG[version];
                const isActive = activeVersion === version;
                const isSelected = version !== 'original' && selectedVariant === version;
                
                return (
                  <motion.button
                    key={version}
                    onClick={() => switchVersion(version)}
                    className={cn(
                      'relative h-20 rounded-xl border-2 transition-all duration-200',
                      'flex flex-col items-center justify-center gap-1.5',
                      isActive
                        ? version === 'original' 
                          ? 'border-muted-foreground/50 bg-muted/50'
                          : version === 'variantA'
                            ? 'border-primary bg-primary/10'
                            : 'border-violet-500 bg-violet-500/10'
                        : 'border-border bg-card hover:border-border/80'
                    )}
                    whileTap={{ scale: 0.97 }}
                  >
                    <motion.span 
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
                        isActive ? config.bgColor : 'bg-muted',
                        isActive ? config.color : 'text-muted-foreground'
                      )}
                      animate={{ scale: isActive ? 1.05 : 1 }}
                    >
                      {config.shortLabel}
                    </motion.span>
                    <span className={cn(
                      'text-xs font-medium',
                      isActive ? config.color : 'text-muted-foreground'
                    )}>
                      {config.label}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-success-foreground" />
                      </motion.div>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="mobileActiveIndicator"
                        className={cn(
                          "absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full",
                          version === 'original' ? 'bg-muted-foreground' :
                          version === 'variantA' ? 'bg-primary' : 'bg-violet-500'
                        )}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Waveform Progress Bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="relative h-12 bg-muted/30 rounded-xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-around px-2">
                  {waveformBars.map((height, i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        'w-1 rounded-full',
                        activeVersion === 'original' ? 'bg-muted-foreground/40' :
                        activeVersion === 'variantA' ? 'bg-primary/40' : 'bg-violet-500/40'
                      )}
                      style={{ height: `${height}%` }}
                      animate={isPlaying && (i / waveformBars.length) * 100 <= progress ? {
                        scaleY: [1, 1.3, 1],
                        opacity: [0.4, 0.8, 0.4]
                      } : {}}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                    />
                  ))}
                </div>
                <motion.div
                  className={cn(
                    'absolute inset-y-0 left-0',
                    activeVersion === 'original' ? 'bg-muted-foreground/20' :
                    activeVersion === 'variantA' ? 'bg-primary/20' : 'bg-violet-500/20'
                  )}
                  style={{ width: `${progress}%` }}
                />
                <motion.div
                  className={cn(
                    'absolute top-0 bottom-0 w-0.5',
                    activeVersion === 'original' ? 'bg-muted-foreground' :
                    activeVersion === 'variantA' ? 'bg-primary' : 'bg-violet-500'
                  )}
                  style={{ left: `${progress}%` }}
                  animate={isPlaying ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono px-1">
                <span>{formatTime(currentTime - startTime)}</span>
                <span>{formatTime(endTime - startTime)}</span>
              </div>
            </motion.div>

            {/* Playback Controls */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4"
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" onClick={restart} className="h-12 w-12 rounded-full">
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={togglePlay}
                  size="icon"
                  disabled={isLoading}
                  className={cn(
                    "h-16 w-16 rounded-full shadow-lg",
                    activeVersion === 'variantA' && 'bg-primary hover:bg-primary/90',
                    activeVersion === 'variantB' && 'bg-violet-500 hover:bg-violet-500/90'
                  )}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isLoading ? 'loading' : isPlaying ? 'pause' : 'play'}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {isLoading ? (
                        <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-7 h-7" />
                      ) : (
                        <Play className="w-7 h-7 ml-1" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" onClick={toggleMute} className="h-12 w-12 rounded-full">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
              </motion.div>
            </motion.div>

            {/* Selection indicator */}
            {hasVariantB && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground"
              >
                Выбран: <span className={cn(
                  "font-medium",
                  selectedVariant === 'variantA' ? 'text-primary' : 'text-violet-500'
                )}>
                  {VERSION_CONFIG[selectedVariant].label}
                </span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 pt-2"
            >
              {/* Main apply button */}
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() => handleApply('apply')}
                  className="w-full h-12 rounded-xl bg-success hover:bg-success/90 gap-2 shadow-lg shadow-success/20"
                >
                  <Check className="w-5 h-5" />
                  Применить
                </Button>
              </motion.div>
              
              {/* Secondary save options */}
              <div className="grid grid-cols-2 gap-2">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    onClick={() => handleApply('newVersion')}
                    className="w-full h-10 rounded-xl gap-1.5 text-xs"
                  >
                    <Save className="w-4 h-4" />
                    Как версию
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    onClick={() => handleApply('newTrack')}
                    className="w-full h-10 rounded-xl gap-1.5 text-xs"
                  >
                    <FilePlus className="w-4 h-4" />
                    Новый трек
                  </Button>
                </motion.div>
              </div>
              
              {/* Cancel button */}
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  variant="ghost"
                  onClick={handleDiscard}
                  className="w-full h-10 rounded-xl text-muted-foreground hover:text-destructive gap-2"
                >
                  <X className="w-4 h-4" />
                  Отменить
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version using panel
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="border-b border-success/30 bg-gradient-to-r from-success/5 via-background to-success/5 overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                  ✓ {hasVariantB ? '2 варианта готовы' : 'Секция заменена'}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(sectionStart)} — {formatTime(sectionEnd)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleDiscard} className="h-8 text-destructive hover:text-destructive">
                  <X className="w-4 h-4 mr-1" />
                  Отменить
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleApply('newVersion')} className="h-8">
                  <Save className="w-4 h-4 mr-1" />
                  Как версию
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleApply('newTrack')} className="h-8">
                  <FilePlus className="w-4 h-4 mr-1" />
                  Новый трек
                </Button>
                <Button size="sm" onClick={() => handleApply('apply')} className="h-8 bg-success hover:bg-success/90">
                  <Check className="w-4 h-4 mr-1" />
                  Применить {selectedVariant === 'variantA' ? 'A' : 'B'}
                </Button>
              </div>
            </div>

            {/* Version Cards */}
            <div className={cn("grid gap-3", hasVariantB ? "grid-cols-3" : "grid-cols-2")}>
              {versions.map((version) => {
                const config = VERSION_CONFIG[version];
                const isActive = activeVersion === version;
                const isSelected = version !== 'original' && selectedVariant === version;
                
                return (
                  <motion.button
                    key={version}
                    onClick={() => switchVersion(version)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all duration-200',
                      'flex flex-col items-center gap-3',
                      isActive
                        ? version === 'original' 
                          ? 'border-muted-foreground/50 bg-muted/30'
                          : version === 'variantA'
                            ? 'border-primary bg-primary/5'
                            : 'border-violet-500 bg-violet-500/5'
                        : 'border-border bg-card hover:border-border/80 hover:bg-accent/30'
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-success-foreground" />
                      </motion.div>
                    )}

                    {/* Version indicator */}
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
                      isActive ? config.bgColor : 'bg-muted',
                      isActive ? config.color : 'text-muted-foreground'
                    )}>
                      {config.shortLabel}
                    </div>

                    {/* Label */}
                    <span className={cn(
                      'text-sm font-medium',
                      isActive ? config.color : 'text-muted-foreground'
                    )}>
                      {config.label}
                    </span>

                    {/* Waveform mini visualization */}
                    <div className="w-full h-8 flex items-center justify-center gap-0.5">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className={cn(
                            'w-1 rounded-full',
                            isActive
                              ? version === 'original' ? 'bg-muted-foreground/60' :
                                version === 'variantA' ? 'bg-primary/60' : 'bg-violet-500/60'
                              : 'bg-muted-foreground/20'
                          )}
                          style={{ 
                            height: `${20 + Math.sin(i * 0.5) * 10 + Math.random() * 10}px` 
                          }}
                          animate={isPlaying && isActive ? {
                            scaleY: [1, 1.2 + Math.random() * 0.3, 1],
                          } : {}}
                          transition={{ 
                            duration: 0.3, 
                            delay: i * 0.03,
                            repeat: isPlaying && isActive ? Infinity : 0 
                          }}
                        />
                      ))}
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="desktopActiveIndicator"
                        className={cn(
                          "absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full",
                          version === 'original' ? 'bg-muted-foreground' :
                          version === 'variantA' ? 'bg-primary' : 'bg-violet-500'
                        )}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Unified Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={restart}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant={isPlaying ? 'secondary' : 'default'}
                  size="icon"
                  disabled={isLoading}
                  className={cn(
                    "h-10 w-10 rounded-full",
                    activeVersion === 'variantA' && 'bg-primary hover:bg-primary/90',
                    activeVersion === 'variantB' && 'bg-violet-500 hover:bg-violet-500/90'
                  )}
                  onClick={togglePlay}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </Button>
              </div>

              <div className="flex-1">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={([val]) => {
                    const newTime = startTime + (val / 100) * (endTime - startTime);
                    setCurrentTime(newTime);
                    const audioRef = getAudioRef(activeVersion);
                    if (audioRef.current) {
                      audioRef.current.currentTime = newTime;
                    }
                  }}
                  className={cn(
                    "[&_[role=slider]]:h-3 [&_[role=slider]]:w-3",
                    activeVersion === 'variantA' && "[&_[role=slider]]:border-primary [&_.range]:bg-primary",
                    activeVersion === 'variantB' && "[&_[role=slider]]:border-violet-500 [&_.range]:bg-violet-500"
                  )}
                />
              </div>

              <span className="text-xs text-muted-foreground font-mono min-w-[80px] text-right">
                {formatTime(currentTime - startTime)} / {formatTime(endTime - startTime)}
              </span>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([val]) => {
                    setVolume(val / 100);
                    if (val > 0) setIsMuted(false);
                  }}
                  className="w-20"
                />
              </div>
            </div>

            {/* Selection hint for 2 variants */}
            {hasVariantB && (
              <div className="text-center text-xs text-muted-foreground">
                Нажмите на вариант для выбора. Текущий выбор:{' '}
                <span className={cn(
                  "font-medium",
                  selectedVariant === 'variantA' ? 'text-primary' : 'text-violet-500'
                )}>
                  {VERSION_CONFIG[selectedVariant].label}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
