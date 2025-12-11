import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudioStore, selectTrack, selectMode } from '@/stores/useStudioStore';

/**
 * StudioHeader - Unified header component for Studio
 * Part of Sprint 015-A: Unified Studio Architecture
 */

interface StudioHeaderProps {
  onShowTutorial?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function StudioHeader({
  onShowTutorial,
  onExport,
  onSettings,
  rightContent,
  className,
}: StudioHeaderProps) {
  const navigate = useNavigate();
  const track = useStudioStore(selectTrack);
  const mode = useStudioStore(selectMode);

  const handleBack = () => {
    navigate('/library');
  };

  return (
    <header 
      className={cn(
        "flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3",
        "border-b border-border/50 bg-card/50 backdrop-blur-sm",
        "safe-area-inset-top",
        className
      )}
    >
      {/* Left: Back button + Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-full h-9 w-9 sm:h-10 sm:w-10 shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {mode === 'stem' ? 'Stem Studio' : 'Студия'}
            </span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px] h-4 px-1.5",
                mode === 'stem' 
                  ? "border-primary/30 text-primary" 
                  : "border-muted-foreground/30"
              )}
            >
              {mode === 'stem' ? 'PRO' : 'BASIC'}
            </Badge>
          </div>
          <h1 className="text-sm sm:text-base font-semibold truncate max-w-[150px] sm:max-w-[300px] lg:max-w-none">
            {track?.title || 'Без названия'}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {rightContent}
        
        {onShowTutorial && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowTutorial}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
        
        {onExport && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
        
        {onSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
