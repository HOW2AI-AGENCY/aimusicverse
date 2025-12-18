/**
 * Parent Track Link Component
 * Shows a clickable link to the original track this was remixed from
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Music2, ExternalLink, Disc3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ParentTrackLinkProps {
  parentTrackId: string;
  className?: string;
  onTrackClick?: (trackId: string) => void;
}

export function ParentTrackLink({ parentTrackId, className, onTrackClick }: ParentTrackLinkProps) {
  const navigate = useNavigate();
  
  const { data: parentTrack, isLoading } = useQuery({
    queryKey: ['parent-track', parentTrackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, cover_url, style, user_id')
        .eq('id', parentTrackId)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!parentTrackId,
  });
  
  if (isLoading) {
    return (
      <div className={cn("animate-pulse h-16 rounded-lg bg-muted/50", className)} />
    );
  }
  
  if (!parentTrack) {
    return null;
  }
  
  const handleClick = () => {
    if (onTrackClick) {
      onTrackClick(parentTrack.id);
    } else {
      // Navigate to library with track selected
      navigate(`/library?track=${parentTrack.id}`);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg",
        "bg-gradient-to-r from-orange-500/10 to-amber-500/10",
        "border border-orange-500/20",
        "hover:from-orange-500/20 hover:to-amber-500/20",
        "transition-all duration-200 text-left group",
        className
      )}
    >
      {/* Cover */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {parentTrack.cover_url ? (
          <img 
            src={parentTrack.cover_url} 
            alt={parentTrack.title || 'Original track'} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/20">
            <Music2 className="w-6 h-6 text-orange-500/60" />
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
          <Disc3 className="w-3 h-3" />
          <span>Оригинальный трек</span>
        </div>
        <p className="font-medium truncate">{parentTrack.title || 'Без названия'}</p>
        {parentTrack.style && (
          <p className="text-xs text-muted-foreground truncate">{parentTrack.style}</p>
        )}
      </div>
      
      {/* Arrow */}
      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </button>
  );
}
