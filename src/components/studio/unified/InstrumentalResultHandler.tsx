/**
 * InstrumentalResultHandler
 * Dialog for handling generated instrumental results
 * Allows A/B version listening and choosing action: replace/add version/new track
 */

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Music2, 
  Replace, 
  GitBranch, 
  PlusCircle,
  Volume2,
  Check,
} from 'lucide-react';
import { StudioTrackVersion } from '@/stores/useUnifiedStudioStore';

export interface InstrumentalResultData {
  newTrackId: string;
  existingInstrumentalId?: string;
  versions: StudioTrackVersion[];
  trackName?: string;
}

interface InstrumentalResultHandlerProps {
  open: boolean;
  onClose: () => void;
  data: InstrumentalResultData | null;
  onApply: (action: 'replace' | 'version' | 'new', selectedVersionLabel: string) => void;
}

export const InstrumentalResultHandler = memo(function InstrumentalResultHandler({
  open,
  onClose,
  data,
  onApply,
}: InstrumentalResultHandlerProps) {
  const [selectedVersion, setSelectedVersion] = useState<string>('A');
  const [saveAction, setSaveAction] = useState<'replace' | 'version' | 'new'>(
    data?.existingInstrumentalId ? 'replace' : 'new'
  );
  const [playingVersion, setPlayingVersion] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when data changes
  useEffect(() => {
    if (data) {
      setSelectedVersion(data.versions[0]?.label || 'A');
      setSaveAction(data.existingInstrumentalId ? 'replace' : 'new');
      setPlayingVersion(null);
    }
  }, [data]);

  // Cleanup audio on unmount or close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayVersion = useCallback((version: StudioTrackVersion) => {
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (playingVersion === version.label) {
      // Toggle off
      setPlayingVersion(null);
      return;
    }

    // Create new audio element
    const audio = new Audio(version.audioUrl);
    audio.volume = 0.8;
    audioRef.current = audio;

    audio.onended = () => setPlayingVersion(null);
    audio.onerror = () => setPlayingVersion(null);

    audio.play()
      .then(() => setPlayingVersion(version.label))
      .catch(() => setPlayingVersion(null));
  }, [playingVersion]);

  const handleApply = useCallback(() => {
    if (!data) return;
    
    // Stop playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    onApply(saveAction, selectedVersion);
  }, [data, saveAction, selectedVersion, onApply]);

  const handleClose = useCallback(() => {
    // Stop playback on close
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onClose();
  }, [onClose]);

  if (!data) return null;

  const hasExisting = !!data.existingInstrumentalId;
  const hasMultipleVersions = data.versions.length > 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-green-400" />
            Инструментал готов!
          </DialogTitle>
          <DialogDescription>
            {hasMultipleVersions 
              ? 'Выберите версию и действие'
              : 'Выберите что сделать с результатом'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Version Selection */}
          {hasMultipleVersions && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Версия</Label>
              <div className="flex gap-2">
                {data.versions.map((version) => (
                  <button
                    key={version.label}
                    onClick={() => {
                      setSelectedVersion(version.label);
                      handlePlayVersion(version);
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                      selectedVersion === version.label
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      selectedVersion === version.label
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {version.label}
                    </div>
                    <AnimatePresence mode="wait">
                      {playingVersion === version.label ? (
                        <motion.div
                          key="pause"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Pause className="w-4 h-4 text-green-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="play"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Play className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {selectedVersion === version.label && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Single version play button */}
          {!hasMultipleVersions && data.versions[0] && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handlePlayVersion(data.versions[0])}
                className="gap-2"
              >
                {playingVersion === data.versions[0].label ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Пауза
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Прослушать
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Действие</Label>
            <RadioGroup 
              value={saveAction} 
              onValueChange={(v) => setSaveAction(v as typeof saveAction)}
              className="space-y-2"
            >
              {/* Replace option - only if existing instrumental */}
              {hasExisting && (
                <label 
                  htmlFor="action-replace"
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    saveAction === 'replace' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="replace" id="action-replace" className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Replace className="w-4 h-4 text-orange-400" />
                      <span className="font-medium text-sm">Заменить текущий</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Заменит аудио текущего инструментала
                    </p>
                  </div>
                </label>
              )}

              {/* Add as version - only if existing instrumental */}
              {hasExisting && (
                <label 
                  htmlFor="action-version"
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    saveAction === 'version' 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="version" id="action-version" className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-sm">Добавить как версию</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Сохранит оригинал, добавит новую версию
                    </p>
                  </div>
                </label>
              )}

              {/* Create new track */}
              <label 
                htmlFor="action-new"
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  saveAction === 'new' 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value="new" id="action-new" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-green-400" />
                    <span className="font-medium text-sm">
                      {hasExisting ? 'Создать новый трек' : 'Добавить в проект'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasExisting 
                      ? 'Добавит как отдельную дорожку'
                      : 'Добавит инструментал в проект'
                    }
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button onClick={handleApply} className="gap-2">
            <Check className="w-4 h-4" />
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
