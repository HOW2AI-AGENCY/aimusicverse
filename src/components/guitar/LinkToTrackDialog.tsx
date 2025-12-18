/**
 * LinkToTrackDialog - Dialog to link guitar analysis to an existing track
 * Saves analysis results to storage for access in Stem Studio
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Link2,
  Music2,
  Search,
  Check,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useTracks } from '@/hooks/useTracks';
import { saveGuitarAnalysisForTrack } from '@/hooks/useTrackGuitarAnalysis';
import type { GuitarAnalysisResult } from '@/hooks/useGuitarAnalysis';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LinkToTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResult: GuitarAnalysisResult | null;
}

export function LinkToTrackDialog({
  open,
  onOpenChange,
  analysisResult,
}: LinkToTrackDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { tracks, isLoading } = useTracks();
  const navigate = useNavigate();

  const filteredTracks = tracks?.filter(track =>
    (track.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.style?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleLink = async () => {
    if (!selectedTrackId || !analysisResult) {
      toast.error('Выберите трек');
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveGuitarAnalysisForTrack(selectedTrackId, analysisResult);
      
      if (success) {
        toast.success('Анализ привязан к треку', {
          description: 'Теперь доступен в Stem Studio',
          action: {
            label: 'Открыть',
            onClick: () => {
              onOpenChange(false);
              navigate(`/stem-studio/${selectedTrackId}`);
            },
          },
        });
        onOpenChange(false);
      } else {
        toast.error('Ошибка сохранения анализа');
      }
    } catch (error) {
      toast.error('Ошибка при привязке');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Привязать к треку
          </DialogTitle>
          <DialogDescription>
            Сохраните анализ гитары для использования в Stem Studio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Analysis Summary */}
          {analysisResult && (
            <Card className="p-3 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-muted-foreground mb-1">BPM</div>
                  <div className="font-bold text-orange-400">{analysisResult.bpm}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Key</div>
                  <div className="font-bold text-orange-400">{analysisResult.key}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Chords</div>
                  <div className="font-bold text-orange-400">{analysisResult.chords.length}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Поиск трека</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Введите название или стиль..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Track List */}
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-2 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTracks.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Треки не найдены</p>
                </div>
              ) : (
                filteredTracks.map((track) => {
                  const isSelected = selectedTrackId === track.id;

                  return (
                    <motion.button
                      key={track.id}
                      onClick={() => setSelectedTrackId(track.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "w-full p-3 rounded-lg border-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Cover */}
                        {track.cover_url ? (
                          <img
                            src={track.cover_url}
                            alt={track.title || 'Track'}
                            className="w-12 h-12 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                            <Music2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {track.title || 'Без названия'}
                          </h4>
                          {track.style && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {track.style}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            {track.has_stems && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Stems
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {Math.floor((track.duration_seconds || 0) / 60)}:{String(Math.floor((track.duration_seconds || 0) % 60)).padStart(2, '0')}
                            </Badge>
                          </div>
                        </div>

                        {/* Selected Check */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="shrink-0"
                          >
                            <Check className="w-5 h-5 text-primary" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Отмена
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedTrackId || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Привязать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
