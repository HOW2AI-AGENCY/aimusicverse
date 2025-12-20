/**
 * Unified Studio Header
 * Common header for both stem and non-stem studio modes
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VersionTimeline } from '@/components/stem-studio/VersionTimeline';
import { OfflineIndicator } from '@/components/studio/OfflineIndicator';
import { cn } from '@/lib/utils';

interface StudioHeaderProps {
  trackId: string;
  trackTitle: string;
  hasStems?: boolean;
  stemsCount?: number;
  activeVersionId?: string | null;
  audioUrls?: string[];
  onVersionChange?: (versionId: string, audioUrl: string) => void;
  onShowTutorial?: () => void;
  className?: string;
}

export function StudioHeader({
  trackId,
  trackTitle,
  hasStems,
  stemsCount = 0,
  activeVersionId,
  audioUrls = [],
  onVersionChange,
  onShowTutorial,
  className,
}: StudioHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={cn(
      "flex items-center justify-between px-4 sm:px-6 py-3",
      "border-b border-border/50 bg-card/50 backdrop-blur",
      className
    )}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/library')}
          className="rounded-full h-10 w-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex flex-col">
          <h1 className="font-semibold text-base sm:text-lg truncate max-w-[200px] sm:max-w-xs">
            {trackTitle}
          </h1>
          <div className="flex items-center gap-2">
            {hasStems && stemsCount > 0 ? (
              <Badge variant="secondary" className="text-xs">
                {stemsCount} стемов
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Студия</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Offline indicator */}
        <OfflineIndicator 
          audioUrls={audioUrls}
          className="hidden sm:flex"
        />

        {/* Version Timeline */}
        <VersionTimeline
          trackId={trackId}
          activeVersionId={activeVersionId}
          onVersionChange={onVersionChange}
        />

        {/* Help button */}
        {onShowTutorial && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowTutorial}
            className="h-9 w-9 rounded-full"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
