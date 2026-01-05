/**
 * TrackSheetHeader - Compact track header with cover image and status icons
 * Shows: public/private, vocal/instrumental, stems, MIDI, notes
 */

import { memo, useState, useEffect } from 'react';
import { Track } from '@/types/track';
import { motion } from '@/lib/motion';
import { 
  Clock, 
  Music2, 
  Globe, 
  Lock, 
  Mic2, 
  Guitar, 
  Layers, 
  FileMusic, 
  Music 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

// Format duration from seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface TrackSheetHeaderProps {
  track: Track;
  className?: string;
}

interface TrackStatus {
  hasMidi: boolean;
  hasNotes: boolean;
  stemCount: number;
}

export const TrackSheetHeader = memo(function TrackSheetHeader({
  track,
  className,
}: TrackSheetHeaderProps) {
  const [status, setStatus] = useState<TrackStatus>({ hasMidi: false, hasNotes: false, stemCount: 0 });
  
  const coverUrl = track.cover_url;
  const duration = track.duration_seconds ? formatDuration(track.duration_seconds) : null;
  const hasHD = !!(track as any).audio_url_hd || (track as any).audio_quality === 'hd';
  const isPublic = track.is_public;
  const isInstrumental = (track as any).is_instrumental;

  // Fetch track status
  useEffect(() => {
    if (!track?.id) return;

    const fetchStatus = async () => {
      const [stemsResult, transcriptionsResult] = await Promise.all([
        supabase
          .from('track_stems')
          .select('id', { count: 'exact', head: true })
          .eq('track_id', track.id),
        supabase
          .from('stem_transcriptions')
          .select('midi_url, pdf_url')
          .eq('track_id', track.id),
      ]);

      const transcriptions = transcriptionsResult.data || [];
      const hasMidi = transcriptions.some(t => !!t.midi_url);
      const hasNotes = transcriptions.some(t => !!t.pdf_url);

      setStatus({
        stemCount: stemsResult.count || 0,
        hasMidi,
        hasNotes,
      });
    };

    fetchStatus();
  }, [track?.id]);

  const statusIcons = [
    {
      show: true,
      icon: isPublic ? Globe : Lock,
      color: isPublic ? 'text-green-500' : 'text-muted-foreground',
      tooltip: isPublic ? 'Публичный' : 'Приватный',
    },
    {
      show: isInstrumental !== undefined,
      icon: isInstrumental ? Guitar : Mic2,
      color: isInstrumental ? 'text-orange-500' : 'text-blue-500',
      tooltip: isInstrumental ? 'Инструментал' : 'С вокалом',
    },
    {
      show: status.stemCount > 0,
      icon: Layers,
      color: 'text-purple-500',
      tooltip: `${status.stemCount} стемов`,
      badge: status.stemCount,
    },
    {
      show: status.hasMidi,
      icon: Music,
      color: 'text-pink-500',
      tooltip: 'MIDI',
    },
    {
      show: status.hasNotes,
      icon: FileMusic,
      color: 'text-amber-500',
      tooltip: 'Ноты',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 py-2",
        className
      )}
    >
      {/* Cover Image - Compact 56x56 */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-14 h-14 rounded-lg overflow-hidden",
          "bg-gradient-to-br from-primary/20 to-primary/5",
          "shadow-md shadow-black/10",
          "ring-1 ring-white/10"
        )}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={track.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-6 h-6 text-primary/60" />
            </div>
          )}
        </div>
        
        {/* HD Badge */}
        {hasHD && (
          <Badge 
            className="absolute -top-1 -right-1 px-1 py-0 text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
          >
            HD
          </Badge>
        )}
      </div>

      {/* Track Info - Compact */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-base font-semibold truncate leading-tight">
          {track.title || 'Без названия'}
        </h3>
        
        {/* Single line meta: style • duration */}
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {track.style && (
            <span className="truncate max-w-[100px]">{track.style}</span>
          )}
          {track.style && duration && <span>•</span>}
          {duration && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
          )}
        </div>

        {/* Status icons row */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <TooltipProvider delayDuration={300}>
            {statusIcons.filter(s => s.show).map((s, idx) => {
              const Icon = s.icon;
              return (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "relative w-6 h-6 rounded-md flex items-center justify-center",
                      "bg-muted/50 hover:bg-muted transition-colors"
                    )}>
                      <Icon className={cn("w-3.5 h-3.5", s.color)} />
                      {s.badge !== undefined && (
                        <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold bg-purple-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                          {s.badge}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {s.tooltip}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
});
