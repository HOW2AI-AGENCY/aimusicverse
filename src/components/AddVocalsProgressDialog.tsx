/**
 * AddVocalsProgressDialog - Shows progress and result for add vocals generation
 */

import { motion, AnimatePresence } from '@/lib/motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Pause,
  Library,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddVocalsProgressState, AddVocalsStatus } from '@/hooks/generation/useAddVocalsProgress';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AddVocalsProgressDialogProps {
  open: boolean;
  onClose: () => void;
  state: AddVocalsProgressState;
  onReset: () => void;
}

const STEP_CONFIG: Record<AddVocalsStatus, { icon: React.ElementType; color: string }> = {
  idle: { icon: Mic2, color: 'text-muted-foreground' },
  submitting: { icon: Loader2, color: 'text-primary' },
  pending: { icon: Loader2, color: 'text-yellow-500' },
  processing: { icon: Mic2, color: 'text-primary' },
  streaming_ready: { icon: Mic2, color: 'text-green-500' },
  completed: { icon: CheckCircle2, color: 'text-green-500' },
  error: { icon: AlertCircle, color: 'text-destructive' },
};

export function AddVocalsProgressDialog({
  open,
  onClose,
  state,
  onReset,
}: AddVocalsProgressDialogProps) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const config = STEP_CONFIG[state.status];
  const Icon = config.icon;
  const isLoading = state.status === 'submitting' || state.status === 'pending' || state.status === 'processing';

  // Handle audio playback
  useEffect(() => {
    if (state.completedTrack?.audio_url) {
      audioRef.current = new Audio(state.completedTrack.audio_url);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [state.completedTrack?.audio_url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleGoToLibrary = () => {
    onClose();
    onReset();
    navigate('/library');
  };

  const handleGoToTrack = () => {
    if (state.completedTrack?.id) {
      onClose();
      onReset();
      navigate(`/track/${state.completedTrack.id}`);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onClose();
    if (state.status === 'completed' || state.status === 'error') {
      onReset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-primary" />
            Добавление вокала
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Progress indicator */}
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br",
                state.status === 'error' 
                  ? "from-destructive/20 to-destructive/5 border border-destructive/30"
                  : state.status === 'completed'
                  ? "from-green-500/20 to-green-500/5 border border-green-500/30"
                  : "from-primary/20 to-primary/5 border border-primary/30"
              )}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className={cn("w-10 h-10", config.color)} />
                </motion.div>
              ) : (
                <Icon className={cn("w-10 h-10", config.color)} />
              )}
            </motion.div>

            <div className="text-center space-y-1">
              <p className="font-medium text-lg">{state.message}</p>
              {state.status === 'processing' && (
                <p className="text-sm text-muted-foreground">
                  Обычно это занимает 1-3 минуты
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Progress value={state.progress} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Прогресс</span>
                  <span>{state.progress}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed state - preview player */}
          <AnimatePresence mode="wait">
            {state.status === 'completed' && state.completedTrack && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Track preview card */}
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    {/* Cover or placeholder */}
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                      {state.completedTrack.cover_url ? (
                        <img 
                          src={state.completedTrack.cover_url} 
                          alt="Cover" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Mic2 className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {state.completedTrack.title}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        С вокалом
                      </Badge>
                    </div>

                    {/* Play button */}
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-12 w-12"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleGoToLibrary}
                  >
                    <Library className="w-4 h-4 mr-2" />
                    Библиотека
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleGoToTrack}
                  >
                    Открыть трек
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state */}
          <AnimatePresence mode="wait">
            {state.status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <p className="text-sm text-destructive">
                    {state.error || 'Произошла ошибка при добавлении вокала'}
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4 mr-2" />
                  Закрыть
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
