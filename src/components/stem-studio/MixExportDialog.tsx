/**
 * Mix Export Dialog
 * 
 * Dialog for exporting the final mix with effects
 */

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileAudio, 
  Loader2, 
  CheckCircle2,
  XCircle,
  Music2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMixExport } from '@/hooks/useMixExport';
import { StemEffects, defaultStemEffects } from '@/hooks/useStemAudioEngine';
import { TrackStem } from '@/hooks/useTrackStems';
import { toast } from 'sonner';

interface StemState {
  muted: boolean;
  solo: boolean;
  volume: number;
}

interface MixExportDialogProps {
  stems: TrackStem[];
  stemStates: Record<string, StemState>;
  stemEffects: Record<string, { effects: StemEffects } | undefined>;
  masterVolume: number;
  trackTitle: string;
  effectsEnabled: boolean;
}

export function MixExportDialog({
  stems,
  stemStates,
  stemEffects,
  masterVolume,
  trackTitle,
  effectsEnabled,
}: MixExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const {
    isExporting,
    progress,
    progressMessage,
    downloadMix,
    cancelExport,
  } = useMixExport();

  const handleExport = async (format: 'wav' | 'mp3') => {
    setExportStatus('exporting');
    setErrorMessage('');
    
    try {
      // Prepare stem data
      const mixData = stems.map(stem => {
        const state = stemStates[stem.id] || { muted: false, solo: false, volume: 0.85 };
        const effects = stemEffects[stem.id]?.effects || defaultStemEffects;
        
        return {
          id: stem.id,
          audioUrl: stem.audio_url,
          volume: state.volume,
          muted: state.muted,
          solo: state.solo,
          effects: effectsEnabled ? effects : defaultStemEffects,
        };
      });

      await downloadMix(mixData, masterVolume, trackTitle, { format });
      setExportStatus('success');
      toast.success('Микс успешно экспортирован');
      
      // Auto close after success
      setTimeout(() => {
        setIsOpen(false);
        setExportStatus('idle');
      }, 2000);
    } catch (error) {
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ошибка экспорта');
      toast.error('Ошибка экспорта микса');
    }
  };

  const handleCancel = () => {
    cancelExport();
    setExportStatus('idle');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isExporting) {
      // Don't close while exporting
      return;
    }
    setIsOpen(open);
    if (!open) {
      setExportStatus('idle');
      setErrorMessage('');
    }
  };

  // Count active stems
  const hasSolo = Object.values(stemStates).some(s => s.solo);
  const activeStems = stems.filter(stem => {
    const state = stemStates[stem.id];
    if (!state) return true;
    if (hasSolo) return state.solo;
    return !state.muted;
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Music2 className="w-4 h-4" />
          Экспорт микса
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5" />
            Экспорт микса
          </DialogTitle>
          <DialogDescription>
            Скачайте финальный микс со всеми настройками громкости и эффектами
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mix info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Трек:</span>
              <span className="font-medium truncate max-w-[200px]">{trackTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Активных стемов:</span>
              <span className="font-medium">{activeStems.length} / {stems.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Master Volume:</span>
              <span className="font-medium">{Math.round(masterVolume * 100)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Эффекты:</span>
              <span className={cn(
                "font-medium",
                effectsEnabled ? "text-green-500" : "text-muted-foreground"
              )}>
                {effectsEnabled ? 'Включены' : 'Выключены'}
              </span>
            </div>
          </div>

          {/* Export progress */}
          {exportStatus === 'exporting' && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {progressMessage}
              </p>
            </div>
          )}

          {/* Success state */}
          {exportStatus === 'success' && (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-sm font-medium">Микс успешно экспортирован!</p>
            </div>
          )}

          {/* Error state */}
          {exportStatus === 'error' && (
            <div className="flex flex-col items-center gap-2 py-4">
              <XCircle className="w-12 h-12 text-destructive" />
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {exportStatus === 'idle' && (
            <>
              <Button
                variant="outline"
                onClick={() => handleExport('wav')}
                disabled={activeStems.length === 0}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                WAV
              </Button>
              <Button
                variant="default"
                onClick={() => handleExport('mp3')}
                disabled={activeStems.length === 0}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                MP3
              </Button>
            </>
          )}

          {exportStatus === 'exporting' && (
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Отмена
            </Button>
          )}

          {(exportStatus === 'success' || exportStatus === 'error') && (
            <Button 
              variant="outline" 
              onClick={() => setExportStatus('idle')} 
              className="w-full"
            >
              {exportStatus === 'error' ? 'Попробовать снова' : 'Готово'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
