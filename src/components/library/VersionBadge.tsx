import { Badge } from '@/components/ui/badge';
import { Star, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  versionNumber: number;
  versionCount: number;
  isMaster: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  compact?: boolean;
}

export function VersionBadge({
  versionNumber,
  versionCount,
  isMaster,
  onClick,
  compact = false
}: VersionBadgeProps) {
  // Convert version number to A/B format
  const versionLabel = versionNumber <= 26 
    ? String.fromCharCode(64 + versionNumber) // A, B, C...
    : `V${versionNumber}`;

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5 py-0 h-5 font-medium cursor-pointer",
          isMaster && "border-primary/50 bg-primary/10 text-primary"
        )}
        onClick={onClick}
      >
        <Layers className="h-2.5 w-2.5 mr-0.5" />
        {versionLabel}/{versionCount}
      </Badge>
    );
  }

  return (
    <Badge
      variant={isMaster ? 'default' : 'secondary'}
      className="text-xs cursor-pointer touch-manipulation min-h-[32px] px-3 gap-1"
      onClick={onClick}
    >
      {isMaster && <Star className="h-3 w-3 fill-current" />}
      v{versionNumber}
      {versionCount > 1 && ` (${versionCount})`}
    </Badge>
  );
}
