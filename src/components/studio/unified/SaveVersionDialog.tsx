/**
 * SaveVersionDialog
 * Dialog for saving current studio mix as a new track version
 */

import { memo, useState, useCallback } from 'react';
import { 
  Save, Loader2, Volume2, Layers, Download, 
  Check, AlertCircle 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { StudioTrack } from '@/stores/useUnifiedStudioStore';

interface SaveVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sourceTrackId?: string;
  tracks: StudioTrack[];
  masterVolume: number;
  onVersionSaved?: (version: { id: string; audioUrl: string; label: string }) => void;
}

type SaveMode = 'snapshot' | 'merge' | 'export';

export const SaveVersionDialog = memo(function SaveVersionDialog({
  open,
  onOpenChange,
  projectId,
  sourceTrackId,
  tracks,
  masterVolume,
  onVersionSaved,
}: SaveVersionDialogProps) {
  const [mode, setMode] = useState<SaveMode>('snapshot');
  const [versionLabel, setVersionLabel] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const defaultLabel = `Version ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  const handleSave = useCallback(async () => {
    if (!sourceTrackId) {
      toast.error('Нет исходного трека');
      return;
    }

    setIsSaving(true);
    setProgress(10);
    setError(null);

    try {
      const label = versionLabel.trim() || defaultLabel;

      if (mode === 'snapshot') {
        setProgress(30);

        const mainTrack = tracks.find(t => t.type === 'main') || tracks[0];
        const audioUrl = mainTrack?.audioUrl || mainTrack?.clips?.[0]?.audioUrl;

        if (!audioUrl) {
          throw new Error('Нет аудио для сохранения');
        }

        setProgress(50);

        const { data: versionId, error: ensureError } = await supabase.rpc('ensure_track_version', {
          p_track_id: sourceTrackId,
          p_audio_url: audioUrl,
          p_label: label,
          p_version_type: 'snapshot',
        });

        if (ensureError) throw ensureError;

        setProgress(100);
        toast.success('Версия сохранена');
        onVersionSaved?.({ 
          id: versionId as string, 
          audioUrl, 
          label 
        });
        onOpenChange(false);

      } else if (mode === 'merge') {
        setProgress(20);

        const stemsToMerge = tracks
          .filter(t => t.status !== 'pending' && t.status !== 'failed')
          .map(t => ({
            audioUrl: t.audioUrl || t.clips?.[0]?.audioUrl,
            volume: t.muted ? 0 : t.volume,
            pan: t.pan,
            solo: t.solo,
          }))
          .filter(s => s.audioUrl);

        if (stemsToMerge.length === 0) {
          throw new Error('Нет стемов для объединения');
        }

        setProgress(40);

        const { data, error: mergeError } = await supabase.functions.invoke('merge-stems', {
          body: {
            stems: stemsToMerge,
            masterVolume,
            trackId: sourceTrackId,
            versionLabel: label,
            projectId,
          },
        });

        if (mergeError) throw mergeError;

        setProgress(80);

        const { data: versionId, error: ensureError } = await supabase.rpc('ensure_track_version', {
          p_track_id: sourceTrackId,
          p_audio_url: data.audioUrl,
          p_label: label,
          p_version_type: 'merged',
        });

        if (ensureError) throw ensureError;

        setProgress(100);
        toast.success('Микс сохранён как новая версия');
        onVersionSaved?.({ 
          id: versionId as string, 
          audioUrl: data.audioUrl, 
          label 
        });
        onOpenChange(false);

      } else if (mode === 'export') {
        setProgress(20);

        const stemsToMerge = tracks
          .filter(t => t.status !== 'pending' && t.status !== 'failed')
          .map(t => ({
            audioUrl: t.audioUrl || t.clips?.[0]?.audioUrl,
            volume: t.muted ? 0 : t.volume,
            pan: t.pan,
            solo: t.solo,
          }))
          .filter(s => s.audioUrl);

        setProgress(40);

        const { data, error: mergeError } = await supabase.functions.invoke('merge-stems', {
          body: {
            stems: stemsToMerge,
            masterVolume,
            format: 'wav',
          },
        });

        if (mergeError) throw mergeError;

        setProgress(80);

        const response = await fetch(data.audioUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${label || 'mix'}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setProgress(100);
        toast.success('Микс экспортирован');
        onOpenChange(false);
      }

    } catch (err) {
      console.error('Save version error:', err);
      const message = err instanceof Error ? err.message : 'Ошибка сохранения';
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setProgress(0);
    }
  }, [mode, versionLabel, description, tracks, masterVolume, sourceTrackId, projectId, onVersionSaved, onOpenChange, defaultLabel]);

  const stemCount = tracks.filter(t => 
    ['vocal', 'instrumental', 'drums', 'bass', 'other'].includes(t.type) &&
    t.status !== 'pending'
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Сохранить версию
          </DialogTitle>
          <DialogDescription>
            Сохраните текущее состояние как новую версию трека
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as SaveMode)}>
            <div className="space-y-3">
              <div className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                mode === 'snapshot' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )} onClick={() => setMode('snapshot')}>
                <RadioGroupItem value="snapshot" id="snapshot" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="snapshot" className="font-medium cursor-pointer">
                    Сохранить snapshot
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Сохранить текущий основной аудио как версию
                  </p>
                </div>
                <Layers className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                mode === 'merge' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                stemCount === 0 && 'opacity-50 cursor-not-allowed'
              )} onClick={() => stemCount > 0 && setMode('merge')}>
                <RadioGroupItem value="merge" id="merge" className="mt-0.5" disabled={stemCount === 0} />
                <div className="flex-1">
                  <Label htmlFor="merge" className={cn('font-medium', stemCount === 0 ? 'cursor-not-allowed' : 'cursor-pointer')}>
                    Объединить стемы
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Смикшировать {stemCount} стемов в одно аудио
                  </p>
                </div>
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                mode === 'export' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                stemCount === 0 && 'opacity-50 cursor-not-allowed'
              )} onClick={() => stemCount > 0 && setMode('export')}>
                <RadioGroupItem value="export" id="export" className="mt-0.5" disabled={stemCount === 0} />
                <div className="flex-1">
                  <Label htmlFor="export" className={cn('font-medium', stemCount === 0 ? 'cursor-not-allowed' : 'cursor-pointer')}>
                    Экспорт мастера
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Скачать микс как WAV (без создания версии)
                  </p>
                </div>
                <Download className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </RadioGroup>

          {mode !== 'export' && (
            <div className="space-y-2">
              <Label htmlFor="versionLabel">Название версии</Label>
              <Input
                id="versionLabel"
                placeholder={defaultLabel}
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
            </div>
          )}

          {mode !== 'export' && (
            <div className="space-y-2">
              <Label htmlFor="description">Описание (опционально)</Label>
              <Textarea
                id="description"
                placeholder="Например: После редактирования вокала"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {isSaving && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === 'merge' ? 'Микширование...' : mode === 'export' ? 'Экспорт...' : 'Сохранение...'}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : mode === 'export' ? (
              <Download className="w-4 h-4 mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {mode === 'export' ? 'Скачать' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
