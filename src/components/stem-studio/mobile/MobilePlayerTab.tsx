/**
 * Mobile Player Tab
 * 
 * Full player view with cover, volume, and track info
 */

import { Volume2, VolumeX, Split, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

interface MobilePlayerTabProps {
  track: Tables<'tracks'>;
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  isSeparating: boolean;
  onSeparate: (mode: 'simple' | 'detailed') => void;
}

export function MobilePlayerTab({
  track,
  volume,
  muted,
  onVolumeChange,
  onMuteToggle,
  isSeparating,
  onSeparate,
}: MobilePlayerTabProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Track Cover */}
      <div className="flex justify-center">
        <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl">
          {track.cover_url ? (
            <img 
              src={track.cover_url} 
              alt={track.title || 'Cover'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-6xl">🎵</span>
            </div>
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center space-y-2">
        <h2 className="text-lg font-bold">{track.title || 'Без названия'}</h2>
        {track.style && (
          <p className="text-sm text-muted-foreground">{track.style}</p>
        )}
        <div className="flex justify-center gap-2">
          {track.has_vocals && (
            <Badge variant="secondary" className="text-xs">🎤 Вокал</Badge>
          )}
          {track.is_instrumental && (
            <Badge variant="secondary" className="text-xs">🎸 Инструментал</Badge>
          )}
          {track.has_stems && (
            <Badge variant="secondary" className="text-xs">🎚️ Стемы</Badge>
          )}
        </div>
      </div>

      {/* Volume Control */}
      <div className="bg-card/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Громкость</span>
          <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMuteToggle}
            className={cn(
              "h-9 w-9 rounded-full flex-shrink-0",
              muted && "text-destructive"
            )}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(v) => onVolumeChange(v[0])}
            className="flex-1"
            disabled={muted}
          />
        </div>
      </div>

      {/* Stem Separation */}
      {!track.has_stems && (
        <div className="bg-card/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Split className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Разделить на стемы</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Разделите трек на отдельные дорожки для профессионального редактирования
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSeparate('simple')}
              disabled={isSeparating}
              className="flex-1"
            >
              2 стема
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onSeparate('detailed')}
              disabled={isSeparating}
              className="flex-1"
            >
              6+ стемов
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
