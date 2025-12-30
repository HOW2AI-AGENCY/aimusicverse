/**
 * MobileVocalsTab - Vocals management for mobile
 *
 * Features:
 * - Add vocals to instrumental tracks
 * - View existing vocal stems
 * - Quick actions (download, reference, etc.)
 */

import { useState, Suspense } from 'react';
import { Mic2, Plus, Download, Music2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LazyAddVocalsDrawer } from '@/components/lazy';
import { useTracks } from '@/hooks/useTracks';
import { useStudioData } from '@/hooks/useStudioData';
import { motion } from '@/lib/motion';

interface MobileVocalsTabProps {
  trackId?: string;
  mode: 'track' | 'project';
}

export default function MobileVocalsTab({ trackId, mode }: MobileVocalsTabProps) {
  const { tracks } = useTracks();
  const track = tracks?.find(t => t.id === trackId);
  const { stems } = useStudioData(trackId || '');

  const [addVocalsOpen, setAddVocalsOpen] = useState(false);

  // Find vocal stems
  const vocalStems = stems?.filter(s =>
    s.stem_type === 'vocal' || s.stem_type === 'vocals'
  ) || [];

  const isInstrumental = track?.is_instrumental || track?.has_vocals === false;

  if (mode === 'track' && !track) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-sm">Трек не найден</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-primary" />
            Вокал
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Управление вокальными дорожками
          </p>
        </div>

        {isInstrumental && (
          <Button
            size="sm"
            onClick={() => setAddVocalsOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </Button>
        )}
      </div>

      {/* Info Alert */}
      {isInstrumental && vocalStems.length === 0 && (
        <Alert>
          <Mic2 className="w-4 h-4" />
          <AlertDescription className="text-xs">
            Этот трек инструментальный. Добавьте вокал с помощью AI!
          </AlertDescription>
        </Alert>
      )}

      {!isInstrumental && vocalStems.length === 0 && (
        <Alert>
          <AlertDescription className="text-xs">
            У этого трека нет отдельных вокальных стемов.
            Разделите трек на стемы, чтобы получить вокальную дорожку.
          </AlertDescription>
        </Alert>
      )}

      {/* Vocal Stems List */}
      {vocalStems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Вокальные дорожки ({vocalStems.length})
          </h4>
          {vocalStems.map((stem, index) => (
            <motion.div
              key={stem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-card rounded-lg border border-border/50 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mic2 className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {stem.stem_type === 'vocal' ? 'Вокал' : 'Vocals'}
                </p>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  Stem
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(stem.audio_url, '_blank')}
                className="h-9 w-9 shrink-0"
              >
                <Download className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {isInstrumental && (
        <div className="pt-4 border-t border-border/30">
          <h4 className="text-sm font-medium mb-3">Быстрые действия</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setAddVocalsOpen(true)}
              className="h-auto py-3 flex-col gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">Добавить вокал</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => {}}
              className="h-auto py-3 flex-col gap-2"
            >
              <Music2 className="w-5 h-5" />
              <span className="text-xs">Новая аранжировка</span>
            </Button>
          </div>
        </div>
      )}

      {/* Add Vocals Dialog */}
      {track && (
        <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
          <LazyAddVocalsDrawer
            open={addVocalsOpen}
            onOpenChange={setAddVocalsOpen}
            track={track}
            onSuccess={() => {
              setAddVocalsOpen(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
