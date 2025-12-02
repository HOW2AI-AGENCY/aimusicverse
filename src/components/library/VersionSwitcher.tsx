import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { useVersionSwitcher } from '@/hooks/useVersionSwitcher';
import { format } from 'date-fns';
import { Star, Check } from 'lucide-react';
import { triggerHapticFeedback } from '@/lib/mobile-utils';

interface VersionSwitcherProps {
  trackId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVersionSelect?: (versionId: string) => void;
}

export function VersionSwitcher({
  trackId,
  open,
  onOpenChange,
  onVersionSelect
}: VersionSwitcherProps) {
  const { data: versions, isLoading } = useTrackVersions(trackId);
  const { setMasterVersion, isSettingMaster } = useVersionSwitcher();

  const handleVersionSelect = (versionId: string) => {
    triggerHapticFeedback('light');
    onVersionSelect?.(versionId);
    onOpenChange(false);
  };

  const handleSetMaster = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('medium');
    setMasterVersion({ trackId, versionId });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader>
          <SheetTitle>Select Version</SheetTitle>
        </SheetHeader>

        <div className="space-y-2 mt-4 overflow-auto max-h-[calc(60vh-80px)]">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading versions...</div>
          ) : versions?.length === 0 ? (
            <div className="text-center text-muted-foreground">No versions found</div>
          ) : (
            versions?.map((version) => (
              <div
                key={version.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 active:bg-accent transition-colors cursor-pointer"
                onClick={() => handleVersionSelect(version.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">Version {version.version_number || 'N/A'}</p>
                    {version.version_type && (
                      <Badge variant="outline" className="text-xs">
                        {version.version_type}
                      </Badge>
                    )}
                    {version.is_master && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Master
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {format(new Date(version.created_at), 'MMM d, yyyy')}
                    {version.duration_seconds && ` • ${Math.floor(version.duration_seconds / 60)}:${String(Math.floor(version.duration_seconds % 60)).padStart(2, '0')}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!version.is_master && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleSetMaster(version.id, e)}
                      disabled={isSettingMaster}
                      className="touch-manipulation min-h-[44px] gap-1"
                    >
                      <Star className="h-3 w-3" />
                      Set Master
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={version.is_master ? 'default' : 'ghost'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVersionSelect(version.id);
                    }}
                    className="touch-manipulation min-h-[44px] gap-1"
                  >
                    {version.is_master ? (
                      <>
                        <Check className="h-3 w-3" />
                        Current
                      </>
                    ) : (
                      'Use This'
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
