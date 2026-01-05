/**
 * TrackSheetHeader - Ultra compact track header
 * 44x44px cover, inline status badges, minimal layout
 */

import { memo } from 'react';
import { Track } from '@/types/track';
import { 
  Clock, 
  Music2, 
  Globe, 
  Lock, 
  Mic2, 
  Guitar, 
  Layers, 
  FileMusic, 
  Music,
  Sparkles,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Format duration from seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Get model display info
function getModelInfo(track: Track): { label: string; color: string } | null {
  const model = (track as any).suno_model || (track as any).model_name;
  if (!model) return null;
  
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('v4')) {
    return { label: 'V4', color: 'text-purple-500' };
  }
  if (modelLower.includes('v3.5')) {
    return { label: 'V3.5', color: 'text-blue-500' };
  }
  if (modelLower.includes('v3')) {
    return { label: 'V3', color: 'text-cyan-500' };
  }
  
  return null;
}

interface TrackSheetHeaderProps {
  track: Track;
  stemCount?: number;
  hasMidi?: boolean;
  hasNotes?: boolean;
  className?: string;
}

interface StatusBadgeProps {
  icon: React.ElementType;
  color: string;
  active?: boolean;
  badge?: number;
  label?: string;
}

const StatusBadge = ({ icon: Icon, color, active = true, badge, label }: StatusBadgeProps) => {
  if (!active) return null;
  return (
    <div className={cn(
      "relative flex items-center gap-0.5 px-1 py-0.5 rounded",
      "bg-muted/60"
    )}>
      <Icon className={cn("w-3 h-3", color)} />
      {label && (
        <span className={cn("text-[8px] font-semibold", color)}>{label}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className="text-[7px] font-bold bg-purple-500 text-white rounded-full w-2.5 h-2.5 flex items-center justify-center leading-none ml-0.5">
          {badge}
        </span>
      )}
    </div>
  );
};

export const TrackSheetHeader = memo(function TrackSheetHeader({
  track,
  stemCount = 0,
  hasMidi = false,
  hasNotes = false,
  className,
}: TrackSheetHeaderProps) {
  const coverUrl = track.cover_url;
  const duration = track.duration_seconds ? formatDuration(track.duration_seconds) : null;
  const hasHD = !!(track as any).audio_url_hd || (track as any).audio_quality === 'hd';
  const isPublic = track.is_public;
  const isInstrumental = (track as any).is_instrumental;
  const modelInfo = getModelInfo(track);

  return (
    <div className={cn("flex gap-3 py-2", className)}>
      {/* Cover Image - Compact 44x44 */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "w-11 h-11 rounded-lg overflow-hidden",
          "bg-gradient-to-br from-primary/20 to-primary/5",
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
              <Music2 className="w-5 h-5 text-primary/60" />
            </div>
          )}
        </div>
        
        {/* HD Badge */}
        {hasHD && (
          <Badge 
            className="absolute -top-1 -right-1 px-0.5 py-0 text-[8px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
          >
            HD
          </Badge>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="text-sm font-semibold truncate leading-tight">
          {track.title || 'Без названия'}
        </h3>
        
        {/* Meta: style • duration */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {track.style && (
            <span className="truncate max-w-[80px]">{track.style}</span>
          )}
          {track.style && duration && <span>•</span>}
          {duration && (
            <span className="flex items-center gap-0.5 flex-shrink-0">
              <Clock className="w-2.5 h-2.5" />
              {duration}
            </span>
          )}
        </div>
      </div>

      {/* Status badges - inline right */}
      <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end max-w-[100px]">
        {/* Model badge */}
        {modelInfo && (
          <StatusBadge 
            icon={modelInfo.label === 'V4' ? Sparkles : Zap} 
            color={modelInfo.color}
            label={modelInfo.label}
          />
        )}
        <StatusBadge 
          icon={isPublic ? Globe : Lock} 
          color={isPublic ? 'text-green-500' : 'text-muted-foreground'} 
        />
        {isInstrumental !== undefined && (
          <StatusBadge 
            icon={isInstrumental ? Guitar : Mic2} 
            color={isInstrumental ? 'text-orange-500' : 'text-blue-500'} 
          />
        )}
        {stemCount > 0 && (
          <StatusBadge 
            icon={Layers} 
            color="text-purple-500" 
            badge={stemCount} 
          />
        )}
        {hasMidi && (
          <StatusBadge 
            icon={Music} 
            color="text-pink-500" 
          />
        )}
        {hasNotes && (
          <StatusBadge 
            icon={FileMusic} 
            color="text-amber-500" 
          />
        )}
      </div>
    </div>
  );
});
