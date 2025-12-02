import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackVersions } from '@/hooks/useTrackVersions';
import { format } from 'date-fns';
import { Star } from 'lucide-react';

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

  const handleVersionSelect = (versionId: string) => {
    onVersionSelect?.(versionId);
    onOpenChange(false);
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
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Version {version.version_type}</p>
                    {version.is_primary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Master
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(version.created_at), 'MMM d, yyyy')}
                    {version.duration_seconds && ` • ${Math.floor(version.duration_seconds / 60)}:${String(Math.floor(version.duration_seconds % 60)).padStart(2, '0')}`}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={version.is_primary ? 'default' : 'outline'}
                  onClick={() => handleVersionSelect(version.id)}
                  className="touch-manipulation"
                >
                  {version.is_primary ? 'Current' : 'Use This'}
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
